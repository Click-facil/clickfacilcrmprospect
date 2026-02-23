// src/components/pipeline/Pipeline.tsx - RESPONSIVO

import { Lead, PIPELINE_COLUMNS, LeadStatus } from '@/types/lead';
import { LeadCard } from './LeadCard';
import { Plus, ArrowLeft, ArrowRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRef, useState } from 'react';
import { Input } from '@/components/ui/input';

interface PipelineProps {
  leads: Lead[];
  onViewLead: (lead: Lead) => void;
  onStageChange: (leadId: string, stage: LeadStatus) => void;
  onDeleteLead: (leadId: string) => void;
  onAddLead: () => void;
}

export function Pipeline({
  leads,
  onViewLead,
  onStageChange,
  onDeleteLead,
  onAddLead,
}: PipelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const scrollLeft  = () => scrollRef.current?.scrollBy({ left: -320, behavior: 'smooth' });
  const scrollRight = () => scrollRef.current?.scrollBy({ left: 320, behavior: 'smooth' });

  const filteredLeads = leads.filter(
    (lead) =>
      lead.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.niche.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStageValue = (stageLeads: Lead[]) =>
    stageLeads.reduce((sum, lead) => sum + (lead.valor || 0), 0);

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

        {/* Busca + navegação */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={scrollLeft} className="flex-shrink-0 h-9 w-9">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Button variant="outline" size="icon" onClick={scrollRight} className="flex-shrink-0 h-9 w-9">
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-hidden -mx-1">
        <div
          ref={scrollRef}
          className="h-full overflow-x-auto overflow-y-hidden px-1 pb-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <style>{`.overflow-x-auto::-webkit-scrollbar{display:none}`}</style>

          <div className="flex gap-3 h-full">
            {PIPELINE_COLUMNS.map((column) => {
              const columnLeads = filteredLeads.filter((l) => l.stage === column.id);
              const totalValue  = getStageValue(columnLeads);

              return (
                /* mobile: 80vw por coluna; desktop: 320px fixo */
                <div key={column.id} className="flex-shrink-0 w-[80vw] sm:w-[300px] md:w-[320px] h-full">
                  <div className="bg-muted/30 rounded-lg h-full flex flex-col">
                    {/* Header da coluna */}
                    <div className="flex-shrink-0 p-3 border-b bg-background/50 rounded-t-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${column.color}`} />
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

                    {/* Cards */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-3">
                      {columnLeads.map((lead) => (
                        <LeadCard
                          key={lead.id}
                          lead={lead}
                          onView={() => onViewLead(lead)}
                          onStageChange={(stage) => onStageChange(lead.id, stage)}
                          onDelete={() => onDeleteLead(lead.id)}
                        />
                      ))}
                      {columnLeads.length === 0 && (
                        <div className="flex items-center justify-center h-32 text-center">
                          <p className="text-xs text-muted-foreground">Nenhum lead</p>
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

      {/* Rodapé com stats — 2 colunas no mobile, 4 no desktop */}
      <div className="flex-shrink-0 grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 pt-3 border-t">
        <div className="text-center">
          <div className="text-xl md:text-2xl font-bold">{filteredLeads.length}</div>
          <div className="text-xs text-muted-foreground">Total</div>
        </div>
        <div className="text-center">
          <div className="text-xl md:text-2xl font-bold text-amber-600">
            {filteredLeads.filter((l) => l.websiteQuality === 'none' || l.websiteQuality === 'poor').length}
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
              ? ((filteredLeads.filter((l) => l.stage === 'won').length / filteredLeads.length) * 100).toFixed(1)
              : '0.0'}%
          </div>
          <div className="text-xs text-muted-foreground">Conversão</div>
        </div>
      </div>
    </div>
  );
}