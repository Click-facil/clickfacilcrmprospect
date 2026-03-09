// src/lib/firebaseDB.ts - MULTI-USUÁRIO SEGURO

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

const verificarPropriedade = async (id: string, uid: string): Promise<boolean> => {
  const snap = await getDoc(doc(db, 'leads', id));
  if (!snap.exists()) return false;
  return snap.data().userId === uid;
};

const leadsCol = collection(db, 'leads');

// Usado apenas na CRIAÇÃO — todos os campos
const toFirestoreCreate = (lead: Partial<Lead>, uid: string) => ({
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
  createdAt:      Timestamp.now(),
  updatedAt:      Timestamp.now(),
});

// Usado em UPDATES — só envia campos explicitamente passados, nunca sobrescreve com vazio
const toFirestoreUpdate = (updates: Partial<Lead>, uid: string) => {
  const data: Record<string, any> = {
    userId:    uid,
    updatedAt: Timestamp.now(),
  };

  // Só inclui campos que foram explicitamente passados E têm valor
  const stringFields: (keyof Lead)[] = [
    'companyName', 'niche', 'territory', 'contactName', 'email',
    'phone', 'whatsapp', 'instagram', 'facebook', 'linkedin',
    'website', 'googleMaps', 'linkWhatsApp', 'notes', 'dataContato',
    'source', 'websiteQuality',
  ];

  for (const field of stringFields) {
    if (field in updates && updates[field] !== undefined) {
      data[field] = updates[field];
    }
  }

  // Stage e valor sempre incluídos se presentes
  if ('stage' in updates && updates.stage !== undefined) {
    data['stage'] = updates.stage;
  }
  if ('valor' in updates && updates.valor !== undefined) {
    data['valor'] = updates.valor;
  }

  return data;
};

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
    const snap = await getDocs(query(leadsCol, where('userId', '==', uid)));
    return snap.docs
      .map(d => fromFirestore(d.id, d.data()))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  async getLeadsByTerritory(territory: string): Promise<Lead[]> {
    const uid = getUid();
    const snap = await getDocs(query(
      leadsCol,
      where('userId', '==', uid),
      where('territory', '==', territory)
    ));
    return snap.docs
      .map(d => fromFirestore(d.id, d.data()))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  async getTerritorios(): Promise<string[]> {
    const uid = getUid();
    const snap = await getDocs(query(leadsCol, where('userId', '==', uid)));
    const set = new Set<string>();
    snap.docs.forEach(d => { const t = d.data().territory; if (t) set.add(t); });
    return Array.from(set).sort();
  },

  async getLeadById(id: string): Promise<Lead | null> {
    const uid  = getUid();
    const snap = await getDoc(doc(leadsCol, id));
    if (!snap.exists()) return null;
    if (snap.data().userId !== uid) {
      console.warn('Acesso negado a lead de outro usuário');
      return null;
    }
    return fromFirestore(snap.id, snap.data());
  },

  async addLead(lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> {
    const uid = getUid();
    // Bloqueia criação de lead sem nome
    if (!lead.companyName?.trim()) {
      console.warn('Tentativa de criar lead sem companyName bloqueada');
      return null;
    }
    const ref = await addDoc(leadsCol, toFirestoreCreate(lead, uid));
    return ref.id;
  },

  async updateLead(id: string, updates: Partial<Lead>): Promise<boolean> {
    const uid = getUid();
    const pertence = await verificarPropriedade(id, uid);
    if (!pertence) {
      console.warn(`Update bloqueado — lead não pertence ao usuário: ${id}`);
      return false;
    }
    // Usa toFirestoreUpdate — nunca sobrescreve campos com vazio
    const data = toFirestoreUpdate(updates, uid);
    await updateDoc(doc(leadsCol, id), data);
    return true;
  },

  async deleteLead(id: string): Promise<boolean> {
    const uid = getUid();
    const pertence = await verificarPropriedade(id, uid);
    if (!pertence) {
      console.warn(`Delete bloqueado — lead não pertence ao usuário: ${id}`);
      return false;
    }
    await deleteDoc(doc(leadsCol, id));
    return true;
  },

  async importLeads(leads: Partial<Lead>[], onProgress?: (p: number) => void): Promise<number> {
    const uid   = getUid();
    const total = leads.length;
    let done    = 0;
    for (let i = 0; i < total; i += 400) {
      const batch = writeBatch(db);
      leads.slice(i, i + 400).forEach(lead => {
        if (!lead.companyName?.trim()) return; // ignora leads sem nome
        const ref = doc(leadsCol);
        batch.set(ref, toFirestoreCreate(lead, uid));
      });
      await batch.commit();
      done += Math.min(400, total - i);
      onProgress?.(Math.round((done / total) * 100));
    }
    return done;
  },

  async exportarLeads(): Promise<Lead[]> {
    return this.getAllLeads();
  },
};