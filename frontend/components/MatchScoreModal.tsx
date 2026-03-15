'use client'

import { useRouter } from 'next/navigation'

interface MatchScoreModalProps {
  score: number
  vacancyTitle: string
  company: string
  onClose: () => void
  onProceed: () => void
}

export default function MatchScoreModal({
  score,
  vacancyTitle,
  company,
  onClose,
  onProceed,
}: MatchScoreModalProps) {
  const router = useRouter()

  const isStretch = score < 50
  // score >= 80 → no modal, just navigate

  const scoreColor = isStretch ? '#f87171' : '#fbbf24'
  const scoreBg = isStretch ? 'rgba(248,113,113,0.1)' : 'rgba(251,191,36,0.1)'
  const scoreBorder = isStretch ? 'rgba(248,113,113,0.25)' : 'rgba(251,191,36,0.25)'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 space-y-5"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{ background: scoreBg, border: `1px solid ${scoreBorder}` }}
          >
            {isStretch ? '🧗' : '📚'}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-lg opacity-50 hover:opacity-100 transition-opacity"
            style={{ color: 'var(--text-muted)' }}
          >
            ×
          </button>
        </div>

        {/* Score pill */}
        <div>
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold mb-3"
            style={{ background: scoreBg, color: scoreColor, border: `1px solid ${scoreBorder}` }}
          >
            <span>{score}% Match</span>
            <span>·</span>
            <span>{isStretch ? 'Stretch Role' : 'Below Threshold'}</span>
          </div>
          <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            {isStretch
              ? 'This role may be a stretch right now'
              : "You're close — a bit more prep could make you competitive"}
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {isStretch ? (
              <>
                Your match score of <strong style={{ color: scoreColor }}>{score}%</strong> for{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{vacancyTitle}</strong> at {company} suggests there
                are significant skill gaps. Practice common problems to build your foundations first.
              </>
            ) : (
              <>
                You&apos;re at <strong style={{ color: scoreColor }}>{score}%</strong> for{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{vacancyTitle}</strong> — our recommended threshold
                is 80%. A focused prep session can close that gap quickly.
              </>
            )}
          </p>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {isStretch && (
            <button
              onClick={() => { onClose(); router.push('/practice') }}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:scale-105"
              style={{ background: 'var(--accent)', color: 'white' }}
            >
              🏋️ Practice Interview Problems First
            </button>
          )}

          <button
            onClick={() => { onClose(); onProceed() }}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-80"
            style={{
              background: isStretch ? 'var(--bg-elevated)' : 'var(--accent)',
              color: isStretch ? 'var(--text-secondary)' : 'white',
              border: isStretch ? '1px solid var(--border)' : 'none',
            }}
          >
            {isStretch ? `Prep for ${vacancyTitle} anyway →` : `Start Interview Prep →`}
          </button>

          {!isStretch && (
            <button
              onClick={() => { onClose(); router.push('/practice') }}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-80"
              style={{
                background: 'var(--bg-elevated)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
              }}
            >
              🏋️ Browse Practice Problems First
            </button>
          )}
        </div>

        {/* Tip */}
        <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
          💡 Most users improve their score by 15-25% after practicing 5-10 problems
        </p>
      </div>
    </div>
  )
}
