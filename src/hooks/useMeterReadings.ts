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
import type { MeterReading } from '@/types';

export function useMeterReadings(roomId?: string, tenantId?: string) {
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const constraints = [];
    if (roomId) constraints.push(where('roomId', '==', roomId));
    if (tenantId) constraints.push(where('tenantId', '==', tenantId));
    constraints.push(orderBy('readingDate', 'desc'));

    const unsubscribe = subscribeToCollection<MeterReading>(
      'meterReadings',
      constraints,
      (data) => {
        setReadings(data);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [roomId, tenantId]);

  const addReading = async (
    reading: Omit<MeterReading, 'id' | 'createdAt' | 'meterPhotoUrl'>,
    meterPhoto?: File
  ) => {
    let meterPhotoUrl = '';

    if (meterPhoto) {
      const path = `meter-readings/${reading.roomId}/${reading.billingPeriod}_${Date.now()}`;
      meterPhotoUrl = await uploadFile(path, meterPhoto);
    }

    return addDocument<MeterReading>('meterReadings', {
      ...reading,
      meterPhotoUrl,
      createdAt: serverTimestamp(),
    } as unknown as Omit<MeterReading, 'id'>);
  };

  const getLatestReading = (forRoomId: string): MeterReading | undefined => {
    return readings.find((r) => r.roomId === forRoomId);
  };

  return { readings, loading, addReading, getLatestReading };
}
