import ReportClient from '@/components/ReportClient'

interface Props {
  params: { sessionId: string }
}

export default function ReportPage({ params }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
          <a href="/resume" className="hover:text-white transition-colors">Resumes</a>
          <span>→</span>
          <span>Prep</span>
          <span>→</span>
          <span>Assessment</span>
          <span>→</span>
          <span style={{ color: 'var(--text-secondary)' }}>Report</span>
        </div>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Your Readiness Report</h1>
      </div>
      <ReportClient sessionId={params.sessionId} />
    </div>
  )
}
