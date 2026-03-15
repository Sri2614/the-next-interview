'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getPrepSession, getAssessmentSession } from '@/lib/session'

interface FlowState {
  type: 'assessment' | 'prep'
  label: string
  subtitle: string
  href: string
}

export default function ContinueFlowBanner() {
  const [flow, setFlow] = useState<FlowState | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Don't show if already dismissed in this browser session
    if (sessionStorage.getItem('tni_banner_dismissed') === '1') return

    const assessment = getAssessmentSession()
    if (assessment && !assessment.completedAt) {
      const prep = getPrepSession()
      const title = prep?.matchResult?.vacancyTitle ?? prep?.vacancyId ?? 'your role'
      const company = prep?.matchResult?.vacancyCompany ?? ''
      setFlow({
        type: 'assessment',
        label: `Continue Mock Interview${title ? `: ${title}` : ''}`,
        subtitle: company ? `${company} · Pick up where you left off` : 'Pick up where you left off',
        href: `/assessment/${assessment.sessionId}`,
      })
      return
    }

    const prep = getPrepSession()
    if (prep && prep.generatedQuestions && prep.generatedQuestions.length > 0) {
      const title = prep.matchResult?.vacancyTitle ?? prep.vacancyId ?? 'your role'
      const company = prep.matchResult?.vacancyCompany ?? ''
      setFlow({
        type: 'prep',
        label: `Continue Prep${title ? `: ${title}` : ''}`,
        subtitle: company ? `${company} · Questions already generated` : 'Questions already generated',
        href: `/prep/${prep.vacancyId}`,
      })
    }
  }, [])

  if (!flow || dismissed) return null

  function dismiss() {
    sessionStorage.setItem('tni_banner_dismissed', '1')
    setDismissed(true)
  }

  const isAssessment = flow.type === 'assessment'

  return (
    <div
      className="rounded-2xl p-4 flex items-center gap-4 mb-2"
      style={{
        background: isAssessment
          ? 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(109,40,217,0.06))'
          : 'linear-gradient(135deg, rgba(52,211,153,0.1), rgba(16,185,129,0.05))',
        border: `1px solid ${isAssessment ? 'rgba(139,92,246,0.25)' : 'rgba(52,211,153,0.2)'}`,
      }}
    >
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
        style={{
          background: isAssessment ? 'rgba(139,92,246,0.15)' : 'rgba(52,211,153,0.12)',
        }}
      >
        {isAssessment ? '🎤' : '📋'}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
          {flow.label}
        </p>
        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
          {flow.subtitle}
        </p>
      </div>

      {/* CTA */}
      <button
        onClick={() => router.push(flow.href)}
        className="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105"
        style={{
          background: isAssessment ? 'var(--accent)' : 'rgba(52,211,153,0.15)',
          color: isAssessment ? 'white' : '#34d399',
          border: isAssessment ? 'none' : '1px solid rgba(52,211,153,0.3)',
        }}
      >
        Continue →
      </button>

      {/* Dismiss */}
      <button
        onClick={dismiss}
        className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-lg leading-none transition-opacity hover:opacity-100 opacity-50"
        style={{ color: 'var(--text-muted)' }}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  )
}
