// src/lib/firebaseDB.ts - MULTI-USUÁRIO

import {
  collection, doc, getDocs, getDoc, addDoc,
  updateDoc, deleteDoc, query, where,
  Timestamp, writeBatch,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from './firebase';
import { Lead, LeadStatus } from '@/types/lead';

const getUid = (): string => {
  const uid = getAuth().currentUser?.uid;
  if (!uid) throw new Error('Usuário não autenticado');
  return uid;
};

const leadsCol = collection(db, 'leads');

const toFirestore = (lead: Partial<Lead>, uid: string) => ({
  userId:         uid,
  companyName:    lead.companyName    || '',
  niche:          lead.niche          || 'Outros',
  territory:      lead.territory      || '',
  contactName:    lead.contactName    || '',
  email:          lead.email          || '',
  phone:          lead.phone          || '',
  whatsapp:       lead.whatsapp       || '',
  instagram:      lead.instagram      || '',
  facebook:       lead.facebook       || '',
  linkedin:       lead.linkedin       || '',
  website:        lead.website        || '',
  googleMaps:     lead.googleMaps     || '',
  linkWhatsApp:   lead.linkWhatsApp   || '',
  stage:          lead.stage          || 'new',
  source:         lead.source         || 'manual',
  websiteQuality: lead.websiteQuality || 'none',
  notes:          lead.notes          || '',
  dataContato:    lead.dataContato    || new Date().toISOString().split('T')[0],
  valor:          lead.valor          || 0,
  createdAt:      lead.createdAt ? Timestamp.fromDate(lead.createdAt) : Timestamp.now(),
  updatedAt:      Timestamp.now(),
});

const fromFirestore = (id: string, data: any): Lead => ({
  id,
  companyName:    data.companyName    || '',
  niche:          data.niche          || 'Outros',
  territory:      data.territory      || '',
  contactName:    data.contactName    || '',
  email:          data.email          || '',
  phone:          data.phone          || '',
  whatsapp:       data.whatsapp       || '',
  instagram:      data.instagram      || '',
  facebook:       data.facebook       || '',
  linkedin:       data.linkedin       || '',
  website:        data.website        || '',
  googleMaps:     data.googleMaps     || '',
  linkWhatsApp:   data.linkWhatsApp   || '',
  stage:          data.stage          as LeadStatus,
  source:         data.source,
  websiteQuality: data.websiteQuality,
  notes:          data.notes          || '',
  dataContato:    data.dataContato,
  valor:          data.valor          || 0,
  createdAt:      data.createdAt?.toDate()  || new Date(),
  updatedAt:      data.updatedAt?.toDate()  || new Date(),
});

export const firebaseDB = {

  async getAllLeads(): Promise<Lead[]> {
    const uid = getUid();
    const q = query(leadsCol, where('userId', '==', uid));
    const snap = await getDocs(q);
    console.log(`📦 ${snap.size} leads para uid ${uid}`);
    const leads = snap.docs.map(d => fromFirestore(d.id, d.data()));
    return leads.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  async getLeadsByTerritory(territory: string): Promise<Lead[]> {
    const uid = getUid();
    const q = query(leadsCol,
      where('userId', '==', uid),
      where('territory', '==', territory)
    );
    const snap = await getDocs(q);
    const leads = snap.docs.map(d => fromFirestore(d.id, d.data()));
    return leads.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  async getLeadById(id: string): Promise<Lead | null> {
    const snap = await getDoc(doc(leadsCol, id));
    return snap.exists() ? fromFirestore(snap.id, snap.data()) : null;
  },

  async addLead(lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> {
    const uid = getUid();
    const ref = await addDoc(leadsCol, toFirestore(lead, uid));
    return ref.id;
  },

  async updateLead(id: string, updates: Partial<Lead>): Promise<boolean> {
    const uid = getUid();
    const data = toFirestore(updates, uid);
    delete (data as any).createdAt;
    await updateDoc(doc(leadsCol, id), data);
    return true;
  },

  async deleteLead(id: string): Promise<boolean> {
    await deleteDoc(doc(leadsCol, id));
    return true;
  },

  async importLeads(leads: Partial<Lead>[], onProgress?: (p: number) => void): Promise<number> {
    const uid = getUid();
    const total = leads.length;
    let done = 0;
    for (let i = 0; i < total; i += 400) {
      const batch = writeBatch(db);
      leads.slice(i, i + 400).forEach(lead => {
        const id = (lead as any).id;
        const ref = id ? doc(leadsCol, id) : doc(leadsCol);
        batch.set(ref, toFirestore(lead, uid), { merge: true });
      });
      await batch.commit();
      done += Math.min(400, total - i);
      onProgress?.(Math.round((done / total) * 100));
    }
    return done;
  },

  // Migra leads antigos (sem userId) para o usuário logado atual
  async migrarLeadsAntigos(): Promise<number> {
    const uid = getUid();
    // Busca TODOS os leads sem userId
    const snap = await getDocs(leadsCol);
    const semUid = snap.docs.filter(d => !d.data().userId);
    if (semUid.length === 0) return 0;
    const batch = writeBatch(db);
    semUid.forEach(d => batch.update(d.ref, { userId: uid }));
    await batch.commit();
    console.log(`✅ ${semUid.length} leads migrados para ${uid}`);
    return semUid.length;
  },

  async exportarLeads(): Promise<Lead[]> {
    return this.getAllLeads();
  },
};