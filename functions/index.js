// functions/index.js — Firebase Cloud Function v2 — PRODUÇÃO SEGURA

const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { setGlobalOptions } = require('firebase-functions/v2');
const admin = require('firebase-admin');
const https = require('https');
const crypto = require('crypto');

admin.initializeApp();
setGlobalOptions({ region: 'us-central1' });

const googleMapsKey = defineSecret('GOOGLE_MAPS_API_KEY');

const rateLimitMap = new Map();
const RATE_LIMIT_MAX    = 10;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000;

function checkRateLimit(uid) {
  const now   = Date.now();
  const entry = rateLimitMap.get(uid);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(uid, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

function sanitizar(str, maxLen = 100) {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLen).replace(/[<>{}[\]\\]/g, '');
}

function validarInput(nicho, cidade, estado, maxLeads) {
  const erros = [];
  if (!nicho  || nicho.length  < 2) erros.push('nicho inválido');
  if (!cidade || cidade.length < 2) erros.push('cidade inválida');
  if (estado  && !/^[A-Z]{2}$/.test(estado)) erros.push('estado inválido');
  if (isNaN(maxLeads) || maxLeads < 1 || maxLeads > 20) erros.push('maxLeads deve ser 1-20');
  return erros;
}

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('Resposta inválida da API')); }
      });
    }).on('error', reject);
  });
}

async function buscarEmpresas(nicho, cidade, estado, apiKey) {
  const query = encodeURIComponent(`${nicho} em ${cidade} ${estado} Brasil`);
  const url   = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&language=pt-BR&region=br&key=${apiKey}`;
  const data  = await httpsGet(url);
  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(`Google Places erro: ${data.status} — ${data.error_message || ''}`);
  }
  return data.results || [];
}

async function buscarDetalhes(placeId, apiKey) {
  const fields = 'name,formatted_phone_number,website,url';
  const url    = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&language=pt-BR&key=${apiKey}`;
  const data   = await httpsGet(url);
  return data.result || {};
}

function analisarSite(site) {
  if (!site) return { quality: 'none' };
  const ruins = ['linktree', 'linktr.ee', 'bio.link', 'beacons.ai', 'sites.google.com'];
  if (ruins.some(r => site.toLowerCase().includes(r))) return { quality: 'poor' };
  return { quality: 'good' };
}

function formatarWhatsApp(tel) {
  if (!tel) return '';
  const num = tel.replace(/\D/g, '');
  if (num.length < 10) return '';
  const semPais = num.startsWith('55') ? num.slice(2) : num;
  return '55' + semPais;
}

// ── ID baseado no placeId do Google Maps ─────────────────────────
// placeId é IMUTÁVEL e ÚNICO globalmente — elimina duplicatas por
// variação de nome ("Lopes & Silva" vs "Lopes e Silva") pois o
// mesmo estabelecimento sempre tem o mesmo placeId
function gerarIdDoc(uid, placeId) {
  const hash = crypto.createHash('md5').update(`${uid}_${placeId}`).digest('hex');
  return `lead_${hash}`;
}

