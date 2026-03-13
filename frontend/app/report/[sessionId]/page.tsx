import ReportClient from '@/components/ReportClient'
import StepProgress from '@/components/StepProgress'

interface Props {
  params: { sessionId: string }
}

export default function ReportPage({ params }: Props) {
  return (
    <div className="space-y-6">
      <StepProgress currentStep={5} />

      <div>
        <div className="flex items-center gap-2 text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
          <a href="/resume" className="hover:text-white transition-colors">Resume</a>
          <span>→</span>
          <span>Prep</span>
          <span>→</span>
          <span>Assessment</span>
          <span>→</span>
          <span style={{ color: 'var(--text-secondary)' }}>Report</span>
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Step 5 of 5</p>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Your Readiness Report</h1>
      </div>
      <ReportClient sessionId={params.sessionId} />
    </div>
  )
}
