'use client'

import type { PrepSession, AssessmentSession, RecommendationReport } from '@/types/session'
import type { MockResume } from '@/types/resume'

const PREP_SESSION_KEY = 'tni_prep_session'
const ASSESSMENT_SESSION_KEY = 'tni_assessment_session'

/** Sessions older than 7 days are discarded on read to prevent stale data. */
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1_000

// ─── Prep Session ────────────────────────────────────────────────────────────

export function savePrepSession(session: PrepSession): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(PREP_SESSION_KEY, JSON.stringify({ ...session, _savedAt: Date.now() }))
}

export function getPrepSession(): PrepSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(PREP_SESSION_KEY)
    if (!raw) return null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsed: any = JSON.parse(raw)
    if (parsed._savedAt && Date.now() - parsed._savedAt > SESSION_TTL_MS) {
      localStorage.removeItem(PREP_SESSION_KEY)
      return null
    }
    return parsed as PrepSession
  } catch {
    return null
  }
}

export function clearPrepSession(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(PREP_SESSION_KEY)
}

// ─── Assessment Session ───────────────────────────────────────────────────────

export function saveAssessmentSession(session: AssessmentSession): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(ASSESSMENT_SESSION_KEY, JSON.stringify({ ...session, _savedAt: Date.now() }))
}

export function getAssessmentSession(): AssessmentSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(ASSESSMENT_SESSION_KEY)
    if (!raw) return null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsed: any = JSON.parse(raw)
    if (parsed._savedAt && Date.now() - parsed._savedAt > SESSION_TTL_MS) {
      localStorage.removeItem(ASSESSMENT_SESSION_KEY)
      return null
    }
    return parsed as AssessmentSession
  } catch {
    return null
  }
}

export function clearAssessmentSession(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(ASSESSMENT_SESSION_KEY)
}

// ─── Match Cache ──────────────────────────────────────────────────────────────
// Keyed by resumeId so each resume has its own cached results.

import type { MatchResult } from '@/types/vacancy'

export function saveMatchCache(resumeId: string, results: MatchResult[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(`tni_match_${resumeId}`, JSON.stringify({ results, cachedAt: Date.now() }))
}

export function getMatchCache(resumeId: string): MatchResult[] | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(`tni_match_${resumeId}`)
    if (!raw) return null
    const { results, cachedAt } = JSON.parse(raw)
    // Cache valid for 24 hours
    if (Date.now() - cachedAt > 86_400_000) return null
    return results as MatchResult[]
  } catch {
    return null
  }
}

export function clearMatchCache(resumeId: string): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(`tni_match_${resumeId}`)
}

// ─── Custom (Uploaded) Resume ─────────────────────────────────────────────────

const CUSTOM_RESUME_KEY = 'tni_custom_resume'

export function saveCustomResume(resume: MockResume): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(CUSTOM_RESUME_KEY, JSON.stringify(resume))
  // Always clear the match cache when a new resume is saved so the next
  // match run fetches fresh live results instead of returning stale mocks.
  localStorage.removeItem(`tni_match_custom`)
}

export function getCustomResume(): MockResume | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(CUSTOM_RESUME_KEY)
    return raw ? (JSON.parse(raw) as MockResume) : null
  } catch {
    return null
  }
}

export function clearCustomResume(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(CUSTOM_RESUME_KEY)
}

// ─── Live (Real-Time) Vacancy ─────────────────────────────────────────────────
// When the vacancy_matcher returns a real job from JSearch, the job's ID won't
// match any local JSON file. We save the synthetic Vacancy to localStorage so
// the prep page can load it client-side.

import type { Vacancy } from '@/types/vacancy'

export function saveLiveVacancy(vacancy: Vacancy): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(`tni_live_vacancy_${vacancy.id}`, JSON.stringify(vacancy))
}

export function getLiveVacancy(id: string): Vacancy | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(`tni_live_vacancy_${id}`)
    return raw ? (JSON.parse(raw) as Vacancy) : null
  } catch {
    return null
  }
}

// ─── Recommendations ──────────────────────────────────────────────────────────

export function saveRecommendations(sessionId: string, recs: RecommendationReport): void {
  if (typeof window === 'undefined') return
  const a = getAssessmentSession()
  if (a && a.sessionId === sessionId) {
    a.recommendations = recs
    saveAssessmentSession(a)
  }
}

export function getRecommendations(sessionId: string): RecommendationReport | null {
  const a = getAssessmentSession()
  if (!a || a.sessionId !== sessionId) return null
  return a.recommendations ?? null
}
