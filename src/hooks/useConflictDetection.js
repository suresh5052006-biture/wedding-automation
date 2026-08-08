import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  collectionGroup
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export function useConflictDetection(plannerId) {
  const [conflicts, setConflicts] = useState([]);

  const checkConflicts = useCallback(async (vendorPhone, newSlots, currentWeddingId) => {
    if (!plannerId || !vendorPhone || !newSlots || newSlots.length === 0) {
      return [];
    }

    const foundConflicts = [];

    // Get all weddings for this planner
    const weddingsQuery = query(
      collection(db, 'weddings'),
      where('plannerId', '==', plannerId)
    );
    const weddingsSnapshot = await getDocs(weddingsQuery);

    // For each wedding, check vendors with matching phone
    for (const weddingDoc of weddingsSnapshot.docs) {
      const weddingData = weddingDoc.data();
      const weddingId = weddingDoc.id;

      // Skip current wedding when editing
      if (weddingId === currentWeddingId) continue;

      const vendorsQuery = query(
        collection(db, 'weddings', weddingId, 'vendors'),
        where('phone', '==', vendorPhone)
      );
      const vendorsSnapshot = await getDocs(vendorsQuery);

      for (const vendorDoc of vendorsSnapshot.docs) {
        const vendorData = vendorDoc.data();
        const existingSlots = vendorData.slots || [];

        // Check for overlapping slots
        for (const newSlot of newSlots) {
          for (const existingSlot of existingSlots) {
            if (slotsOverlap(newSlot, existingSlot)) {
              foundConflicts.push({
                weddingId,
                weddingName: weddingData.coupleName,
                vendorName: vendorData.name,
                vendorPhone: vendorData.phone,
                conflictSlot: existingSlot,
                newSlot
              });
            }
          }
        }
      }
    }

    setConflicts(foundConflicts);
    return foundConflicts;
  }, [plannerId]);

  return { conflicts, checkConflicts };
}

function slotsOverlap(slot1, slot2) {
  const start1 = new Date(slot1.start).getTime();
  const end1 = new Date(slot1.end).getTime();
  const start2 = new Date(slot2.start).getTime();
  const end2 = new Date(slot2.end).getTime();

  return start1 < end2 && end1 > start2;
}
