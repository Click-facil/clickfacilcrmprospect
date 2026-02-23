// src/components/scripts/ScriptsPage.tsx - COM TEMPLATES PRONTOS

import { Script } from '@/types/lead';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Copy, Edit, Trash2, MessageCircle, Mail, Send } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ScriptsPageProps {
  scripts: Script[];
  onAddScript: (script: Omit<Script, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateScript: (id: string, updates: Partial<Script>) => void;
  onDeleteScript: (id: string) => void;
}

const TEMPLATES_PRONTOS = [
  {
    title: "Primeiro Contato - Sem Site",
    category: "initial" as const,
    content: `Oi [Nome], tudo bem? Vi a [clínica/academia/empresa] de vocês no Google e percebi que não têm uma página focada em capturar clientes pelo WhatsApp.
Trabalho com estruturas de captação para [nicho] que transformam quem te encontra no Google ou Instagram em contato direto — sem depender só de indicação.
Posso te mostrar em 10 minutos como ficaria pra vocês?`
  },
  {
    title: "Primeiro Contato - Site Ruim/Linktree",
    category: "initial" as const,
    content: `Oi [Nome]! Vi o perfil de vocês e o trabalho é muito bom. Só percebi que o link do perfil leva pra um [site antigo/Linktree] que provavelmente não tá convertendo visitante em cliente.
Tenho uma estrutura específica pra [nicho] que transforma esse tráfego em contatos reais pelo WhatsApp. É diferente de um site comum — é uma página feita pra uma coisa só: fazer o cliente chamar vocês.
Faz sentido eu te mostrar como ficaria?`
  },
  {
    title: "Follow-up - Após 3 dias",
    category: "followup" as const,
    content: `Oi [Nome], tudo bem? Passei aqui pra ver se você teve chance de ver minha mensagem anterior.
Sei que o dia a dia corrido não deixa espaço pra tudo — por isso queria só confirmar se faz sentido bater um papo rápido sobre a captação de [pacientes/alunos/clientes] de vocês.
Se não for o momento certo, sem problema — é só me falar. Mas se tiver curiosidade, levo menos de 10 minutos pra mostrar o que tenho em mente pra vocês.`
  },
  {
    title: "Envio de Proposta",
    category: "proposal" as const,
    content: `USAR PDF`
  },
  {
    title: "Fechamento - Criar Urgência",
    category: "closing" as const,
    content: `[NOME], tudo certo?

Sobre o site da [NOME DA EMPRESA], tenho uma notícia:

Estou com uma agenda apertada este mês, mas consegui reservar uma vaga para você se confirmar até [DIA].

Depois disso, só em [MÊS SEGUINTE].

O que acha? Garantimos sua vaga? 😊

Qualquer dúvida, só chamar!`
  }
];

export function ScriptsPage({ scripts, onAddScript, onUpdateScript, onDeleteScript }: ScriptsPageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingScript, setEditingScript] = useState<Script | null>(null);
  const [formData, setFormData] = useState({ title: '', content: '', category: 'initial' as Script['category'] });
  const { toast } = useToast();

  const handleAddFromTemplate = (template: typeof TEMPLATES_PRONTOS[0]) => {
    onAddScript(template);
    toast({
      title: "Template adicionado!",
      description: `"${template.title}" foi adicionado aos seus scripts.`,
    });
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copiado!",
      description: "Script copiado para a área de transferência.",
    });
  };

  const handleSave = () => {
    if (!formData.title || !formData.content) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha título e conteúdo.",
        variant: "destructive",
      });
      return;
    }

    if (editingScript) {
      onUpdateScript(editingScript.id, formData);
    } else {
      onAddScript(formData);
    }

    setIsModalOpen(false);
    setEditingScript(null);
    setFormData({ title: '', content: '', category: 'initial' });
  };

  const handleEdit = (script: Script) => {
    setEditingScript(script);
    setFormData({
      title: script.title,
      content: script.content,
      category: script.category,
    });
    setIsModalOpen(true);
  };

  const handleNew = () => {
    setEditingScript(null);
    setFormData({ title: '', content: '', category: 'initial' });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Roteiros de Mensagens</h1>
          <p className="text-muted-foreground mt-1">Templates prontos para agilizar seu contato com leads</p>
        </div>
        <Button onClick={handleNew} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Roteiro
        </Button>
      </div>

      {/* Templates Prontos */}
      <div>
        <h2 className="text-lg font-semibold mb-4">📚 Templates Prontos para Usar</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TEMPLATES_PRONTOS.map((template, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-base">{template.title}</CardTitle>
                <CardDescription>Pronto para usar - personalize com os dados do lead</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-muted p-3 rounded text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {template.content}
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleCopy(template.content)}
                    className="gap-2 flex-1"
                  >
                    <Copy className="w-4 h-4" />
                    Copiar
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => handleAddFromTemplate(template)}
                    className="gap-2 flex-1"
                  >
                    <Plus className="w-4 h-4" />
                    Salvar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Meus Roteiros */}
      {scripts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">💼 Meus Roteiros Personalizados</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scripts.map((script) => (
              <Card key={script.id}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    {script.title}
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(script)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDeleteScript(script.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="bg-muted p-3 rounded text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {script.content}
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleCopy(script.content)}
                    className="gap-2 w-full"
                  >
                    <Copy className="w-4 h-4" />
                    Copiar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingScript ? 'Editar Roteiro' : 'Novo Roteiro'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Primeiro Contato - WhatsApp"
              />
            </div>

            <div className="space-y-2">
              <Label>Mensagem</Label>
              <Textarea
                rows={12}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Digite sua mensagem aqui..."
              />
              <p className="text-xs text-muted-foreground">
                Dica: Use [NOME DA EMPRESA], [NOME], [NICHO] como placeholders
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}