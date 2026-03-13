import { getVacancyById } from '@/lib/mock-data'
import { notFound } from 'next/navigation'
import PrepClient from '@/components/PrepClient'

interface Props {
  params: { vacancyId: string }
}

export default function PrepPage({ params }: Props) {
  const vacancy = getVacancyById(params.vacancyId)
  if (!vacancy) notFound()

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
          <a href="/resume" className="hover:text-white transition-colors">Resumes</a>
          <span>→</span>
          <span>Match</span>
          <span>→</span>
          <span style={{ color: 'var(--text-secondary)' }}>Prep</span>
        </div>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Interview Prep: {vacancy.title}
        </h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
          {vacancy.company} · {vacancy.industry} · {vacancy.location}
        </p>
      </div>
      <PrepClient vacancy={vacancy} />
    </div>
  )
}
