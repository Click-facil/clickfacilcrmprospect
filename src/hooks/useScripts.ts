// src/hooks/useScripts.ts - FIRESTORE + MULTI-USUÁRIO

import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import {
  collection, doc, getDocs, addDoc, updateDoc,
  deleteDoc, query, where, Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Script } from '@/types/lead';

const scriptsCol = collection(db, 'scripts');

const waitForAuth = (): Promise<string> =>
  new Promise((resolve, reject) => {
    const auth = getAuth();
    if (auth.currentUser) { resolve(auth.currentUser.uid); return; }
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) { unsub(); resolve(user.uid); }
      else      { unsub(); reject(new Error('Não autenticado')); }
    });
  });

export const useScripts = () => {
  const [scripts, setScripts] = useState<Script[]>([]);

  const carregar = async () => {
    try {
      const uid = await waitForAuth();
      const q = query(scriptsCol, where('userId', '==', uid));
      const snap = await getDocs(q);
      const loaded: Script[] = snap.docs.map(d => ({
        id:        d.id,
        title:     d.data().title    || '',
        content:   d.data().content  || '',
        category:  d.data().category || 'initial',
        createdAt: d.data().createdAt?.toDate() || new Date(),
        updatedAt: d.data().updatedAt?.toDate() || new Date(),
      }));
      loaded.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      setScripts(loaded);
    } catch (e) {
      console.error('Erro ao carregar scripts:', e);
    }
  };

  useEffect(() => { carregar(); }, []);

  const addScript = async (data: Omit<Script, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const uid = await waitForAuth();
      const ref = await addDoc(scriptsCol, {
        userId:    uid,
        title:     data.title,
        content:   data.content,
        category:  data.category,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      setScripts(prev => [...prev, {
        ...data, id: ref.id, createdAt: new Date(), updatedAt: new Date(),
      }]);
    } catch (e) {
      console.error('Erro ao adicionar script:', e);
    }
  };

  const updateScript = async (id: string, updates: Partial<Script>) => {
    try {
      await updateDoc(doc(scriptsCol, id), {
        ...updates,
        updatedAt: Timestamp.now(),
      });
      setScripts(prev => prev.map(s =>
        s.id === id ? { ...s, ...updates, updatedAt: new Date() } : s
      ));
    } catch (e) {
      console.error('Erro ao atualizar script:', e);
    }
  };

  const deleteScript = async (id: string) => {
    try {
      await deleteDoc(doc(scriptsCol, id));
      setScripts(prev => prev.filter(s => s.id !== id));
    } catch (e) {
      console.error('Erro ao deletar script:', e);
    }
  };

  return { scripts, addScript, updateScript, deleteScript };
};