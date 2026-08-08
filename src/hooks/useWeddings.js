import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export function useWeddings(plannerId) {
  const [weddings, setWeddings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!plannerId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'weddings'),
      where('plannerId', '==', plannerId),
      orderBy('weddingDate', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const weddingsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setWeddings(weddingsData);
      setLoading(false);
    });

    return unsubscribe;
  }, [plannerId]);

  const addWedding = async (data) => {
    const weddingData = {
      ...data,
      plannerId,
      createdAt: serverTimestamp()
    };
    const ref = await addDoc(collection(db, 'weddings'), weddingData);
    return ref.id;
  };

  const updateWedding = async (weddingId, data) => {
    await updateDoc(doc(db, 'weddings', weddingId), data);
  };

  const deleteWedding = async (weddingId) => {
    await deleteDoc(doc(db, 'weddings', weddingId));
  };

  return { weddings, loading, addWedding, updateWedding, deleteWedding };
}
