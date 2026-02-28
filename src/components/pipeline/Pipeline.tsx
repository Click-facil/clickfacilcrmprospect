// src/components/pipeline/Pipeline.tsx - COM DRAG AND DROP NATIVO

import { Lead, PIPELINE_COLUMNS, LeadStatus } from '@/types/lead';
import { LeadCard } from './LeadCard';
import { Plus, ArrowLeft, ArrowRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface PipelineProps {
  leads: Lead[];
  onViewLead: (lead: Lead) => void;
  onStageChange: (leadId: string, stage: LeadStatus) => void;
  onDeleteLead: (leadId: string) => void;
  onAddLead: () => void;
}

export function Pipeline({ leads, onViewLead, onStageChange, onDeleteLead, onAddLead }: PipelineProps) {
  const scrollRef  = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm]       = useState('');
  const [draggedId, setDraggedId]         = useState<string | null>(null);
  const [dragOverCol, setDragOverCol]     = useState<string | null>(null);

  const scrollLeft  = () => scrollRef.current?.scrollBy({ left: -320, behavior: 'smooth' });
  const scrollRight = () => scrollRef.current?.scrollBy({ left: 320, behavior: 'smooth' });

  const filteredLeads = leads.filter(l =>
    l.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.niche.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStageValue = (stageLeads: Lead[]) =>
    stageLeads.reduce((sum, l) => sum + (l.valor || 0), 0);

  // ── Drag handlers ──────────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggedId(leadId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', leadId);
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(colId);
  };

  const handleDrop = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (id && colId) {
      const lead = leads.find(l => l.id === id);
      if (lead && lead.stage !== colId) {
        onStageChange(id, colId as LeadStatus);
      }
    }
    setDraggedId(null);
    setDragOverCol(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverCol(null);
  };

  return (
    <div className="flex flex-col" style={{ height: 'calc(100dvh - 130px)' }}>

      {/* Header */}
      <div className="flex-shrink-0 mb-4">
        <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Pipeline de Vendas</h1>
            <p className="text-sm text-muted-foreground">{filteredLeads.length} leads no funil</p>
          </div>
          <Button onClick={onAddLead} className="gap-2" size="sm">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo Lead</span>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={scrollLeft} className="flex-shrink-0 h-9 w-9">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar empresa..." value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)} className="pl-9 h-9" />
          </div>
          <Button variant="outline" size="icon" onClick={scrollRight} className="flex-shrink-0 h-9 w-9">
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {draggedId && (
          <p className="text-xs text-muted-foreground text-center mt-2 animate-pulse">
            ↔ Arraste para outra coluna para mover o lead
          </p>
        )}
      </div>

      {/* Board */}
      <div className="flex-1 overflow-hidden -mx-1">
        <div ref={scrollRef} className="h-full overflow-x-auto overflow-y-hidden px-1 pb-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <style>{`.overflow-x-auto::-webkit-scrollbar{display:none}`}</style>

          <div className="flex gap-3 h-full">
            {PIPELINE_COLUMNS.map(column => {
              const columnLeads = filteredLeads.filter(l => l.stage === column.id);
              const totalValue  = getStageValue(columnLeads);
              const isDragOver  = dragOverCol === column.id;

              return (
                <div key={column.id}
                  className="flex-shrink-0 w-[80vw] sm:w-[300px] md:w-[320px] h-full"
                  onDragOver={e => handleDragOver(e, column.id)}
                  onDrop={e => handleDrop(e, column.id)}
                  onDragLeave={() => setDragOverCol(null)}
                >
                  <div className={cn(
                    'bg-muted/30 rounded-lg h-full flex flex-col transition-all duration-150',
                    isDragOver && 'ring-2 ring-primary bg-primary/5 scale-[1.01]'
                  )}>
                    {/* Header da coluna */}
                    <div className="flex-shrink-0 p-3 border-b bg-background/50 rounded-t-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${column.color}`} />
                          <h3 className="font-semibold text-sm">{column.title}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          {totalValue > 0 && (
                            <span className="text-xs text-emerald-600 font-medium">
                              R$ {(totalValue / 1000).toFixed(0)}k
                            </span>
                          )}
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                            {columnLeads.length}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Cards com drag */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-3">
                      {columnLeads.map(lead => (
                        <div
                          key={lead.id}
                          draggable
                          onDragStart={e => handleDragStart(e, lead.id)}
                          onDragEnd={handleDragEnd}
                          className={cn(
                            'cursor-grab active:cursor-grabbing transition-opacity duration-150',
                            draggedId === lead.id && 'opacity-40'
                          )}
                        >
                          <LeadCard
                            lead={lead}
                            onView={() => onViewLead(lead)}
                            onStageChange={stage => onStageChange(lead.id, stage)}
                            onDelete={() => onDeleteLead(lead.id)}
                          />
                        </div>
                      ))}

                      {columnLeads.length === 0 && (
                        <div className={cn(
                          'flex flex-col items-center justify-center h-32 rounded-lg border-2 border-dashed transition-colors',
                          isDragOver
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-transparent text-muted-foreground'
                        )}>
                          {isDragOver
                            ? <p className="text-sm font-medium">Soltar aqui</p>
                            : <p className="text-xs">Nenhum lead</p>
                          }
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Rodapé */}
      <div className="flex-shrink-0 grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 pt-3 border-t">
        <div className="text-center">
          <div className="text-xl md:text-2xl font-bold">{filteredLeads.length}</div>
          <div className="text-xs text-muted-foreground">Total</div>
        </div>
        <div className="text-center">
          <div className="text-xl md:text-2xl font-bold text-amber-600">
            {filteredLeads.filter(l => l.websiteQuality === 'none' || l.websiteQuality === 'poor').length}
          </div>
          <div className="text-xs text-muted-foreground">Oportunidades</div>
        </div>
        <div className="text-center">
          <div className="text-xl md:text-2xl font-bold text-emerald-600">
            R$ {(getStageValue(filteredLeads) / 1000).toFixed(0)}k
          </div>
          <div className="text-xs text-muted-foreground">Valor Total</div>
        </div>
        <div className="text-center">
          <div className="text-xl md:text-2xl font-bold text-primary">
            {filteredLeads.length > 0
              ? ((filteredLeads.filter(l => l.stage === 'won').length / filteredLeads.length) * 100).toFixed(1)
              : '0.0'}%
          </div>
          <div className="text-xs text-muted-foreground">Conversão</div>
        </div>
      </div>
    </div>
  );
}