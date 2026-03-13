import { getResumeById, getAllVacancies } from '@/lib/mock-data'
import { notFound } from 'next/navigation'
import MatchClient from '@/components/MatchClient'

interface Props {
  params: { resumeId: string }
}

export default function MatchPage({ params }: Props) {
  const resume = getResumeById(params.resumeId)
  if (!resume) notFound()

  const vacancies = getAllVacancies()

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
          <a href="/resume" className="hover:text-white transition-colors">Resumes</a>
          <span>→</span>
          <span style={{ color: 'var(--text-secondary)' }}>{resume.name}</span>
        </div>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Job Matches for {resume.name}
        </h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
          {resume.role} · {resume.yearsExperience} years experience
        </p>
      </div>
      <MatchClient resume={resume} vacancies={vacancies} />
    </div>
  )
}
