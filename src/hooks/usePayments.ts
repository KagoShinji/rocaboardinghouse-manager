import { useState, useEffect } from 'react';
import {
  addDocument,
  updateDocument,
  subscribeToCollection,
  uploadFile,
  where,
  orderBy,
} from '@/lib/firestore';
import { serverTimestamp } from 'firebase/firestore';
import type { Payment } from '@/types';

export function usePayments(tenantId?: string) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const constraints = [];
    if (tenantId) constraints.push(where('tenantId', '==', tenantId));
    constraints.push(orderBy('paymentDate', 'desc'));

    const unsubscribe = subscribeToCollection<Payment>(
      'payments',
      constraints,
      (data) => {
        setPayments(data);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [tenantId]);

  const recordPayment = async (
    payment: Omit<Payment, 'id' | 'createdAt' | 'receiptPhotoUrl'>,
    receiptPhoto?: File
  ) => {
    let receiptPhotoUrl: string | null = null;

    if (receiptPhoto) {
      const path = `receipts/${payment.tenantId}/${payment.billId}_${Date.now()}`;
      receiptPhotoUrl = await uploadFile(path, receiptPhoto);
    }

    return addDocument<Payment>('payments', {
      ...payment,
      receiptPhotoUrl,
      createdAt: serverTimestamp(),
    } as unknown as Omit<Payment, 'id'>);
  };

  return { payments, loading, recordPayment };
}
