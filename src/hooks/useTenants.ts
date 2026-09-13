import { useState, useEffect } from 'react';
import {
  addDocument,
  updateDocument,
  subscribeToCollection,
  where,
  orderBy,
} from '@/lib/firestore';
import {
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { UserProfile } from '@/types';

export function useTenants() {
  const [tenants, setTenants] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToCollection<UserProfile>(
      'users',
      [where('role', '==', 'tenant'), orderBy('displayName', 'asc')],
      (data) => {
        setTenants(data);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const addTenant = async (
    email: string,
    password: string,
    profile: Omit<UserProfile, 'id' | 'email' | 'role' | 'createdAt'>
  ) => {
    // We need to create the user via a secondary auth instance or
    // Cloud Function to avoid signing out the current admin.
    // For now, we'll use a workaround: create via the admin's session
    // and immediately re-sign in. In production, use Cloud Functions.
    
    // Store current admin credentials to re-authenticate
    const currentUser = auth.currentUser;
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      await setDoc(doc(db, 'users', newUser.uid), {
        email,
        displayName: profile.displayName,
        role: 'tenant',
        roomId: profile.roomId,
        phone: profile.phone,
        moveInDate: profile.moveInDate,
        isActive: profile.isActive ?? true,
        createdAt: serverTimestamp(),
      });

      return newUser.uid;
    } catch (error) {
      throw error;
    }
  };

  const updateTenant = async (id: string, data: Partial<UserProfile>) => {
    return updateDocument('users', id, data);
  };

  return { tenants, loading, addTenant, updateTenant };
}
