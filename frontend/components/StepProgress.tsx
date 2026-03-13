'use client'

const STEPS = [
  { label: 'Resume',  short: '1' },
  { label: 'Match',   short: '2' },
  { label: 'Prep',    short: '3' },
  { label: 'Assess',  short: '4' },
  { label: 'Report',  short: '5' },
]

interface Props {
  currentStep: 1 | 2 | 3 | 4 | 5
}

export default function StepProgress({ currentStep }: Props) {
  return (
    <div className="w-full flex items-center justify-center gap-0 mb-6">
      {STEPS.map((step, idx) => {
        const stepNum = idx + 1
        const isDone    = stepNum < currentStep
        const isCurrent = stepNum === currentStep
        const isFuture  = stepNum > currentStep

        return (
          <div key={step.label} className="flex items-center">
            {/* Connector line (before each step except the first) */}
            {idx > 0 && (
              <div
                className="h-px w-8 sm:w-12 flex-shrink-0"
                style={{ background: isDone ? 'var(--accent)' : 'var(--border)' }}
              />
            )}

            {/* Step circle + label */}
            <div className="flex flex-col items-center gap-1">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all"
                style={
                  isDone
                    ? { background: 'var(--accent)', color: 'white', border: '2px solid var(--accent)' }
                    : isCurrent
                    ? { background: 'var(--accent)', color: 'white', border: '2px solid var(--accent)', boxShadow: '0 0 0 3px var(--accent-soft)' }
                    : { background: 'transparent', color: 'var(--text-muted)', border: '2px solid var(--border)' }
                }
              >
                {isDone ? '✓' : step.short}
              </div>
              <span
                className="text-xs font-medium hidden sm:block"
                style={{ color: isFuture ? 'var(--text-muted)' : isCurrent ? 'var(--accent)' : 'var(--text-secondary)' }}
              >
                {step.label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
