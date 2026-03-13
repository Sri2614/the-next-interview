'use client'

import { useRouter } from 'next/navigation'
import type { MockResume } from '@/types/resume'

const SENIORITY_COLORS: Record<string, string> = {
  '0-2': '#4ade80',
  '3-5': '#60a5fa',
  '6-9': '#f59e0b',
  '10+': '#a78bfa',
}

function getSeniorityLabel(years: number): { label: string; color: string } {
  if (years <= 2) return { label: 'Junior', color: SENIORITY_COLORS['0-2'] }
  if (years <= 5) return { label: 'Mid-Level', color: SENIORITY_COLORS['3-5'] }
  if (years <= 9) return { label: 'Senior', color: SENIORITY_COLORS['6-9'] }
  return { label: 'Principal', color: SENIORITY_COLORS['10+'] }
}

interface Props {
  resumes: MockResume[]
}

export default function ResumeSelector({ resumes }: Props) {
  const router = useRouter()

  function handleSelect(resumeId: string) {
    router.push(`/match/${resumeId}`)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {resumes.map(resume => {
        const seniority = getSeniorityLabel(resume.yearsExperience)
        const topSkills = [
          ...resume.skills.languages,
          ...resume.skills.frameworks,
        ].slice(0, 6)

        return (
          <button
            key={resume.id}
            onClick={() => handleSelect(resume.id)}
            className="text-left rounded-2xl p-6 space-y-4 transition-all hover:scale-[1.02] cursor-pointer w-full"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>{resume.name}</h3>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{resume.role}</p>
              </div>
              <span
                className="text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0"
                style={{ background: `${seniority.color}18`, color: seniority.color, border: `1px solid ${seniority.color}30` }}
              >
                {seniority.label}
              </span>
            </div>

            {/* Experience */}
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <span style={{ color: 'var(--accent)' }}>⏱</span>
              {resume.yearsExperience} years experience
            </div>

            {/* Summary */}
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {resume.summary.slice(0, 120)}...
            </p>

            {/* Skills */}
            <div className="flex flex-wrap gap-1.5">
              {topSkills.map(skill => (
                <span
                  key={skill}
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid rgba(139,92,246,0.20)' }}
                >
                  {skill}
                </span>
              ))}
              {resume.skills.languages.length + resume.skills.frameworks.length > 6 && (
                <span className="text-xs px-2 py-0.5" style={{ color: 'var(--text-muted)' }}>
                  +{resume.skills.languages.length + resume.skills.frameworks.length - 6} more
                </span>
              )}
            </div>

            <div
              className="w-full py-2 rounded-xl text-center text-sm font-medium transition-colors"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
            >
              Match Vacancies →
            </div>
          </button>
        )
      })}
    </div>
  )
}
