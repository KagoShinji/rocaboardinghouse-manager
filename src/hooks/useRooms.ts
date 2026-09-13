import { useState, useEffect } from 'react';
import {
  getDocuments,
  addDocument,
  updateDocument,
  deleteDocument,
  subscribeToCollection,
  where,
  orderBy,
} from '@/lib/firestore';
import type { Room } from '@/types';

export function useRooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToCollection<Room>(
      'rooms',
      [orderBy('roomNumber', 'asc')],
      (data) => {
        setRooms(data);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const addRoom = async (room: Omit<Room, 'id'>) => {
    return addDocument<Room>('rooms', room);
  };

  const updateRoom = async (id: string, data: Partial<Room>) => {
    return updateDocument('rooms', id, data);
  };

  const deleteRoom = async (id: string) => {
    return deleteDocument('rooms', id);
  };

  return { rooms, loading, addRoom, updateRoom, deleteRoom };
}
