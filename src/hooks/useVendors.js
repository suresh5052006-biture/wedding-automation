import { useState, useEffect } from 'react';
import {
  collection,
  query,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export function useVendors(weddingId) {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!weddingId) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'weddings', weddingId, 'vendors'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const vendorsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setVendors(vendorsData);
      setLoading(false);
    });

    return unsubscribe;
  }, [weddingId]);

  const addVendor = async (data) => {
    const vendorData = {
      ...data,
      createdAt: serverTimestamp()
    };
    const ref = await addDoc(collection(db, 'weddings', weddingId, 'vendors'), vendorData);
    return ref.id;
  };

  const updateVendor = async (vendorId, data) => {
    await updateDoc(doc(db, 'weddings', weddingId, 'vendors', vendorId), data);
  };

  const deleteVendor = async (vendorId) => {
    await deleteDoc(doc(db, 'weddings', weddingId, 'vendors', vendorId));
  };

  return { vendors, loading, addVendor, updateVendor, deleteVendor };
}
