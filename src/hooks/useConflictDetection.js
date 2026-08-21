import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  collectionGroup
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// Cache configuration
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100;

export function useConflictDetection(plannerId) {
  const [conflicts, setConflicts] = useState([]);
  const cacheRef = useRef(new Map());
  const cacheTimestampsRef = useRef(new Map());

  // Generate cache key from phone and slots
  const getCacheKey = useCallback((vendorPhone, newSlots) => {
    const slotHash = newSlots
      .map(s => `${s.start}-${s.end}`)
      .join('|');
    return `${vendorPhone}:${slotHash}`;
  }, []);

  // Clean expired cache entries
  const cleanExpiredCache = useCallback(() => {
    const now = Date.now();
    const expiredKeys = [];

    for (const [key, timestamp] of cacheTimestampsRef.current.entries()) {
      if (now - timestamp > CACHE_TTL_MS) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => {
      cacheRef.current.delete(key);
      cacheTimestampsRef.current.delete(key);
    });
  }, []);

  // Prune cache if it grows too large
  const pruneCache = useCallback(() => {
    if (cacheRef.current.size > MAX_CACHE_SIZE) {
      const entriesToDelete = cacheRef.current.size - MAX_CACHE_SIZE + 10;
      let deleted = 0;

      for (const key of cacheTimestampsRef.current.keys()) {
        if (deleted >= entriesToDelete) break;
        cacheRef.current.delete(key);
        cacheTimestampsRef.current.delete(key);
        deleted++;
      }
    }
  }, []);

  const checkConflicts = useCallback(async (vendorPhone, newSlots, currentWeddingId) => {
    if (!plannerId || !vendorPhone || !newSlots || newSlots.length === 0) {
      return [];
    }

    // Check cache first
    cleanExpiredCache();
    const cacheKey = getCacheKey(vendorPhone, newSlots);
    
    if (cacheRef.current.has(cacheKey)) {
      return cacheRef.current.get(cacheKey);
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

    // Store result in cache
    cacheRef.current.set(cacheKey, foundConflicts);
    cacheTimestampsRef.current.set(cacheKey, Date.now());
    pruneCache();

    setConflicts(foundConflicts);
    return foundConflicts;
  }, [plannerId, getCacheKey, cleanExpiredCache, pruneCache]);

  return { conflicts, checkConflicts };
}

// Memoized slot overlap check
function slotsOverlap(slot1, slot2) {
  const start1 = new Date(slot1.start).getTime();
  const end1 = new Date(slot1.end).getTime();
  const start2 = new Date(slot2.start).getTime();
  const end2 = new Date(slot2.end).getTime();

  return start1 < end2 && end1 > start2;
}
