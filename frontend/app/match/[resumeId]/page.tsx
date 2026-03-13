import { getResumeById, getAllVacancies } from '@/lib/mock-data'
import MatchClient from '@/components/MatchClient'
import MatchClientCustom from '@/components/MatchClientCustom'
import StepProgress from '@/components/StepProgress'

interface Props {
  params: { resumeId: string }
}

export default function MatchPage({ params }: Props) {
  const vacancies = getAllVacancies()
  const isCustom = params.resumeId === 'custom'

  return (
    <div className="space-y-6">
      <StepProgress currentStep={2} />

      <div>
        <div className="flex items-center gap-2 text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
          <a href="/resume" className="hover:text-white transition-colors">Resume</a>
          <span>→</span>
          <span style={{ color: 'var(--text-secondary)' }}>Match</span>
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Step 2 of 5</p>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Job Matches</h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
          AI scoring your profile against 23 vacancies.
        </p>
      </div>

      {isCustom
        ? <MatchClientCustom vacancies={vacancies} />
        : (() => {
            const resume = getResumeById(params.resumeId)
            if (!resume) return (
              <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
                Resume not found. <a href="/resume" style={{ color: 'var(--accent)' }}>Go back</a>
              </div>
            )
            return <MatchClient resume={resume} vacancies={vacancies} />
          })()
      }
    </div>
  )
}
