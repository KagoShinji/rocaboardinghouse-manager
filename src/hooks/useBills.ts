import { useState, useEffect } from 'react';
import {
  addDocument,
  updateDocument,
  subscribeToCollection,
  where,
  orderBy,
} from '@/lib/firestore';
import { serverTimestamp } from 'firebase/firestore';
import type { Bill, BillStatus } from '@/types';

export function useBills(tenantId?: string, status?: BillStatus) {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const constraints = [];
    if (tenantId) constraints.push(where('tenantId', '==', tenantId));
    if (status) constraints.push(where('status', '==', status));
    constraints.push(orderBy('createdAt', 'desc'));

    const unsubscribe = subscribeToCollection<Bill>(
      'bills',
      constraints,
      (data) => {
        setBills(data);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [tenantId, status]);

  const createBill = async (bill: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>) => {
    return addDocument<Bill>('bills', {
      ...bill,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    } as unknown as Omit<Bill, 'id'>);
  };

  const updateBill = async (id: string, data: Partial<Bill>) => {
    return updateDocument('bills', id, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  };

  return { bills, loading, createBill, updateBill };
}
