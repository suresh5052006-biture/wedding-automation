import { useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [planner, setPlanner] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const plannerDoc = await getDoc(doc(db, 'planners', user.uid));
        if (plannerDoc.exists()) {
          setPlanner({ id: plannerDoc.id, ...plannerDoc.data() });
        }
      } else {
        setPlanner(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signup = async (email, password, name, phone, city) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const plannerData = {
      name,
      phone,
      city,
      email,
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'planners', userCredential.user.uid), plannerData);
    return { id: userCredential.user.uid, ...plannerData };
  };

  const login = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const plannerDoc = await getDoc(doc(db, 'planners', userCredential.user.uid));
    if (plannerDoc.exists()) {
      setPlanner({ id: plannerDoc.id, ...plannerDoc.data() });
    }
    return userCredential.user;
  };

  const logout = async () => {
    await signOut(auth);
  };

  return { user, planner, loading, signup, login, logout };
}
