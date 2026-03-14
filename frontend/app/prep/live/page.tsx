'use client'

/**
 * /prep/live?id=<vacancyId>
 *
 * Client-side prep page for real (live) vacancies fetched from the JSearch API.
 * Because live vacancy data isn't stored in local JSON files, we save it to
 * localStorage in MatchClient and load it here.
 */

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import type { Vacancy } from '@/types/vacancy'
import { getLiveVacancy } from '@/lib/session'
import PrepClient from '@/components/PrepClient'
import StepProgress from '@/components/StepProgress'

export default function PrepLivePage() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id') ?? ''

  const [vacancy, setVacancy] = useState<Vacancy | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) { setNotFound(true); return }
    const v = getLiveVacancy(id)
    if (v) {
      setVacancy(v)
    } else {
      setNotFound(true)
    }
  }, [id])

  if (notFound) {
    return (
      <div className="space-y-6">
        <StepProgress currentStep={3} />
        <div
          className="rounded-2xl p-8 text-center space-y-4"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <div className="text-3xl">⚠️</div>
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Vacancy not found</h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            This session may have expired. Go back to Match and select the role again.
          </p>
          <Link
            href="/resume"
            className="inline-block px-6 py-3 rounded-xl text-white font-medium"
            style={{ background: 'var(--accent)' }}
          >
            ← Back to Start
          </Link>
        </div>
      </div>
    )
  }

  if (!vacancy) {
    return (
      <div className="space-y-6">
        <StepProgress currentStep={3} />
        <div className="flex items-center justify-center py-20">
          <div
            className="w-8 h-8 border-2 rounded-full animate-spin"
            style={{ borderColor: 'var(--accent-border)', borderTopColor: 'var(--accent)' }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <StepProgress currentStep={3} />

      <div>
        <div className="flex items-center gap-2 text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
          <Link href="/resume" className="hover:text-white transition-colors">Resume</Link>
          <span>→</span>
          <span>Match</span>
          <span>→</span>
          <span style={{ color: 'var(--text-secondary)' }}>Prep</span>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Step 3 of 5</p>
          <span
            className="text-xs px-2 py-0.5 rounded-full mb-1"
            style={{ background: 'rgba(52,211,153,0.10)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)' }}
          >
            Live Job
          </span>
        </div>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Interview Prep: {vacancy.title}
        </h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
          {[vacancy.company, vacancy.industry, vacancy.location].filter(Boolean).join(' · ')}
        </p>
      </div>

      <PrepClient vacancy={vacancy} />
    </div>
  )
}
