// src/components/dashboard/Dashboard.tsx - RESPONSIVO

import { Users, FileText, TrendingUp, Target } from 'lucide-react';
import { StatsCard } from './StatsCard';
import { PipelineChart } from './PipelineChart';
import { RecentLeads } from './RecentLeads';
import { Lead, LEAD_STAGES } from '@/types/lead';

interface DashboardProps {
  leads: Lead[];
  stats: {
    total: number;
    byStage: Record<string, number>;
    conversionRate: string;
  };
  onViewLead: (lead: Lead) => void;
}

export function Dashboard({ leads, stats, onViewLead }: DashboardProps) {
  const recentLeads = [...leads]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 5);

  const getStat = (key: string) => stats.byStage[key] || 0;

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Visão geral da sua prospecção</p>
      </div>

      {/* Stats Grid — 2 colunas no mobile, 4 no desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <StatsCard
          title="Total de Leads"
          value={stats.total}
          icon={Users}
          subtitle="Todos os leads"
        />
        <StatsCard
          title="Novos Leads"
          value={getStat(LEAD_STAGES.NEW)}
          icon={Target}
          variant="primary"
          subtitle="Aguardando contato"
        />
        <StatsCard
          title="Propostas"
          value={getStat(LEAD_STAGES.PROPOSAL_SENT)}
          icon={FileText}
          variant="warning"
          subtitle="Em análise"
        />
        <StatsCard
          title="Conversão"
          value={`${stats.conversionRate}%`}
          icon={TrendingUp}
          variant="success"
          subtitle={`${getStat(LEAD_STAGES.WON)} fechados`}
        />
      </div>

      {/* Chart + Recent — empilha no mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2">
          <PipelineChart stats={stats.byStage} />
        </div>
        <div>
          <RecentLeads leads={recentLeads} onViewLead={onViewLead} />
        </div>
      </div>

      {/* Stage Summary — 3 colunas no mobile, 6 no desktop */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-4">
        <div className="bg-card rounded-xl p-3 md:p-4 card-shadow border-l-4 border-l-stage-new">
          <p className="text-xs text-muted-foreground truncate">Novos</p>
          <p className="text-xl md:text-2xl font-bold">{getStat(LEAD_STAGES.NEW)}</p>
        </div>
        <div className="bg-card rounded-xl p-3 md:p-4 card-shadow border-l-4 border-l-stage-contacted">
          <p className="text-xs text-muted-foreground truncate">Contatados</p>
          <p className="text-xl md:text-2xl font-bold">{getStat(LEAD_STAGES.CONTACTED)}</p>
        </div>
        <div className="bg-card rounded-xl p-3 md:p-4 card-shadow border-l-4 border-l-stage-proposal">
          <p className="text-xs text-muted-foreground truncate">Propostas</p>
          <p className="text-xl md:text-2xl font-bold">{getStat(LEAD_STAGES.PROPOSAL_SENT)}</p>
        </div>
        <div className="bg-card rounded-xl p-3 md:p-4 card-shadow border-l-4 border-l-stage-negotiation">
          <p className="text-xs text-muted-foreground truncate">Negociação</p>
          <p className="text-xl md:text-2xl font-bold">{getStat(LEAD_STAGES.NEGOTIATION)}</p>
        </div>
        <div className="bg-card rounded-xl p-3 md:p-4 card-shadow border-l-4 border-l-stage-won">
          <p className="text-xs text-muted-foreground truncate">Fechados</p>
          <p className="text-xl md:text-2xl font-bold">{getStat(LEAD_STAGES.WON)}</p>
        </div>
        <div className="bg-card rounded-xl p-3 md:p-4 card-shadow border-l-4 border-l-stage-lost">
          <p className="text-xs text-muted-foreground truncate">Perdidos</p>
          <p className="text-xl md:text-2xl font-bold">{getStat(LEAD_STAGES.LOST)}</p>
        </div>
      </div>
    </div>
  );
}