// src/hooks/useLeads.ts - MULTI-USUÁRIO

import { useState, useEffect } from 'react';
import { Lead, LeadStatus, LEAD_STAGES } from '@/types/lead';
import { useToast } from '@/components/ui/use-toast';
import { firebaseDB } from '@/lib/firebaseDB';

interface UseLeadsProps {
  territory: string;
}

export const useLeads = ({ territory }: UseLeadsProps) => {
  const [leads, setLeads]   = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const carregarLeads = async () => {
    setLoading(true);
    try {
      // Na primeira carga, migra leads antigos sem userId para o usuário atual
      const migrados = await firebaseDB.migrarLeadsAntigos();
      if (migrados > 0) {
        console.log(`🔄 ${migrados} leads migrados para sua conta`);
      }

      let loaded: Lead[];
      if (territory === 'all') {
        loaded = await firebaseDB.getAllLeads();
      } else {
        loaded = await firebaseDB.getLeadsByTerritory(territory);
      }
      setLeads(loaded);
      console.log(`✅ ${loaded.length} leads carregados`);
    } catch (error) {
      console.error('❌ Erro ao carregar leads:', error);
      toast({
        title: 'Erro ao carregar leads',
        description: 'Não foi possível conectar ao Firebase.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregarLeads(); }, [territory]);

  const recarregarLeads = async () => {
    await carregarLeads();
    toast({ title: 'Leads atualizados!', description: `${leads.length} leads carregados.` });
  };

  const addLead = async (newLead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = await firebaseDB.addLead(newLead);
    if (id) {
      await carregarLeads();
      toast({ title: 'Lead adicionado!', description: `${newLead.companyName} foi adicionado.` });
    }
  };

  const updateLead = async (id: string, updates: Partial<Lead>) => {
    const ok = await firebaseDB.updateLead(id, updates);
    if (ok) {
      setLeads(prev => prev.map(l =>
        l.id === id ? { ...l, ...updates, updatedAt: new Date() } : l
      ));
      toast({ title: 'Lead atualizado!', description: 'Informações salvas com sucesso.' });
    }
  };

  const updateLeadStage = async (id: string, stage: LeadStatus) => {
    await updateLead(id, { stage });
  };

  const deleteLead = async (id: string) => {
    const lead = leads.find(l => l.id === id);
    const ok = await firebaseDB.deleteLead(id);
    if (ok) {
      setLeads(prev => prev.filter(l => l.id !== id));
      toast({
        title: 'Lead removido',
        description: `${lead?.companyName} foi removido.`,
        variant: 'destructive',
      });
    }
  };

  const getLeadStats = () => {
    const total = leads.length;
    const byStage: Record<string, number> = {
      [LEAD_STAGES.NEW]: 0,
      [LEAD_STAGES.CONTACTED]: 0,
      [LEAD_STAGES.PROPOSAL_SENT]: 0,
      [LEAD_STAGES.NEGOTIATION]: 0,
      [LEAD_STAGES.WON]: 0,
      [LEAD_STAGES.LOST]: 0,
    };
    for (const lead of leads) {
      if (byStage[lead.stage] !== undefined) byStage[lead.stage]++;
    }
    const conversionRate = total > 0
      ? ((byStage[LEAD_STAGES.WON] / total) * 100).toFixed(1)
      : '0.0';
    return { total, byStage, conversionRate };
  };

  return { leads, loading, addLead, updateLead, updateLeadStage, deleteLead, getLeadStats, recarregarLeads };
};