exports.buscarLeads = onRequest(
  {
    secrets: [googleMapsKey],
    cors: [
      'https://clickfacilcrmprospect.vercel.app',
      'http://localhost:8080',
      'http://localhost:5173',
    ],
    invoker:        'public',
    timeoutSeconds: 120,
    memory:         '256MiB',
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
      const {
        nicho:    nichoRaw,
        cidade:   cidadeRaw,
        estado:   estadoRaw  = 'PA',
        maxLeads: maxLeadsRaw = 20,
        idToken,
      } = req.body;

      if (!idToken) return res.status(401).json({ error: 'Token obrigatório' });

      let uid, email;
      try {
        const decoded = await admin.auth().verifyIdToken(idToken, true);
        uid   = decoded.uid;
        email = decoded.email;
      } catch (e) {
        return res.status(401).json({ error: 'Token inválido. Faça login novamente.' });
      }

      if (!checkRateLimit(uid)) {
        return res.status(429).json({ error: 'Limite de buscas atingido. Aguarde 1 hora.' });
      }

      const nicho    = sanitizar(nichoRaw);
      const cidade   = sanitizar(cidadeRaw);
      const estado   = sanitizar(estadoRaw, 2).toUpperCase();
      const maxLeads = Math.min(Math.max(parseInt(maxLeadsRaw) || 10, 1), 20);

      const erros = validarInput(nicho, cidade, estado, maxLeads);
      if (erros.length > 0) return res.status(400).json({ error: `Input inválido: ${erros.join(', ')}` });

      const apiKey = googleMapsKey.value();
      if (!apiKey) return res.status(500).json({ error: 'Configuração incompleta' });

      console.log(`🔍 [${email}] "${nicho}" em "${cidade}, ${estado}" max:${maxLeads}`);

      const lugares = await buscarEmpresas(nicho, cidade, estado, apiKey);
      const meta    = Math.min(maxLeads, lugares.length);
      console.log(`📍 ${lugares.length} resultados, processando ${meta}`);

      if (meta === 0) {
        return res.status(200).json({
          success:    true,
          total:      0,
          novos:      0,
          atualizados: 0,
          message:    `Nenhuma empresa encontrada para "${nicho}" em "${cidade}". Tente outro nicho ou cidade.`,
        });
      }

      const db = admin.firestore();
      let novos = 0;
      let atualizados = 0;

      for (let i = 0; i < meta; i++) {
        const lugar = lugares[i];
        if (!lugar.name || !lugar.place_id) {
          console.warn(`  ⚠️ [${i+1}] Sem nome ou place_id, pulando`);
          continue;
        }

        try {
          const detalhes   = await buscarDetalhes(lugar.place_id, apiKey);
          const wpp        = formatarWhatsApp(detalhes.formatted_phone_number || '');
          const { quality} = analisarSite(detalhes.website);

          // ID baseado no placeId — mesmo lugar nunca gera duplicata
          const idDoc  = gerarIdDoc(uid, lugar.place_id);
          const docRef = db.collection('leads').doc(idDoc);
          const docSnap = await docRef.get();

          if (docSnap.exists) {
            // Já existe — preserva stage, notes, valor. Só atualiza contato
            await docRef.update({
              phone:          detalhes.formatted_phone_number || '',
              whatsapp:       wpp,
              linkWhatsApp:   wpp ? `https://wa.me/${wpp}` : '',
              website:        detalhes.website || '',
              googleMaps:     detalhes.url || lugar.url || '',
              websiteQuality: quality,
              updatedAt:      admin.firestore.FieldValue.serverTimestamp(),
            });
            atualizados++;
            console.log(`  🔄 [${i+1}/${meta}] Já existe: ${lugar.name}`);
          } else {
            // Novo lead
            await docRef.set({
              userId:         uid,
              companyName:    lugar.name,
              niche:          nicho,
              territory:      cidade,
              phone:          detalhes.formatted_phone_number || '',
              whatsapp:       wpp,
              linkWhatsApp:   wpp ? `https://wa.me/${wpp}` : '',
              website:        detalhes.website || '',
              googleMaps:     detalhes.url || lugar.url || '',
              instagram:      '',
              stage:          'new',
              source:         'google_maps_api',
              websiteQuality: quality,
              notes:          '',
              contactName:    '',
              email:          '',
              valor:          0,
              createdAt:      admin.firestore.FieldValue.serverTimestamp(),
              updatedAt:      admin.firestore.FieldValue.serverTimestamp(),
            });
            novos++;
            console.log(`  ✅ [${i+1}/${meta}] Criado: ${lugar.name}`);
          }

          if (i < meta - 1) await new Promise(r => setTimeout(r, 150));

        } catch (e) {
          console.error(`  ❌ [${i+1}] ${lugar.name}: ${e.message}`);
        }
      }

      console.log(`🎉 [${email}] ${novos} novos, ${atualizados} já existiam`);

      // Mensagem honesta para o usuário
      let message;
      if (novos === 0 && atualizados > 0) {
        message = `Todos os ${atualizados} leads de "${nicho}" em "${cidade}" já estão no seu CRM. Tente outra cidade ou nicho para encontrar novos.`;
      } else if (novos > 0 && atualizados > 0) {
        message = `${novos} novos leads adicionados! (${atualizados} já existiam no CRM)`;
      } else {
        message = `${novos} novos leads de "${nicho}" em "${cidade}" adicionados ao pipeline!`;
      }

      return res.status(200).json({
        success:    true,
        total:      novos + atualizados,
        novos,
        atualizados,
        message,
      });

    } catch (error) {
      console.error('❌ Erro geral:', error.message);
      return res.status(500).json({ error: 'Erro interno. Tente novamente.' });
    }
  }
);