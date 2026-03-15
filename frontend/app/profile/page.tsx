'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import {
  loadResumeFromFirestore,
  loadMatchHistoryFromFirestore,
  loadPrepHistoryFromFirestore,
} from '@/lib/firestore'
import type { MockResume } from '@/types/resume'
import type { PrepSession } from '@/types/session'

export default function ProfilePage() {
  const { user, loading, signInWithGoogle } = useAuth()
  const [resume, setResume] = useState<MockResume | null>(null)
  const [matchHistory, setMatchHistory] = useState<Array<{
    id: string; role: string; location: string; jobCount: number; topScore: number; createdAt: Date
  }>>([])
  const [prepHistory, setPrepHistory] = useState<PrepSession[]>([])
  const [dataLoading, setDataLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    setDataLoading(true)
    Promise.all([
      loadResumeFromFirestore(user.uid),
      loadMatchHistoryFromFirestore(user.uid),
      loadPrepHistoryFromFirestore(user.uid),
    ]).then(([r, m, p]) => {
      setResume(r)
      setMatchHistory(m)
      setPrepHistory(p)
      setDataLoading(false)
    })
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center py-24 space-y-5">
        <div className="text-5xl">👤</div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Sign in to view your profile</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Save your resume, track your match history, and monitor your interview readiness over time.
        </p>
        <button
          onClick={signInWithGoogle}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold"
          style={{ background: 'var(--accent)' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff" opacity=".8"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#fff" opacity=".6"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff" opacity=".7"/>
          </svg>
          Sign in with Google
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        {user.photoURL ? (
          <Image src={user.photoURL} alt={user.displayName ?? ''} width={64} height={64} className="rounded-full" />
        ) : (
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white" style={{ background: 'var(--accent)' }}>
            {(user.displayName ?? 'U')[0].toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{user.displayName}</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
        </div>
      </div>

      {dataLoading ? (
        <div className="flex items-center gap-3 py-8" style={{ color: 'var(--text-muted)' }}>
          <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
          Loading your data…
        </div>
      ) : (
        <>
          {/* Resume card */}
          <section className="rounded-2xl p-5 space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>📄 Saved Resume</h2>
              <Link href="/resume" className="text-xs" style={{ color: 'var(--accent)' }}>
                {resume ? 'Re-upload →' : 'Upload resume →'}
              </Link>
            </div>
            {resume ? (
              <div className="space-y-2">
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{resume.name} · {resume.role}</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{resume.yearsExperience} years experience</p>
                <div className="flex flex-wrap gap-1.5">
                  {[...( resume.skills?.languages ?? []), ...(resume.skills?.tools ?? [])].slice(0, 10).map(s => (
                    <span key={s} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No resume saved yet. Upload one to get started.</p>
            )}
          </section>

          {/* Match history */}
          <section className="rounded-2xl p-5 space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>🔍 Match History</h2>
              <Link href="/match/custom" className="text-xs" style={{ color: 'var(--accent)' }}>New search →</Link>
            </div>
            {matchHistory.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No searches yet.</p>
            ) : (
              <div className="space-y-2">
                {matchHistory.map(m => (
                  <div key={m.id} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{m.role} · {m.location}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {m.jobCount} jobs · {m.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-sm font-bold" style={{ color: 'var(--accent)' }}>{m.topScore}% top</div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Prep history */}
          <section className="rounded-2xl p-5 space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>🎯 Interview Prep History</h2>
            {prepHistory.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No prep sessions yet. Match a job and start prepping!</p>
            ) : (
              <div className="space-y-2">
                {prepHistory.map(p => (
                  <div key={p.sessionId} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {p.matchResult?.vacancyTitle ?? p.vacancyId}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {p.matchResult?.vacancyCompany ?? ''} · {new Date(p.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-sm font-bold" style={{ color: 'var(--accent)' }}>
                      {p.matchResult?.overallScore ?? 0}% match
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
