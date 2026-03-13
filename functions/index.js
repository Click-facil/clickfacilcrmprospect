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
  if (isNaN(maxLeads) || maxLeads < 1 || maxLeads > 100) erros.push('maxLeads deve ser 1-100');
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

// Busca com retry automático para INVALID_REQUEST (token ainda não pronto)
async function buscarPaginaComRetry(apiKey, pageToken, tentativas = 4) {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=${pageToken}&language=pt-BR&key=${apiKey}`;
  for (let t = 0; t < tentativas; t++) {
    const data = await httpsGet(url);
    if (data.status === 'OK' || data.status === 'ZERO_RESULTS') {
      return { results: data.results || [], nextPageToken: data.next_page_token || null };
    }
    if (data.status === 'INVALID_REQUEST') {
      // Token ainda não está pronto — aguarda mais e tenta de novo
      const delay = (t + 1) * 2000; // 2s, 4s, 6s, 8s
      console.log(`  ⏳ Token não pronto, aguardando ${delay/1000}s (tentativa ${t+1}/${tentativas})...`);
      await new Promise(r => setTimeout(r, delay));
      continue;
    }
    throw new Error(`Google Places erro: ${data.status} — ${data.error_message || ''}`);
  }
  // Se esgotou as tentativas, retorna vazio em vez de lançar erro
  console.warn('  ⚠️ Token de paginação não ficou pronto após todas as tentativas, parando paginação');
  return { results: [], nextPageToken: null };
}

async function buscarEmpresas(nicho, cidade, estado, maxLeads, apiKey) {
  const todos = [];
  const maxPaginas = Math.ceil(maxLeads / 20);

  // Página 1 — busca normal
  const query = encodeURIComponent(`${nicho} em ${cidade} ${estado} Brasil`);
  const url1  = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&language=pt-BR&region=br&key=${apiKey}`;
  const data1 = await httpsGet(url1);

  if (data1.status !== 'OK' && data1.status !== 'ZERO_RESULTS') {
    throw new Error(`Google Places erro: ${data1.status} — ${data1.error_message || ''}`);
  }

  todos.push(...(data1.results || []));
  console.log(`  📄 Página 1: ${data1.results?.length || 0} resultados (total: ${todos.length})`);

  let pageToken = data1.next_page_token || null;

  // Páginas 2-5 com retry
  for (let pagina = 1; pagina < maxPaginas; pagina++) {
    if (!pageToken || todos.length >= maxLeads) break;

    // Delay inicial obrigatório antes de usar o token (Google recomenda mínimo 2s)
    await new Promise(r => setTimeout(r, 3000));

    const { results, nextPageToken } = await buscarPaginaComRetry(apiKey, pageToken);
    todos.push(...results);
    console.log(`  📄 Página ${pagina + 1}: ${results.length} resultados (total: ${todos.length})`);

    pageToken = nextPageToken;
    if (results.length === 0) break;
  }

  return todos.slice(0, maxLeads);
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

// ID por placeId — imutável, único globalmente, elimina duplicatas
function gerarIdDoc(uid, placeId) {
  const hash = crypto.createHash('md5').update(`${uid}_${placeId}`).digest('hex');
  return `lead_${hash}`;
}

// ID legado (nome+cidade) — para detectar duplicatas antigas
function gerarIdLegado(uid, nome, cidade) {
  const raw  = `${uid}_${nome}_${cidade}`.toLowerCase();
  const hash = crypto.createHash('md5').update(raw).digest('hex');
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
    timeoutSeconds: 540,
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
      const maxLeads = Math.min(Math.max(parseInt(maxLeadsRaw) || 20, 1), 100);

      const erros = validarInput(nicho, cidade, estado, maxLeads);
      if (erros.length > 0) return res.status(400).json({ error: `Input inválido: ${erros.join(', ')}` });

      const apiKey = googleMapsKey.value();
      if (!apiKey) return res.status(500).json({ error: 'Configuração incompleta' });

      console.log(`🔍 [${email}] "${nicho}" em "${cidade}, ${estado}" max:${maxLeads}`);

      const lugares = await buscarEmpresas(nicho, cidade, estado, maxLeads, apiKey);
      const meta    = lugares.length;
      console.log(`📍 ${meta} resultados obtidos, processando...`);

      if (meta === 0) {
        return res.status(200).json({
          success: true, total: 0, novos: 0, atualizados: 0,
          message: `Nenhuma empresa encontrada para "${nicho}" em "${cidade}". Tente outro nicho ou cidade.`,
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
          const detalhes    = await buscarDetalhes(lugar.place_id, apiKey);
          const wpp         = formatarWhatsApp(detalhes.formatted_phone_number || '');
          const { quality } = analisarSite(detalhes.website);

          const idNovo   = gerarIdDoc(uid, lugar.place_id);
          const idLegado = gerarIdLegado(uid, lugar.name, cidade);

          const docRefNovo   = db.collection('leads').doc(idNovo);
          const docRefLegado = db.collection('leads').doc(idLegado);

          const [snapNovo, snapLegado] = await Promise.all([
            docRefNovo.get(),
            docRefLegado.get(),
          ]);

          const dadosContato = {
            phone:          detalhes.formatted_phone_number || '',
            whatsapp:       wpp,
            linkWhatsApp:   wpp ? `https://wa.me/${wpp}` : '',
            website:        detalhes.website || '',
            googleMaps:     detalhes.url || lugar.url || '',
            websiteQuality: quality,
            updatedAt:      admin.firestore.FieldValue.serverTimestamp(),
          };

          if (snapNovo.exists) {
            // ID novo já existe — só atualiza contato, preserva stage/notas
            await docRefNovo.update(dadosContato);
            atualizados++;
            console.log(`  🔄 [${i+1}/${meta}] Já existe: ${lugar.name}`);

          } else if (snapLegado.exists) {
            // Existe com ID legado — migra para o novo ID e apaga o legado
            const dadosLegado = snapLegado.data();
            await docRefNovo.set({
              ...dadosLegado,
              ...dadosContato,
              // preserva stage/notas/valor do legado
              stage:  dadosLegado.stage  || 'new',
              notes:  dadosLegado.notes  || '',
              valor:  dadosLegado.valor  || 0,
            });
            await docRefLegado.delete();
            atualizados++;
            console.log(`  🔀 [${i+1}/${meta}] Migrado (legado→novo): ${lugar.name}`);

          } else {
            // Lead novo — cria
            await docRefNovo.set({
              userId:         uid,
              companyName:    lugar.name,
              niche:          nicho,
              territory:      cidade,
              ...dadosContato,
              instagram:      '',
              stage:          'new',
              source:         'google_maps_api',
              notes:          '',
              contactName:    '',
              email:          '',
              valor:          0,
              createdAt:      admin.firestore.FieldValue.serverTimestamp(),
            });
            novos++;
            console.log(`  ✅ [${i+1}/${meta}] Criado: ${lugar.name}`);
          }

          if (i < meta - 1) await new Promise(r => setTimeout(r, 150));

        } catch (e) {
          console.error(`  ❌ [${i+1}] ${lugar.name}: ${e.message}`);
        }
      }

      console.log(`🎉 [${email}] ${novos} novos, ${atualizados} já existiam/migrados`);

      let message;
      if (novos === 0 && atualizados > 0) {
        message = `Todos os ${atualizados} leads de "${nicho}" em "${cidade}" já estão no seu CRM. Tente outra cidade ou nicho.`;
      } else if (novos > 0 && atualizados > 0) {
        message = `${novos} novos leads adicionados! (${atualizados} já existiam no CRM)`;
      } else {
        message = `${novos} novos leads de "${nicho}" em "${cidade}" adicionados ao pipeline!`;
      }

      return res.status(200).json({
        success: true, total: novos + atualizados, novos, atualizados, message,
      });

    } catch (error) {
      console.error('❌ Erro geral:', error.message);
      return res.status(500).json({ error: 'Erro interno. Tente novamente.' });
    }
  }
);