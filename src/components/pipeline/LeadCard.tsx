// src/components/pipeline/LeadCard.tsx — COMPACT REDESIGN

import { Lead } from '@/types/lead';
import {
  Globe, AlertTriangle, XCircle, MessageCircle, Mail,
  Instagram, MapPin, MoreVertical, Trash2, Eye, Phone,
  ExternalLink, TrendingUp, Archive, ChevronRight, Tag, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger,
  DropdownMenuSubContent, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';

interface LeadCardProps {
  lead: Lead;
  onView: () => void;
  onStageChange: (stage: Lead['stage']) => void;
  onDelete: () => void;
  onArchive: () => void;
  onLabelChange?: (label: string, color: string) => void;
}

function calcQuality(url?: string): 'none' | 'poor' | 'good' {
  if (!url?.trim()) return 'none';
  const lower = url.toLowerCase();
  const social = ['instagram.com','facebook.com','fb.com','tiktok.com','twitter.com','x.com','linkedin.com','youtube.com','wa.me','whatsapp'];
  if (social.some(r => lower.includes(r))) return 'poor';
  const weak = ['linktree','linktr.ee','bio.link','beacons.ai','sites.google.com','wixsite.com','blogspot.com'];
  if (weak.some(r => lower.includes(r))) return 'poor';
  return 'good';
}

const Q = {
  good: { icon: Globe,          cls: 'text-emerald-500', bg: 'bg-emerald-500/8 border-emerald-500/20', label: 'Site profissional' },
  poor: { icon: AlertTriangle,  cls: 'text-amber-500',   bg: 'bg-amber-500/8 border-amber-500/20',     label: 'Site fraco' },
  none: { icon: XCircle,        cls: 'text-rose-500',    bg: 'bg-rose-500/8 border-rose-500/20',       label: 'Sem site — oportunidade' },
};

const LABEL_OPTIONS = [
  { name: 'Quente 🔥',       color: 'bg-red-500'    },
  { name: 'Frio ❄️',         color: 'bg-blue-400'   },
  { name: 'VIP ⭐',          color: 'bg-yellow-500' },
  { name: 'Aguardando ⏳',   color: 'bg-orange-400' },
  { name: 'Interessado 👍',  color: 'bg-green-500'  },
  { name: 'Sem resposta 🔇', color: 'bg-gray-400'   },
  { name: 'Retornar 📞',     color: 'bg-purple-500' },
  { name: 'Prioritário 🎯',  color: 'bg-pink-500'   },
];

const STAGE_OPTIONS = [
  { id: 'new',           label: '🔵 Novos Leads'      },
  { id: 'contacted',     label: '🟣 Contatados'        },
  { id: 'proposal_sent', label: '🟠 Proposta Enviada'  },
  { id: 'negotiation',   label: '🟡 Em Negociação'     },
  { id: 'won',           label: '🟢 Fechado'           },
  { id: 'lost',          label: '🔴 Perdido'           },
  { id: 'refused',       label: '⚫ Recusado'          },
];

export function LeadCard({ lead, onView, onStageChange, onDelete, onArchive, onLabelChange }: LeadCardProps) {
  const [customLabel, setCustomLabel] = useState('');
  const [showCustom, setShowCustom]   = useState(false);

  const quality = calcQuality(lead.website);
  const qc      = Q[quality];
  const QIcon   = qc.icon;

  const stop    = (fn: () => void) => (e: React.MouseEvent) => { e.stopPropagation(); fn(); };
  const openUrl = (url: string) => window.open(url.startsWith('http') ? url : `https://${url}`, '_blank');

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Excluir ${lead.companyName}?`)) onDelete();
  };

  const nome = lead.companyName?.trim() || `Lead #${lead.id.slice(0, 8)}`;
  const labelData = (lead as any);

  return (
    <div
      onClick={onView}
      className="bg-card rounded-lg border border-border hover:border-primary/40 hover:shadow-sm transition-all duration-150 cursor-pointer group overflow-hidden"
    >
      {/* Etiqueta */}
      {labelData.label && (
        <div className={cn('px-2.5 py-0.5 flex items-center justify-between text-white text-[10px] font-medium', labelData.labelColor || 'bg-indigo-500')}>
          <span className="flex items-center gap-1"><Tag className="w-2.5 h-2.5" />{labelData.label}</span>
          <button onClick={stop(() => onLabelChange?.('', ''))}><X className="w-2.5 h-2.5 opacity-70 hover:opacity-100" /></button>
        </div>
      )}

      {/* Header compacto */}
      <div className="px-3 pt-3 pb-2 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-[13px] text-foreground leading-tight truncate mb-1">{nome}</h4>
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-medium truncate max-w-[120px]">
              {lead.niche || 'Outros'}
            </span>
            {lead.territory && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <MapPin className="w-2.5 h-2.5" />{lead.territory}
              </span>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
            <button className="p-1 rounded hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 -mt-0.5">
              <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={stop(onView)}>
              <Eye className="w-4 h-4 mr-2" />Ver Detalhes
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger onClick={e => e.stopPropagation()}>
                <ChevronRight className="w-4 h-4 mr-2" />Mover para...
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {STAGE_OPTIONS.filter(s => s.id !== lead.stage).map(s => (
                  <DropdownMenuItem key={s.id} onClick={stop(() => onStageChange(s.id as Lead['stage']))}>
                    {s.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger onClick={e => e.stopPropagation()}>
                <Tag className="w-4 h-4 mr-2" />Etiqueta
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-52">
                {LABEL_OPTIONS.map(opt => (
                  <DropdownMenuItem key={opt.name} onClick={stop(() => onLabelChange?.(opt.name, opt.color))} className="gap-2">
                    <span className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', opt.color)} />{opt.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={e => { e.stopPropagation(); e.preventDefault(); setShowCustom(true); }} className="gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 flex-shrink-0" />Personalizada...
                </DropdownMenuItem>
                {showCustom && (
                  <div className="px-2 py-1" onClick={e => e.stopPropagation()}>
                    <input autoFocus className="w-full text-xs border rounded px-2 py-1 bg-background"
                      placeholder="Nome da etiqueta" value={customLabel}
                      onChange={e => setCustomLabel(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && customLabel.trim()) { onLabelChange?.(customLabel.trim(), 'bg-indigo-500'); setCustomLabel(''); setShowCustom(false); }}} />
                  </div>
                )}
                {labelData.label && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={stop(() => onLabelChange?.('', ''))} className="text-destructive">
                      <X className="w-3 h-3 mr-2" />Remover etiqueta
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={stop(onArchive)}>
              <Archive className="w-4 h-4 mr-2 text-muted-foreground" />Arquivar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Badge de qualidade do site */}
      <div className={cn('mx-3 mb-2 px-2 py-1 rounded border text-[10px] font-medium flex items-center gap-1.5', qc.bg)}>
        <QIcon className={cn('w-3 h-3 flex-shrink-0', qc.cls)} />
        <span className={qc.cls}>{qc.label}</span>
      </div>

      {/* Info secundária */}
      <div className="px-3 pb-2 space-y-1">
        {lead.phone && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Phone className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{lead.phone}</span>
          </div>
        )}
        {lead.notes && lead.notes !== 'Nao' && lead.notes !== 'Site profissional detectado' && (
          <p className="text-[11px] text-muted-foreground italic truncate bg-muted/40 px-2 py-1 rounded">
            {lead.notes}
          </p>
        )}
        {lead.valor != null && lead.valor > 0 && (
          <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-500">
            <TrendingUp className="w-3 h-3" />R$ {lead.valor.toLocaleString('pt-BR')}
          </div>
        )}
      </div>

      {/* Botões de ação — row compacto */}
      <div className="px-3 pb-3 flex flex-wrap gap-1.5">
        {(lead.whatsapp || lead.linkWhatsApp) && (
          <button onClick={stop(() => openUrl(lead.linkWhatsApp || `https://wa.me/${lead.whatsapp}`))}
            className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-medium transition-colors">
            <MessageCircle className="w-3 h-3" />WPP
          </button>
        )}
        {lead.googleMaps && (
          <button onClick={stop(() => openUrl(lead.googleMaps!))}
            className="flex items-center gap-1 px-2 py-1 rounded bg-red-500 hover:bg-red-600 text-white text-[10px] font-medium transition-colors">
            <MapPin className="w-3 h-3" />Maps
          </button>
        )}
        {lead.instagram && lead.instagram !== 'Nao encontrado' && (
          <button onClick={stop(() => openUrl(lead.instagram!.startsWith('http') ? lead.instagram! : `https://instagram.com/${lead.instagram!.replace('@', '')}`))}
            className="flex items-center gap-1 px-2 py-1 rounded bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-[10px] font-medium transition-colors">
            <Instagram className="w-3 h-3" />IG
          </button>
        )}
        {lead.email && (
          <button onClick={stop(() => openUrl(`mailto:${lead.email}`))}
            className="flex items-center gap-1 px-2 py-1 rounded bg-blue-500 hover:bg-blue-600 text-white text-[10px] font-medium transition-colors">
            <Mail className="w-3 h-3" />Email
          </button>
        )}
        {lead.website && lead.website !== 'SEM SITE' && (
          <button onClick={stop(() => openUrl(lead.website!))}
            className="flex items-center gap-1 px-2 py-1 rounded bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-medium transition-colors">
            <ExternalLink className="w-3 h-3" />Site
          </button>
        )}
      </div>

      {/* Footer mínimo */}
      <div className="px-3 py-1.5 bg-muted/20 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground/60">
        <span>{new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(lead.createdAt)}</span>
        <span>#{lead.id.slice(0, 6)}</span>
      </div>
    </div>
  );
}