// src/components/leads/LeadModal.tsx — COMPACT REDESIGN

import { Lead, LeadStatus, NICHES, PIPELINE_COLUMNS } from '@/types/lead';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageCircle, Mail, Instagram, Globe, Building2, User, Phone, MapPin, Edit } from 'lucide-react';
import { useState, useEffect } from 'react';

interface LeadModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (lead: Partial<Lead>) => void;
  mode: 'view' | 'edit' | 'create';
}

function calcQuality(url: string): 'none' | 'poor' | 'good' {
  if (!url?.trim()) return 'none';
  const lower = url.toLowerCase();
  const social = ['instagram.com','facebook.com','fb.com','tiktok.com','twitter.com','x.com','linkedin.com','youtube.com','wa.me','whatsapp'];
  if (social.some(r => lower.includes(r))) return 'poor';
  const weak = ['linktree','linktr.ee','bio.link','beacons.ai','sites.google.com','wixsite.com','blogspot.com'];
  if (weak.some(r => lower.includes(r))) return 'poor';
  return 'good';
}

const qLabels = {
  none: { text: 'Sem site',                    cls: 'text-rose-500'   },
  poor: { text: 'Site fraco / rede social',     cls: 'text-amber-500'  },
  good: { text: 'Site profissional',            cls: 'text-emerald-500'},
};

