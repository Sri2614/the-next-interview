import AssessmentClient from '@/components/AssessmentClient'

interface Props {
  params: { sessionId: string }
}

export default function AssessmentPage({ params }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
          <a href="/resume" className="hover:text-white transition-colors">Resumes</a>
          <span>→</span>
          <span>Prep</span>
          <span>→</span>
          <span style={{ color: 'var(--text-secondary)' }}>Assessment</span>
        </div>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Mock Interview</h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
          Answer each question as you would in a real interview. Your answers will be evaluated by AI.
        </p>
      </div>
      <AssessmentClient sessionId={params.sessionId} />
    </div>
  )
}
