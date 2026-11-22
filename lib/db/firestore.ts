import "server-only";
import { getAdminDb } from "@/lib/firebase/admin";
import {
  CollectionReference,
  DocumentReference,
  DocumentSnapshot,
  Query,
  FieldValue,
  Timestamp,
  WriteBatch,
  WithFieldValue,
  DocumentData,
  WhereFilterOp,
} from "firebase-admin/firestore";

export const adminDb = getAdminDb();

export function getCollection<T extends DocumentData>(name: string): CollectionReference<T> {
  return adminDb.collection(name) as CollectionReference<T>;
}

export function getDocRef<T extends DocumentData>(collectionName: string, id: string): DocumentReference<T> {
  return adminDb.collection(collectionName).doc(id) as DocumentReference<T>;
}

export async function getDoc<T extends DocumentData>(collectionName: string, id: string): Promise<T | null> {
  const snap = await adminDb.collection(collectionName).doc(id).get();
  return snap.exists ? (snap.data() as T) : null;
}

export async function getDocSnapshot<T extends DocumentData>(
  collectionName: string,
  id: string
): Promise<DocumentSnapshot<T> | null> {
  const snap = await adminDb.collection(collectionName).doc(id).get();
  return snap.exists ? (snap as DocumentSnapshot<T>) : null;
}

export async function setDoc<T extends DocumentData>(
  collectionName: string,
  id: string,
  data: WithFieldValue<T>,
  merge = false
): Promise<void> {
  await adminDb.collection(collectionName).doc(id).set(data, { merge });
}

export async function updateDoc<T extends DocumentData>(
  collectionName: string,
  id: string,
  data: Partial<WithFieldValue<T>>
): Promise<void> {
  await adminDb.collection(collectionName).doc(id).update(data as Record<string, unknown>);
}

export async function deleteDoc(collectionName: string, id: string): Promise<void> {
  await adminDb.collection(collectionName).doc(id).delete();
}

export async function addDoc<T extends DocumentData>(
  collectionName: string,
  data: Omit<WithFieldValue<T>, "id"> & { id?: string }
): Promise<string> {
  const docRef = adminDb.collection(collectionName).doc();
  const id = data.id || docRef.id;
  await docRef.set({ ...data, id } as WithFieldValue<T>);
  return id;
}

export async function queryCollection<T extends DocumentData>(
  collectionName: string,
  ...constraints: Array<
    | { field: string; operator: "<" | "<=" | "==" | ">=" | ">" | "array-contains" | "in" | "not-in" | "array-contains-any"; value: unknown }
  >
): Promise<T[]> {
  let query: Query = adminDb.collection(collectionName);
  for (const constraint of constraints) {
    query = query.where(constraint.field, constraint.operator, constraint.value);
  }
  const snap = await query.get();
  return snap.docs.map((doc) => doc.data() as T);
}

export async function queryCollectionWithPagination<T extends DocumentData>(
  collectionName: string,
  page: number,
  limit: number,
  orderByField: string = "createdAt",
  orderDirection: "asc" | "desc" = "desc",
  ...constraints: Array<{ field: string; operator: string; value: unknown }>
): Promise<{ data: T[]; total: number; page: number; totalPages: number }> {
  let query: Query = adminDb.collection(collectionName);
  for (const constraint of constraints) {
    query = query.where(constraint.field, constraint.operator as WhereFilterOp, constraint.value);
  }

  const totalSnap = await query.count().get();
  const total = totalSnap.data().count;

  query = query.orderBy(orderByField, orderDirection).limit(limit).offset((page - 1) * limit);
  const snap = await query.get();
  const data = snap.docs.map((doc) => doc.data() as T);

  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function runTransaction<T>(
  updateFn: (transaction: FirebaseFirestore.Transaction) => Promise<T>
): Promise<T> {
  return adminDb.runTransaction(updateFn);
}

export async function writeBatch(operations: Array<{
  type: "set" | "update" | "delete";
  collection: string;
  id: string;
  data: Record<string, unknown>;
}>): Promise<void> {
  const batch = adminDb.batch();
  for (const op of operations) {
    const ref = adminDb.collection(op.collection).doc(op.id);
    switch (op.type) {
      case "set":
        batch.set(ref, op.data, { merge: true });
        break;
      case "update":
        batch.update(ref, op.data);
        break;
      case "delete":
        batch.delete(ref);
        break;
    }
  }
  await batch.commit();
}

export function createBatch(): WriteBatch {
  return adminDb.batch();
}

export function serverTimestamp(): FieldValue {
  return FieldValue.serverTimestamp();
}

export function increment(n: number): FieldValue {
  return FieldValue.increment(n);
}

export function arrayUnion(...elements: unknown[]): FieldValue {
  return FieldValue.arrayUnion(...elements);
}

export function arrayRemove(...elements: unknown[]): FieldValue {
  return FieldValue.arrayRemove(...elements);
}

export function deleteField(): FieldValue {
  return FieldValue.delete();
}

export function now(): Timestamp {
  return Timestamp.now();
}

export function fromDate(date: Date): Timestamp {
  return Timestamp.fromDate(date);
}

export function fromMillis(millis: number): Timestamp {
  return Timestamp.fromMillis(millis);
}