export function LeadModal({ lead, isOpen, onClose, onSave, mode: initialMode }: LeadModalProps) {
  const [formData, setFormData] = useState<Partial<Lead>>({});
  const [mode, setMode]         = useState<'view' | 'edit' | 'create'>(initialMode);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { setMode(initialMode); }, [initialMode]);

  useEffect(() => {
    if (isOpen) {
      setFormData(lead ?? {
        companyName: '', niche: '', contactName: '', email: '', phone: '',
        whatsapp: '', instagram: '', website: '', googleMaps: '',
        stage: 'new', source: 'manual', notes: '', valor: 0,
      });
    }
  }, [lead, isOpen]);

  const handleWebsiteChange = (value: string) =>
    setFormData(prev => ({ ...prev, website: value, websiteQuality: calcQuality(value) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName?.trim()) { alert('Nome da empresa é obrigatório!'); return; }
    try {
      setIsSaving(true);
      await onSave({ ...formData, websiteQuality: calcQuality(formData.website || '') });
      onClose();
      setMode('view');
    } catch { alert('Erro ao salvar. Tente novamente.'); }
    finally { setIsSaving(false); }
  };

  const isView   = mode === 'view';
  const openLink = (url: string) => window.open(url.startsWith('http') ? url : `https://${url}`, '_blank');
  const ql       = qLabels[calcQuality(formData.website || '')];

  const fieldCls = "h-8 text-sm";
  const labelCls = "text-xs font-medium text-muted-foreground";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              {mode === 'create' ? 'Novo Lead' : formData.companyName}
            </div>
            {isView && lead && (
              <Button variant="outline" size="sm" onClick={() => setMode('edit')} className="gap-1.5 h-7 text-xs px-2.5">
                <Edit className="w-3.5 h-3.5" />Editar
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Empresa + Nicho */}
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Empresa</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className={labelCls}>Nome *</Label>
                <Input className={fieldCls} value={formData.companyName || ''} disabled={isView} required placeholder="Nome da empresa"
                  onChange={e => setFormData({ ...formData, companyName: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className={labelCls}>Nicho</Label>
                <Select value={formData.niche || ''} onValueChange={v => setFormData({ ...formData, niche: v })} disabled={isView}>
                  <SelectTrigger className={fieldCls}><SelectValue placeholder="Selecionar nicho" /></SelectTrigger>
                  <SelectContent>{NICHES.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Contato */}
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Contato</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className={labelCls}><User className="w-3 h-3 inline mr-1" />Nome do Contato</Label>
                <Input className={fieldCls} value={formData.contactName || ''} disabled={isView} placeholder="Responsável"
                  onChange={e => setFormData({ ...formData, contactName: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className={labelCls}><Phone className="w-3 h-3 inline mr-1" />Telefone</Label>
                <Input className={fieldCls} value={formData.phone || ''} disabled={isView} placeholder="(91) 99999-9999"
                  onChange={e => setFormData({ ...formData, phone: e.target.value })} />
              </div>
            </div>
          </div>

          {/* Ações rápidas em modo visualização */}
          {isView && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5 p-3 bg-muted/30 rounded-lg">
                {(formData.whatsapp || formData.linkWhatsApp) && (
                  <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1.5"
                    onClick={() => openLink(formData.linkWhatsApp || `https://wa.me/${formData.whatsapp}`)}>
                    <MessageCircle className="w-3 h-3 text-green-500" />WhatsApp
                  </Button>
                )}
                {formData.email && (
                  <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1.5"
                    onClick={() => openLink(`mailto:${formData.email}`)}>
                    <Mail className="w-3 h-3 text-blue-500" />Email
                  </Button>
                )}
                {formData.instagram && (
                  <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1.5"
                    onClick={() => openLink(formData.instagram!.startsWith('http') ? formData.instagram! : `https://instagram.com/${formData.instagram!.replace('@', '')}`)}>
                    <Instagram className="w-3 h-3 text-pink-500" />Instagram
                  </Button>
                )}
                {formData.website && formData.website !== 'SEM SITE' && (
                  <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1.5"
                    onClick={() => openLink(formData.website!)}>
                    <Globe className="w-3 h-3 text-purple-500" />Website
                  </Button>
                )}
                {formData.googleMaps && (
                  <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1.5"
                    onClick={() => openLink(formData.googleMaps!)}>
                    <MapPin className="w-3 h-3 text-red-500" />Maps
                  </Button>
                )}
              </div>
              <p className={`text-xs font-medium px-1 ${ql.cls}`}>🌐 {ql.text}{formData.website ? ` — ${formData.website}` : ''}</p>
            </div>
          )}

          {/* Online (edição) */}
          {!isView && (
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Online</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className={labelCls}><MessageCircle className="w-3 h-3 inline mr-1 text-green-500" />WhatsApp</Label>
                  <Input className={fieldCls} placeholder="5591999999999" value={formData.whatsapp || ''}
                    onChange={e => setFormData({ ...formData, whatsapp: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className={labelCls}><Mail className="w-3 h-3 inline mr-1 text-blue-500" />Email</Label>
                  <Input className={fieldCls} type="email" placeholder="contato@empresa.com" value={formData.email || ''}
                    onChange={e => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className={labelCls}><Instagram className="w-3 h-3 inline mr-1 text-pink-500" />Instagram</Label>
                  <Input className={fieldCls} placeholder="@empresa ou URL" value={formData.instagram || ''}
                    onChange={e => setFormData({ ...formData, instagram: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className={labelCls}><Globe className="w-3 h-3 inline mr-1 text-purple-500" />Website</Label>
                  <Input className={fieldCls} placeholder="https://empresa.com" value={formData.website || ''}
                    onChange={e => handleWebsiteChange(e.target.value)} />
                  {formData.website && (
                    <p className={`text-[10px] font-medium ${calcQuality(formData.website) === 'good' ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {calcQuality(formData.website) === 'good' ? '✅ Site profissional' : '⚠️ Rede social ou link fraco'}
                    </p>
                  )}
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className={labelCls}><MapPin className="w-3 h-3 inline mr-1 text-red-500" />Google Maps</Label>
                  <Input className={fieldCls} placeholder="https://maps.google.com/..." value={formData.googleMaps || ''}
                    onChange={e => setFormData({ ...formData, googleMaps: e.target.value })} />
                </div>
              </div>
            </div>
          )}

          {/* Estágio + Valor */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className={labelCls}>Estágio</Label>
              <Select value={formData.stage || 'new'} onValueChange={(v: LeadStatus) => setFormData({ ...formData, stage: v })} disabled={isView}>
                <SelectTrigger className={fieldCls}><SelectValue /></SelectTrigger>
                <SelectContent>{PIPELINE_COLUMNS.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className={labelCls}>Valor Estimado (R$)</Label>
              <Input className={fieldCls} type="number" min="0" step="0.01" value={formData.valor || 0} disabled={isView}
                onChange={e => setFormData({ ...formData, valor: parseFloat(e.target.value) || 0 })} />
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-1">
            <Label className={labelCls}>Observações</Label>
            <Textarea rows={3} value={formData.notes || ''} disabled={isView} placeholder="Adicione observações..."
              className="text-sm resize-none"
              onChange={e => setFormData({ ...formData, notes: e.target.value })} />
          </div>

          {/* Ações */}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" size="sm" disabled={isSaving}
              onClick={mode === 'edit' ? () => { setMode('view'); if (lead) setFormData(lead); } : onClose}>
              {mode === 'edit' ? 'Cancelar' : 'Fechar'}
            </Button>
            {!isView && (
              <Button type="submit" size="sm" disabled={isSaving}>
                {isSaving ? 'Salvando...' : mode === 'create' ? 'Criar Lead' : 'Salvar'}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}