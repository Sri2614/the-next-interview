'use client'

import { useEffect, useState } from 'react'
import { getCustomResume } from '@/lib/session'
import MatchClient from '@/components/MatchClient'
import type { Vacancy } from '@/types/vacancy'

interface Props {
  vacancies: Vacancy[]
}

export default function MatchClientCustom({ vacancies }: Props) {
  const [resume, setResume] = useState<ReturnType<typeof getCustomResume>>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setResume(getCustomResume())
    setLoaded(true)
  }, [])

  if (!loaded) {
    return (
      <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
        Loading resume…
      </div>
    )
  }

  if (!resume) {
    return (
      <div className="text-center py-16 space-y-3">
        <div className="text-4xl">📄</div>
        <p style={{ color: 'var(--text-secondary)' }}>No uploaded resume found.</p>
        <a
          href="/resume"
          className="inline-block px-6 py-2.5 rounded-xl text-white text-sm font-medium"
          style={{ background: 'var(--accent)' }}
        >
          Upload Your Resume →
        </a>
      </div>
    )
  }

  // Always show dropdowns first — no autoStart so user can set role/location before matching
  return <MatchClient resume={resume} vacancies={vacancies} />
}
