'use client'

/**
 * Firestore helpers for user profiles, saved resumes, match history, and prep sessions.
 *
 * All writes are fire-and-forget (non-blocking) — localStorage stays as the
 * primary fast path; Firestore is the persistence layer for signed-in users.
 */

import {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { MockResume } from '@/types/resume'
import type { MatchResult } from '@/types/vacancy'
import type { PrepSession } from '@/types/session'

// ── Resume ────────────────────────────────────────────────────────────────────

export async function saveResumeToFirestore(uid: string, resume: MockResume): Promise<void> {
  try {
    await setDoc(doc(db, 'users', uid, 'profile', 'resume'), {
      ...resume,
      updatedAt: serverTimestamp(),
    })
  } catch (e) {
    console.warn('Firestore saveResume failed (non-critical):', e)
  }
}

export async function loadResumeFromFirestore(uid: string): Promise<MockResume | null> {
  try {
    const snap = await getDoc(doc(db, 'users', uid, 'profile', 'resume'))
    if (!snap.exists()) return null
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { updatedAt, ...resume } = snap.data()
    return resume as MockResume
  } catch (e) {
    console.warn('Firestore loadResume failed:', e)
    return null
  }
}

// ── Match Results ─────────────────────────────────────────────────────────────

export async function saveMatchesToFirestore(
  uid: string,
  role: string,
  location: string,
  results: MatchResult[],
): Promise<void> {
  try {
    await addDoc(collection(db, 'users', uid, 'matches'), {
      role,
      location,
      results,
      jobCount: results.length,
      topScore: results[0]?.overallScore ?? 0,
      createdAt: serverTimestamp(),
    })
  } catch (e) {
    console.warn('Firestore saveMatches failed (non-critical):', e)
  }
}

export async function loadMatchHistoryFromFirestore(
  uid: string,
): Promise<Array<{ id: string; role: string; location: string; jobCount: number; topScore: number; createdAt: Date }>> {
  try {
    const q = query(collection(db, 'users', uid, 'matches'), orderBy('createdAt', 'desc'), limit(20))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({
      id: d.id,
      role: d.data().role,
      location: d.data().location,
      jobCount: d.data().jobCount,
      topScore: d.data().topScore,
      createdAt: d.data().createdAt?.toDate?.() ?? new Date(),
    }))
  } catch (e) {
    console.warn('Firestore loadMatchHistory failed:', e)
    return []
  }
}

// ── Prep Sessions ─────────────────────────────────────────────────────────────

export async function savePrepSessionToFirestore(uid: string, session: PrepSession): Promise<void> {
  try {
    await setDoc(doc(db, 'users', uid, 'prepSessions', session.sessionId), {
      ...session,
      createdAt: serverTimestamp(),
    })
  } catch (e) {
    console.warn('Firestore savePrepSession failed (non-critical):', e)
  }
}

export async function loadPrepHistoryFromFirestore(
  uid: string,
): Promise<PrepSession[]> {
  try {
    const q = query(collection(db, 'users', uid, 'prepSessions'), orderBy('createdAt', 'desc'), limit(20))
    const snap = await getDocs(q)
    return snap.docs.map(d => d.data() as PrepSession)
  } catch (e) {
    console.warn('Firestore loadPrepHistory failed:', e)
    return []
  }
}

// ── User Profile ──────────────────────────────────────────────────────────────

export async function upsertUserProfile(uid: string, name: string, email: string, photoURL: string): Promise<void> {
  try {
    await setDoc(doc(db, 'users', uid, 'profile', 'info'), {
      name,
      email,
      photoURL,
      lastSeenAt: serverTimestamp(),
    }, { merge: true })
  } catch (e) {
    console.warn('Firestore upsertUserProfile failed (non-critical):', e)
  }
}
