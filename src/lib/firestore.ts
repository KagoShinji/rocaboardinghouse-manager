import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  type WhereFilterOp,
  type DocumentData,
  type QueryConstraint,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';

// ─── Generic Firestore Helpers ───────────────────────────────────────────────

export async function addDocument<T extends DocumentData>(
  collectionName: string,
  data: Omit<T, 'id'>
): Promise<string> {
  const docRef = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateDocument(
  collectionName: string,
  docId: string,
  data: Partial<DocumentData>
): Promise<void> {
  const docRef = doc(db, collectionName, docId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteDocument(
  collectionName: string,
  docId: string
): Promise<void> {
  await deleteDoc(doc(db, collectionName, docId));
}

export async function getDocument<T>(
  collectionName: string,
  docId: string
): Promise<T | null> {
  const docSnap = await getDoc(doc(db, collectionName, docId));
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as T;
}

export async function getDocuments<T>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  const q = query(collection(db, collectionName), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
}

export function subscribeToCollection<T>(
  collectionName: string,
  constraints: QueryConstraint[],
  callback: (data: T[]) => void
): () => void {
  const q = query(collection(db, collectionName), ...constraints);
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
    callback(data);
  });
}

export function subscribeToDocument<T>(
  collectionName: string,
  docId: string,
  callback: (data: T | null) => void
): () => void {
  return onSnapshot(doc(db, collectionName, docId), (docSnap) => {
    if (docSnap.exists()) {
      callback({ id: docSnap.id, ...docSnap.data() } as T);
    } else {
      callback(null);
    }
  });
}

// ─── Storage Helpers ─────────────────────────────────────────────────────────

export async function uploadFile(
  path: string,
  file: File
): Promise<string> {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

// ─── Re-exports for convenience ──────────────────────────────────────────────

export { where, orderBy, query, collection, doc, serverTimestamp };
export type { WhereFilterOp };
