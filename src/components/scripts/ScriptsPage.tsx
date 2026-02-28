// src/components/scripts/ScriptsPage.tsx - MULTI-USUÁRIO

import { Script } from '@/types/lead';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Copy, Edit, Trash2, FileDown, MessageCircle, FileText, Upload, Info } from 'lucide-react';
import { useState, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ScriptsPageProps {
  scripts: Script[];
  onAddScript: (script: Omit<Script, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateScript: (id: string, updates: Partial<Script>) => void;
  onDeleteScript: (id: string) => void;
}

// Docx padrão da Click Fácil (usado apenas como exemplo)
const PROPOSTA_CLICKFACIL_B64 = "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";

function base64ToArrayBuffer(b: string): ArrayBuffer {
  const bin = atob(b);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

async function preencherDocx(
  buffer: ArrayBuffer,
  campos: { nome: string; empresa: string; data: string; valor: string }
): Promise<Blob> {
  const JSZipModule = await import('jszip');
  const JSZip = JSZipModule.default;
  const zip = await JSZip.loadAsync(buffer);
  let xml = await zip.file('word/document.xml')!.async('string');
  const nomeCompleto = campos.empresa ? campos.nome + ' / ' + campos.empresa : campos.nome;
  xml = xml.split('[DATA]').join(campos.data);
  xml = xml.split('[NOME DO CLIENTE / EMPRESA]').join(nomeCompleto);
  xml = xml.split('[Nome]').join(campos.nome);
  xml = xml.split('[VALOR]').join(campos.valor);
  // Campos genéricos também
  xml = xml.split('[NOME]').join(campos.nome);
  xml = xml.split('[EMPRESA]').join(campos.empresa || campos.nome);
  zip.file('word/document.xml', xml);
  return zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  });
}

const STORAGE_KEY = 'proposta_docx_b64';

function PropostaGenerator() {
  const [form, setForm] = useState({
    nome: '', empresa: '',
    data: new Date().toLocaleDateString('pt-BR'),
    valor: ''
  });
  const [loading, setLoading]       = useState(false);
  const [modeloNome, setModeloNome] = useState<string | null>(() => {
    return localStorage.getItem('proposta_modelo_nome');
  });
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const set = (campo: string, valor: string) =>
    setForm(prev => ({ ...prev, [campo]: valor }));
  const pronto = form.nome.trim() && form.valor.trim();

  const handleUploadModelo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.endsWith('.docx')) {
      toast({ title: 'Formato inválido', description: 'Use um arquivo .docx', variant: 'destructive' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = (reader.result as string).split(',')[1];
      localStorage.setItem(STORAGE_KEY, b64);
      localStorage.setItem('proposta_modelo_nome', f.name);
      setModeloNome(f.name);
      toast({ title: 'Modelo salvo!', description: f.name + ' será usado nas próximas propostas.' });
    };
    reader.readAsDataURL(f);
  };

  const getBuffer = (): ArrayBuffer => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return base64ToArrayBuffer(saved || PROPOSTA_CLICKFACIL_B64);
  };

  const handleGerar = async () => {
    if (!pronto) return;
    setLoading(true);
    try {
      const blob = await preencherDocx(getBuffer(), form);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Proposta_' + form.nome.replace(/\s+/g, '_') + '_' + form.data.replace(/\//g, '-') + '.docx';
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Proposta gerada!', description: 'Download iniciado.' });
    } catch (e) {
      console.error(e);
      toast({ title: 'Erro ao gerar', description: 'Verifique o console.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsApp = () => {
    if (!pronto) return;
    const empresa = form.empresa ? ' para ' + form.empresa : '';
    const texto = 'Olá ' + form.nome + '! 😊\n\n'
      + 'Segue a proposta comercial' + empresa + '.\n\n'
      + '📋 Resumo:\n• Investimento: R$ ' + form.valor
      + '\n• Prazo: até 7 dias úteis\n• 50% na aprovação + 50% na entrega\n\n'
      + 'Esta proposta é válida por 7 dias. Me avise se tiver dúvidas! 🚀';
    window.open('https://wa.me/?text=' + encodeURIComponent(texto), '_blank');
  };

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="w-5 h-5 text-primary" />
          Gerar Proposta Personalizada
        </CardTitle>
        <CardDescription>
          Preencha os campos e baixe o .docx com seu modelo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload do modelo */}
        <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/40">
          <div className="flex-1">
            <p className="text-sm font-medium">
              {modeloNome ? modeloNome : 'Modelo padrão (Click Fácil)'}
            </p>
            <p className="text-xs text-muted-foreground">
              {modeloNome ? 'Seu modelo personalizado' : 'Faça upload do seu .docx para personalizar'}
            </p>
          </div>
          <Button size="sm" variant="outline" className="gap-2"
            onClick={() => fileRef.current?.click()}>
            <Upload className="w-4 h-4" />
            {modeloNome ? 'Trocar' : 'Upload'}
          </Button>
          <input ref={fileRef} type="file" accept=".docx" className="hidden"
            onChange={handleUploadModelo} />
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Use <strong>[Nome]</strong>, <strong>[EMPRESA]</strong>, <strong>[DATA]</strong>, <strong>[VALOR]</strong> no seu .docx como campos variáveis.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Nome do cliente *</Label>
            <Input placeholder="Ex: João Silva" value={form.nome} onChange={e => set('nome', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Empresa <span className="text-xs text-muted-foreground">(opcional)</span></Label>
            <Input placeholder="Ex: Clínica Sorriso" value={form.empresa} onChange={e => set('empresa', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Data da proposta *</Label>
            <Input placeholder="Ex: 23/02/2025" value={form.data} onChange={e => set('data', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Valor do investimento *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
              <Input placeholder="Ex: 1.200,00" value={form.valor} onChange={e => set('valor', e.target.value)} className="pl-9" />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={handleGerar} disabled={!pronto || loading} className="flex-1 gap-2" size="lg">
            <FileDown className="w-4 h-4" />
            {loading ? 'Gerando...' : 'Baixar Proposta (.docx)'}
          </Button>
          <Button onClick={handleWhatsApp} disabled={!pronto} variant="outline"
            className="flex-1 gap-2 border-green-500 text-green-600 hover:bg-green-50" size="lg">
            <MessageCircle className="w-4 h-4" />
            Mensagem WhatsApp
          </Button>
        </div>

        {pronto && (
          <p className="text-xs text-muted-foreground text-center">
            Proposta para <strong>{form.nome}</strong>{form.empresa && ' / ' + form.empresa} — R$ {form.valor} — {form.data}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function ScriptsPage({ scripts, onAddScript, onUpdateScript, onDeleteScript }: ScriptsPageProps) {
  const [isModalOpen, setIsModalOpen]     = useState(false);
  const [editingScript, setEditingScript] = useState<Script | null>(null);
  const [formData, setFormData]           = useState({ title: '', content: '', category: 'initial' as Script['category'] });
  const { toast } = useToast();

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({ title: 'Copiado!', description: 'Script copiado para a área de transferência.' });
  };

  const handleSave = () => {
    if (!formData.title || !formData.content) {
      toast({ title: 'Campos obrigatórios', description: 'Preencha título e conteúdo.', variant: 'destructive' });
      return;
    }
    if (editingScript) { onUpdateScript(editingScript.id, formData); }
    else { onAddScript(formData); }
    setIsModalOpen(false);
    setEditingScript(null);
    setFormData({ title: '', content: '', category: 'initial' });
  };

  const handleEdit = (script: Script) => {
    setEditingScript(script);
    setFormData({ title: script.title, content: script.content, category: script.category });
    setIsModalOpen(true);
  };

  const handleNew = () => {
    setEditingScript(null);
    setFormData({ title: '', content: '', category: 'initial' });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Roteiros de Mensagens</h1>
          <p className="text-muted-foreground mt-1">Seus templates e gerador de proposta</p>
        </div>
        <Button onClick={handleNew} className="gap-2">
          <Plus className="w-4 h-4" />Novo Roteiro
        </Button>
      </div>

      {/* Proposta */}
      <div>
        <h2 className="text-lg font-semibold mb-4">📄 Proposta Comercial</h2>
        <PropostaGenerator />
      </div>

      {/* Meus Roteiros */}
      <div>
        <h2 className="text-lg font-semibold mb-4">💼 Meus Roteiros</h2>
        {scripts.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground/40 mb-4" />
              <h3 className="font-medium text-muted-foreground mb-2">Nenhum roteiro ainda</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Crie seus templates de mensagem para agilizar a prospecção
              </p>
              <Button onClick={handleNew} className="gap-2">
                <Plus className="w-4 h-4" />Criar primeiro roteiro
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scripts.map(script => (
              <Card key={script.id}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    {script.title}
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(script)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => onDeleteScript(script.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="bg-muted p-3 rounded text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {script.content}
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleCopy(script.content)} className="gap-2 w-full">
                    <Copy className="w-4 h-4" />Copiar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingScript ? 'Editar Roteiro' : 'Novo Roteiro'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Ex: Primeiro Contato - WhatsApp" />
            </div>
            <div className="space-y-2">
              <Label>Mensagem</Label>
              <Textarea rows={10} value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} placeholder="Digite sua mensagem aqui...\n\nUse [NOME], [EMPRESA], [NICHO] como variáveis" />
              <p className="text-xs text-muted-foreground">Variáveis: [NOME], [NOME DA EMPRESA], [NICHO], [DIA]</p>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}