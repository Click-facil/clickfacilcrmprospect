// src/components/prospecting/ProspectingPage.tsx

import { useState } from 'react';
import { NICHES } from '@/types/lead';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, MapPin, Copy, Check, Terminal, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export function ProspectingPage() {
  const [nicho, setNicho]         = useState('');
  const [cidade, setCidade]       = useState('');
  const [estado, setEstado]       = useState('PA');
  const [maxLeads, setMaxLeads]   = useState('20');
  const [copiado, setCopiado]     = useState(false);
  const { toast } = useToast();

  const comando = nicho && cidade
    ? `python scraper_com_firebase.py --nicho "${nicho}" --cidade "${cidade}" --estado "${estado}" --max ${maxLeads}`
    : '';

  const scriptConfig = nicho && cidade
    ? `# Abra o arquivo scraper_com_firebase.py e altere as linhas abaixo:\n\nNICHO     = "${nicho}"\nCIDADE    = "${cidade}"\nESTADO    = "${estado}"\nMAX_LEADS = ${maxLeads}`
    : '';

  const handleCopiar = (texto: string) => {
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    toast({ title: 'Copiado!', description: 'Cole no terminal ou no script Python.' });
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Prospecção Automática</h1>
        <p className="text-muted-foreground mt-1">Configure os parâmetros e rode o scraper na sua máquina</p>
      </div>

      {/* Configurar busca */}
      <Card>
        <CardHeader>
          <CardTitle>Configurar Busca</CardTitle>
          <CardDescription>Defina o nicho e a cidade para gerar o comando de prospecção</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Search className="w-4 h-4" />Nicho *</Label>
              <Select value={nicho} onValueChange={setNicho}>
                <SelectTrigger><SelectValue placeholder="Selecione o nicho" /></SelectTrigger>
                <SelectContent>
                  {NICHES.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><MapPin className="w-4 h-4" />Cidade *</Label>
              <Input placeholder="Ex: São Paulo" value={cidade} onChange={e => setCidade(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Input placeholder="Ex: SP" value={estado} onChange={e => setEstado(e.target.value)} maxLength={2} className="uppercase" />
            </div>
            <div className="space-y-2">
              <Label>Máximo de leads</Label>
              <Select value={maxLeads} onValueChange={setMaxLeads}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['10','20','30','50'].map(v => <SelectItem key={v} value={v}>{v} leads</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comando gerado */}
      {nicho && cidade ? (
        <Card className="border-primary/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Terminal className="w-5 h-5 text-primary" />
              Comando Pronto para Usar
            </CardTitle>
            <CardDescription>Copie e cole no terminal onde está o scraper</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Opção 1: Configurar no script */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Opção 1 — Altere as variáveis no script:</p>
              <div className="bg-muted rounded-lg p-4 font-mono text-sm relative">
                <pre className="whitespace-pre-wrap text-foreground">{scriptConfig}</pre>
                <Button
                  size="sm" variant="ghost"
                  className="absolute top-2 right-2 gap-1"
                  onClick={() => handleCopiar(scriptConfig)}
                >
                  {copiado ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  {copiado ? 'Copiado!' : 'Copiar'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Depois rode: <code className="bg-muted px-1 rounded">python scraper_com_firebase.py</code>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">ou</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Opção 2: Passo a passo */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Opção 2 — Passo a passo completo:</p>
              <div className="space-y-2 text-sm">
                <div className="flex gap-3 items-start p-3 bg-muted/50 rounded-lg">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <div>
                    <p className="font-medium">Abra o terminal na pasta do scraper</p>
                    <code className="text-xs text-muted-foreground">cd "sua-pasta/click-facil"</code>
                  </div>
                </div>
                <div className="flex gap-3 items-start p-3 bg-muted/50 rounded-lg">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <div>
                    <p className="font-medium">Configure o nicho e cidade no script</p>
                    <p className="text-xs text-muted-foreground">Use os valores gerados acima</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start p-3 bg-muted/50 rounded-lg">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <div>
                    <p className="font-medium">Execute o scraper</p>
                    <code className="text-xs bg-muted px-2 py-1 rounded block mt-1">python scraper_com_firebase.py</code>
                  </div>
                </div>
                <div className="flex gap-3 items-start p-3 bg-green-50 border border-green-200 rounded-lg">
                  <span className="w-6 h-6 rounded-full bg-green-500 text-white text-xs flex items-center justify-center shrink-0 mt-0.5">4</span>
                  <div>
                    <p className="font-medium text-green-700">Leads aparecem automaticamente no Pipeline!</p>
                    <p className="text-xs text-green-600">O scraper salva direto no Firebase com seu userId</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Preencha o <strong>nicho</strong> e a <strong>cidade</strong> acima para gerar o comando de prospecção.
          </AlertDescription>
        </Alert>
      )}

      {/* Info sobre o scraper */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">⚡ Como o scraper funciona</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
            {[
              { n: '1', label: 'Selecione o nicho', desc: 'e a cidade acima' },
              { n: '2', label: 'Configure e rode', desc: 'o script Python' },
              { n: '3', label: 'Scraper busca', desc: 'no Google Maps' },
              { n: '4', label: 'Leads prontos', desc: 'no seu Pipeline', ok: true },
            ].map(({ n, label, desc, ok }) => (
              <div key={n} className="space-y-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto font-bold text-sm ${ok ? 'bg-green-100 text-green-700' : 'bg-primary/10 text-primary'}`}>
                  {n}
                </div>
                <p className="font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}