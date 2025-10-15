// src/data/fruitsApi.js
import { db } from '../firebase';
import { doc, getDoc, onSnapshot, updateDoc, deleteDoc, collection, query, orderBy } from 'firebase/firestore';

/** ดึงข้อมูลผลไม้ครั้งเดียวด้วย ID */
export async function getFruitOnce(id) {
  if (!id) return null;
  const snap = await getDoc(doc(db, 'fruits', id));
  if (!snap.exists()) return null;
  return snap.data();
}

/** สมัครรับอัปเดตเรียลไทม์ของผลไม้ (คืนค่า unsubscribe) */
export function subscribeFruit(id, onData, onError) {
  if (!id) return () => { };
  return onSnapshot(
    doc(db, 'fruits', id),
    (snap) => onData?.(snap.exists() ? { id: snap.id, ...snap.data() } : null),
    (err) => onError?.(err)
  );
}

/** แก้ไขข้อมูลผลไม้แบบบางส่วน */
export async function updateFruit(id, partial) {
  if (!id) throw new Error('missing id');
  await updateDoc(doc(db, 'fruits', id), partial);
}

/** ลบผลไม้ */
export async function deleteFruit(id) {
  if (!id) throw new Error('missing id');
  await deleteDoc(doc(db, 'fruits', id));
}

/** สมัครรับอัปเดตเรียลไทม์ของรายการผลไม้ทั้งหมด (คืนค่า unsubscribe) */
export function subscribeFruits(onData, onError) {
  const q = query(collection(db, 'fruits'), orderBy('name'));
  return onSnapshot(
    q,
    (snap) => {
      const rows = [];
      snap.forEach((docSnap) => rows.push({ id: docSnap.id, ...docSnap.data() }));
      onData?.(rows);
    },
    (err) => onError?.(err)
  );
}