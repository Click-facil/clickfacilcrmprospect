// src/hooks/useLeads.ts - MULTI-USUÁRIO COM FILTRO SEM OPORTUNIDADE

import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { Lead, LeadStatus, LEAD_STAGES } from '@/types/lead';
import { useToast } from '@/components/ui/use-toast';
import { firebaseDB } from '@/lib/firebaseDB';

interface UseLeadsProps {
  territory: string;
}

export const useLeads = ({ territory }: UseLeadsProps) => {
  const [allLeads, setAllLeads]   = useState<Lead[]>([]);  // todos incluindo sem oportunidade
  const [loading, setLoading]     = useState(true);
  const [currentUid, setCurrentUid] = useState<string | null>(null);
  const { toast } = useToast();

  // Leads ativos — exclui os marcados como sem oportunidade do pipeline/dashboard
  const leads = allLeads.filter(l => l.stage !== 'no_opportunity');

  // Leads sem oportunidade — para a tela de arquivo
  const leadsSemOportunidade = allLeads.filter(l => l.stage === 'no_opportunity');

  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (user.uid !== currentUid) {
          setAllLeads([]);
          setCurrentUid(user.uid);
        }
      } else {
        setAllLeads([]);
        setCurrentUid(null);
      }
    });
    return () => unsub();
  }, [currentUid]);

  useEffect(() => {
    if (!currentUid) { setLoading(false); return; }
    carregarLeads(currentUid);
  }, [currentUid, territory]);

  const carregarLeads = async (uid?: string) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) { setLoading(false); return; }
    if (uid && uid !== user.uid) return;

    setLoading(true);
    try {
      const loaded = territory === 'all'
        ? await firebaseDB.getAllLeads()
        : await firebaseDB.getLeadsByTerritory(territory);

      const userAposQuery = getAuth().currentUser;
      if (!userAposQuery || userAposQuery.uid !== user.uid) return;

      setAllLeads(loaded);
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

  const recarregarLeads = async () => {
    await carregarLeads();
    toast({ title: 'Leads atualizados!' });
  };

  const addLead = async (newLead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = await firebaseDB.addLead(newLead);
    if (id) {
      await carregarLeads();
      toast({ title: 'Lead adicionado!', description: `${newLead.companyName} adicionado.` });
    }
  };

  const updateLead = async (id: string, updates: Partial<Lead>) => {
    const ok = await firebaseDB.updateLead(id, updates);
    if (ok) {
      setAllLeads(prev => prev.map(l =>
        l.id === id ? { ...l, ...updates, updatedAt: new Date() } : l
      ));
      toast({ title: 'Lead atualizado!' });
    }
  };

  const updateLeadStage = async (id: string, stage: LeadStatus) => {
    await updateLead(id, { stage });
  };

  // Arquiva lead — fica invisível no pipeline mas existe no Firestore
  const arquivarLead = async (id: string) => {
    const ok = await firebaseDB.updateLead(id, { stage: 'no_opportunity' as LeadStatus });
    if (ok) {
      setAllLeads(prev => prev.map(l =>
        l.id === id ? { ...l, stage: 'no_opportunity' as LeadStatus } : l
      ));
    }
  };

  // Arquiva todos os leads com site bom que ainda estão em 'new'
  const arquivarSemOportunidade = async () => {
    const paraArquivar = allLeads.filter(
      l => l.stage === 'new' && l.websiteQuality === 'good'
    );
    for (const lead of paraArquivar) {
      await firebaseDB.updateLead(lead.id, { stage: 'no_opportunity' as LeadStatus });
    }
    setAllLeads(prev => prev.map(l =>
      paraArquivar.find(p => p.id === l.id)
        ? { ...l, stage: 'no_opportunity' as LeadStatus }
        : l
    ));
    toast({
      title: `${paraArquivar.length} leads arquivados`,
      description: 'Leads com site profissional movidos para o arquivo.',
    });
    return paraArquivar.length;
  };

  // Restaura lead arquivado de volta para Novos Líderes
  const restaurarLead = async (id: string) => {
    const ok = await firebaseDB.updateLead(id, { stage: 'new' as LeadStatus });
    if (ok) {
      setAllLeads(prev => prev.map(l =>
        l.id === id ? { ...l, stage: 'new' as LeadStatus } : l
      ));
      toast({ title: 'Lead restaurado para Novos Líderes!' });
    }
  };

  // Deleta permanentemente um lead arquivado
  const deleteLead = async (id: string) => {
    const lead = allLeads.find(l => l.id === id);
    const ok = await firebaseDB.deleteLead(id);
    if (ok) {
      setAllLeads(prev => prev.filter(l => l.id !== id));
      toast({
        title: 'Lead removido',
        description: `${lead?.companyName || 'Lead'} removido permanentemente.`,
        variant: 'destructive',
      });
    }
  };

  // Deleta todos os leads arquivados de uma vez
  const deletarTodosSemOportunidade = async () => {
    const ids = leadsSemOportunidade.map(l => l.id);
    for (const id of ids) {
      await firebaseDB.deleteLead(id);
    }
    setAllLeads(prev => prev.filter(l => l.stage !== 'no_opportunity'));
    toast({
      title: `${ids.length} leads apagados`,
      description: 'Todos os leads sem oportunidade foram removidos.',
      variant: 'destructive',
    });
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
      [LEAD_STAGES.REFUSED]: 0,
    };
    for (const lead of leads) {
      if (byStage[lead.stage] !== undefined) byStage[lead.stage]++;
    }
    const conversionRate = total > 0
      ? ((byStage[LEAD_STAGES.WON] / total) * 100).toFixed(1) : '0.0';
    return { total, byStage, conversionRate };
  };

  return {
    leads,
    leadsSemOportunidade,
    loading,
    addLead,
    updateLead,
    updateLeadStage,
    deleteLead,
    arquivarLead,
    arquivarSemOportunidade,
    restaurarLead,
    deletarTodosSemOportunidade,
    getLeadStats,
    recarregarLeads,
  };
};