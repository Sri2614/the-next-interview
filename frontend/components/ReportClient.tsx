'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { ReadinessReport, AssessmentSession, RecommendationReport } from '@/types/session'
import { getAssessmentSession, getPrepSession, saveAssessmentSession, saveRecommendations } from '@/lib/session'
import { collectSSEEvents } from '@/lib/adk-client'

const ADK_BASE = process.env.NEXT_PUBLIC_ADK_URL || 'https://the-next-interview-agents-379802788252.us-central1.run.app'

const VERDICT_CONFIG = {
  ready:        { label: 'Ready to Apply! 🎉', color: '#4ade80', bg: 'rgba(74,222,128,0.1)',  border: 'rgba(74,222,128,0.3)' },
  almost_ready: { label: 'Almost Ready! 💪',   color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.3)' },
  needs_work:   { label: 'Needs More Prep 📚',  color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.3)' },
  not_ready:    { label: 'Not Ready Yet 🔄',    color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.3)' },
}

const PRIORITY_STYLE = {
  high:   { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   label: 'High' },
  medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  label: 'Med' },
  low:    { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  label: 'Low' },
}

const ANSWER_VERDICT_STYLE = {
  excellent: { color: '#4ade80', label: 'Excellent' },
  good:      { color: '#60a5fa', label: 'Good' },
  partial:   { color: '#f59e0b', label: 'Partial' },
  weak:      { color: '#fb923c', label: 'Weak' },
  missing:   { color: '#ef4444', label: 'Not answered' },
}

const PROVIDER_COLOR: Record<string, string> = {
  'Google Cloud Skills Boost': '#4285F4',
  'Coursera':                  '#0056D2',
  'Udemy':                     '#A435F0',
  'YouTube':                   '#FF0000',
  'Official Docs':             '#10b981',
}
const PROVIDER_ICON: Record<string, string> = {
  'Google Cloud Skills Boost': '☁️',
  'Coursera':                  '🎓',
  'Udemy':                     '📘',
  'YouTube':                   '▶️',
  'Official Docs':             '📖',
}

function getVerdictConfig(v: string) {
  const k = v?.toLowerCase().replace(/[\s-]/g, '_') as keyof typeof VERDICT_CONFIG
  return VERDICT_CONFIG[k] ?? VERDICT_CONFIG.needs_work
}
function getPriorityStyle(p: string) {
  return PRIORITY_STYLE[(p?.toLowerCase() as keyof typeof PRIORITY_STYLE)] ?? PRIORITY_STYLE.medium
}
function getAnswerStyle(v: string) {
  return ANSWER_VERDICT_STYLE[(v?.toLowerCase() as keyof typeof ANSWER_VERDICT_STYLE)] ?? ANSWER_VERDICT_STYLE.partial
}
function scoreColor(n: number) {
  return n >= 80 ? '#4ade80' : n >= 65 ? '#60a5fa' : n >= 45 ? '#f59e0b' : '#ef4444'
}

// ── Large score ring ──────────────────────────────────────────────────────────
function ScoreRing({ score, size = 130, strokeWidth = 11 }: { score: number; size?: number; strokeWidth?: number }) {
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const c = scoreColor(score)
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={strokeWidth} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={c} strokeWidth={strokeWidth}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }} />
    </svg>
  )
}

// ── Animated horizontal bar ───────────────────────────────────────────────────
function ScoreBar({ label, score }: { label: string; score: number }) {
  const [w, setW] = useState(0)
  const c = scoreColor(score)
  useEffect(() => { const t = setTimeout(() => setW(score), 150); return () => clearTimeout(t) }, [score])
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span className="text-sm font-bold tabular-nums" style={{ color: c }}>{score}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-1.5 rounded-full"
          style={{ width: `${w}%`, background: `linear-gradient(90deg,${c}99,${c})`, transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)' }} />
      </div>
    </div>
  )
}

// ── Q&A accordion card ────────────────────────────────────────────────────────
interface EvalItem {
  question: string; score: number; verdict: string; feedback: string
  missedConcepts: string[]; suggestedStudyTopics?: string[]
}
function QuestionCard({ ev, idx }: { ev: EvalItem; idx: number }) {
  const [open, setOpen] = useState(false)
  const vs = getAnswerStyle(ev.verdict)
  const sc = scoreColor(ev.score)
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      {/* collapsed header */}
      <button onClick={() => setOpen(!open)} className="w-full text-left px-4 py-3.5 flex items-center gap-3" style={{ background: 'transparent' }}>
        <span className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold"
          style={{ background: `${vs.color}18`, color: vs.color, border: `1px solid ${vs.color}30` }}>
          {idx + 1}
        </span>
        <span className="flex-1 text-sm font-medium text-left line-clamp-1" style={{ color: 'var(--text-primary)' }}>
          {ev.question}
        </span>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-sm font-bold tabular-nums" style={{ color: sc }}>{ev.score}</span>
          <span className="hidden sm:inline text-xs px-2 py-0.5 rounded-full"
            style={{ background: `${vs.color}18`, color: vs.color }}>{vs.label}</span>
          <span className="text-xs" style={{ color: 'var(--text-muted)', transition: 'transform .2s', display: 'inline-block', transform: open ? 'rotate(180deg)' : '' }}>▾</span>
        </div>
      </button>
      {/* mini score bar — always visible */}
      <div className="px-4 pb-2">
        <div className="h-0.5 rounded-full" style={{ background: 'var(--border)' }}>
          <div className="h-0.5 rounded-full" style={{ width: `${ev.score}%`, background: sc }} />
        </div>
      </div>
      {/* expanded */}
      {open && (
        <div className="px-4 pb-4 pt-3 space-y-3" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{ev.question}</p>
          <div className="rounded-lg p-3" style={{ background: 'var(--bg-base)' }}>
            <p className="text-[10px] font-bold tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>AI FEEDBACK</p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{ev.feedback}</p>
          </div>
          {(ev.missedConcepts?.length ?? 0) > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold tracking-widest" style={{ color: 'var(--text-muted)' }}>MISSED CONCEPTS</p>
              <div className="flex flex-wrap gap-1.5">
                {ev.missedConcepts.map((mc, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                    {mc}
                  </span>
                ))}
              </div>
            </div>
          )}
          {(ev.suggestedStudyTopics?.length ?? 0) > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold tracking-widest" style={{ color: 'var(--text-muted)' }}>STUDY NEXT</p>
              <div className="flex flex-wrap gap-1.5">
                {ev.suggestedStudyTopics!.map((t, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)' }}>
                    📚 {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Course accordion row ──────────────────────────────────────────────────────
interface RecItem { topic: string; priority: string; courses: { title: string; provider: string; url: string; duration: string; why: string }[] }
function CourseAccordion({ rec, defaultOpen }: { rec: RecItem; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false)
  const ps = getPriorityStyle(rec.priority)
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-4 py-3.5 flex items-center gap-3"
        style={{ background: 'transparent' }}
      >
        <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
          style={{ background: ps.bg, color: ps.color }}>{ps.label}</span>
        <span className="flex-1 font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{rec.topic}</span>
        <span className="text-xs flex-shrink-0 mr-1" style={{ color: 'var(--text-muted)' }}>{rec.courses.length} courses</span>
        <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)', transition: 'transform .2s', display: 'inline-block', transform: open ? 'rotate(180deg)' : '' }}>▾</span>
      </button>
      {open && (
        <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-3" style={{ borderTop: '1px solid var(--border)' }}>
          {rec.courses.map((course, i) => {
            const pc = PROVIDER_COLOR[course.provider] ?? 'var(--accent)'
            const pi = PROVIDER_ICON[course.provider] ?? '🔗'
            return (
              <a key={i} href={course.url} target="_blank" rel="noopener noreferrer"
                className="mt-3 rounded-xl p-3.5 space-y-2 block transition-all hover:scale-[1.01]"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: `3px solid ${pc}` }}>
                <div className="flex items-start gap-1.5">
                  <span className="text-base flex-shrink-0">{pi}</span>
                  <span className="text-sm font-medium leading-tight" style={{ color: 'var(--text-primary)' }}>{course.title}</span>
                  <span className="flex-shrink-0 text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>↗</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold" style={{ color: pc }}>{course.provider}</span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>·</span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>⏱ {course.duration}</span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{course.why}</p>
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
interface Props { sessionId: string }

export default function ReportClient({ sessionId }: Props) {
  const router = useRouter()
  const [assessment, setAssessment] = useState<AssessmentSession | null>(null)
  const [report, setReport] = useState<ReadinessReport | null>(null)
  const [recommendations, setRecommendations] = useState<RecommendationReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingRecs, setLoadingRecs] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const a = getAssessmentSession()
    if (!a || a.sessionId !== sessionId) return
    setAssessment(a)
    if (a?.report) {
      setReport(a.report)
      if (a.recommendations) setRecommendations(a.recommendations)
      else if (a.report.studyPlan?.length > 0) fetchRecommendations(a.report)
    } else if (a?.evaluations && a.evaluations.length > 0) {
      generateReport(a)
    }
  }, [sessionId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function generateReport(a: AssessmentSession) {
    setLoading(true)
    const userId = 'user-1'
    const adkSessionId = `report-${sessionId}-${Date.now()}`
    const prep = getPrepSession()

    try {
      await fetch(`${ADK_BASE}/apps/readiness_assessor/users/${userId}/sessions/${adkSessionId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}),
      })

      const avgScore = a.evaluations!.reduce((s, e) => s + e.score, 0) / a.evaluations!.length
      const matchScore = prep?.matchResult?.overallScore ?? 50

      const prompt = `Generate a final readiness report.
Vacancy: ${a.vacancyId}.
Resume match score: ${matchScore}/100.
Answer evaluations: ${JSON.stringify(a.evaluations!.map(e => ({ score: e.score, verdict: e.verdict, missedConcepts: e.missedConcepts, suggestedStudyTopics: e.suggestedStudyTopics })))}.
Average answer score: ${Math.round(avgScore)}/100.
${prep?.matchResult ? `Missing skills: ${prep.matchResult.missingSkills.join(', ')}` : ''}

Generate ReadinessReport JSON with: overallScore (0-100), verdict (ready/almost_ready/needs_work/not_ready), verdictLabel, verdictExplanation, categoryScores (technical/communication/problemSolving each 0-100), strengths[], weaknesses[], studyPlan[] (each with topic/priority/reason/estimatedHours), encouragement, estimatedPrepTime.`

      const events = await collectSSEEvents(`${ADK_BASE}/run_sse`, {
        appName: 'readiness_assessor', userId, sessionId: adkSessionId, newMessage: { parts: [{ text: prompt }], role: 'user' },
      })
      const reportEvent = [...events].reverse().find((e: { author?: string }) => e.author === 'readiness_assessor')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawData: any = reportEvent?.actions?.stateDelta?.readiness_report
      let parsedReport: ReadinessReport | null = null

      if (rawData !== undefined && rawData !== null) {
        if (typeof rawData === 'object' && 'overallScore' in rawData) {
          parsedReport = rawData as ReadinessReport
        } else {
          const rawStr = typeof rawData === 'string' ? rawData : JSON.stringify(rawData)
          try { parsedReport = JSON.parse(rawStr) } catch {
            const m = rawStr.match(/\{[\s\S]*"overallScore"[\s\S]*\}/)
            if (m) { try { parsedReport = JSON.parse(m[0]) } catch { /* skip */ } }
          }
        }
      }
      if (!parsedReport) {
        const textFallback: string =
          reportEvent?.content?.parts?.findLast((p: { text?: string }) => p.text)?.text
          ?? events.map((e: { content?: { parts?: Array<{ text?: string }> } }) => e.content?.parts?.findLast?.((p: { text?: string }) => p.text)?.text ?? '').join('\n')
        const m = textFallback.match(/\{[\s\S]*"overallScore"[\s\S]*\}/)
        if (m) { try { parsedReport = JSON.parse(m[0]) } catch { /* skip */ } }
      }

      if (parsedReport) {
        setReport(parsedReport)
        const updated = { ...a, report: parsedReport }
        saveAssessmentSession(updated)
        if (parsedReport.studyPlan?.length > 0) fetchRecommendations(parsedReport)
      } else {
        throw new Error('Report generation returned no data — click Retry to try again')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  async function fetchRecommendations(r: ReadinessReport) {
    if (!r.studyPlan?.length) return
    setLoadingRecs(true)
    const userId = 'user-1'
    const adkSessionId = `recs-${sessionId}-${Date.now()}`

    try {
      await fetch(`${ADK_BASE}/apps/recommendation_agent/users/${userId}/sessions/${adkSessionId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}),
      })

      const prompt = `Recommend courses for these skill gaps from a readiness report study plan:
${JSON.stringify(r.studyPlan.map(item => ({ topic: item.topic, priority: item.priority, reason: item.reason })))}

For each topic, recommend 2-3 real online courses from Google Cloud Skills Boost, Coursera, Udemy, YouTube, or Official Docs.`

      const events = await collectSSEEvents(`${ADK_BASE}/run_sse`, {
        appName: 'recommendation_agent', userId, sessionId: adkSessionId, newMessage: { parts: [{ text: prompt }], role: 'user' },
      })
      const recEvent = [...events].reverse().find((e: { author?: string }) => e.author === 'recommendation_agent')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawData: any = recEvent?.actions?.stateDelta?.course_recommendations
      let parsedRecs: RecommendationReport | null = null

      if (rawData !== undefined && rawData !== null) {
        if (typeof rawData === 'object' && 'recommendations' in rawData) {
          parsedRecs = rawData as RecommendationReport
        } else {
          const rawStr = typeof rawData === 'string' ? rawData : JSON.stringify(rawData)
          try { parsedRecs = JSON.parse(rawStr) } catch {
            const m = rawStr.match(/\{[\s\S]*"recommendations"[\s\S]*\}/)
            if (m) { try { parsedRecs = JSON.parse(m[0]) } catch { /* skip */ } }
          }
        }
      }
      if (!parsedRecs) {
        const text: string = recEvent?.content?.parts?.findLast((p: { text?: string }) => p.text)?.text ?? ''
        const m = text.match(/\{[\s\S]*"recommendations"[\s\S]*\}/)
        if (m) { try { parsedRecs = JSON.parse(m[0]) } catch { /* skip */ } }
      }

      if (parsedRecs) {
        setRecommendations(parsedRecs)
        saveRecommendations(sessionId, parsedRecs)
      }
    } catch {
      // Recommendations are optional — fail silently
    } finally {
      setLoadingRecs(false)
    }
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handlePrint() {
    window.print()
  }

  function handleRetake() {
    const prep = getPrepSession()
    if (!prep) { router.push('/resume'); return }
    const currentScore = report?.overallScore ?? 0
    const attemptNum = (assessment?.attemptNumber ?? 1) + 1
    const newSessionId = `${prep.sessionId}-attempt${attemptNum}`
    const newAssessment: AssessmentSession = {
      sessionId: newSessionId,
      prepSessionId: prep.sessionId,
      resumeId: prep.resumeId,
      vacancyId: prep.vacancyId,
      startedAt: new Date().toISOString(),
      answers: [],
      attemptNumber: attemptNum,
      previousScore: currentScore,
    }
    saveAssessmentSession(newAssessment)
    router.push(`/assessment/${newSessionId}`)
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="text-center py-24 space-y-4">
        <div className="w-12 h-12 border-2 rounded-full animate-spin mx-auto"
          style={{ borderColor: 'var(--accent-border)', borderTopColor: 'var(--accent)' }} />
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Analysing your answers and generating report…</p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>This takes about 20-30 seconds</p>
      </div>
    )
  }

  if (!report && !loading) {
    return (
      <div className="text-center py-16 space-y-4">
        {error ? (
          <>
            <p className="text-sm px-4 py-3 rounded-xl mx-auto max-w-md"
              style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>{error}</p>
            <button
              onClick={() => { setError(''); const a = getAssessmentSession(); if (a) generateReport(a) }}
              className="px-6 py-2.5 rounded-xl text-sm font-medium text-white"
              style={{ background: 'var(--accent)' }}>
              ↻ Retry Report Generation
            </button>
          </>
        ) : (
          <p style={{ color: 'var(--text-secondary)' }}>No report found. Complete an assessment first.</p>
        )}
        <a href="/resume" style={{ color: 'var(--accent)' }}>← Back to resumes</a>
      </div>
    )
  }

  if (!report) return null

  const vc = getVerdictConfig(report.verdict)
  const isRetake = (assessment?.attemptNumber ?? 1) > 1
  const prevScore = assessment?.previousScore
  const totalHours = (report.studyPlan ?? []).reduce((s, i) => s + (i.estimatedHours || 0), 0)
  const scoreDelta = isRetake && prevScore !== undefined ? report.overallScore - prevScore : null

  return (
    <div className="space-y-5 max-w-3xl">

      {/* ── Attempt comparison banner ── */}
      {isRetake && prevScore !== undefined && (
        <div className="rounded-2xl p-4 flex items-center gap-3"
          style={{ background: scoreDelta! >= 0 ? 'rgba(74,222,128,0.07)' : 'rgba(245,158,11,0.07)', border: `1px solid ${scoreDelta! >= 0 ? 'rgba(74,222,128,0.25)' : 'rgba(245,158,11,0.25)'}` }}>
          <span className="text-2xl">{scoreDelta! >= 0 ? '📈' : '📉'}</span>
          <div>
            <div className="font-semibold text-sm" style={{ color: scoreDelta! >= 0 ? '#4ade80' : '#f59e0b' }}>
              Attempt {assessment?.attemptNumber} — Score Comparison
            </div>
            <div className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Previous: <strong>{prevScore}%</strong>
              {' → '}
              Now: <strong style={{ color: scoreDelta! >= 0 ? '#4ade80' : '#f59e0b' }}>{report.overallScore}%</strong>
              {' '}
              <strong style={{ color: scoreDelta! >= 0 ? '#4ade80' : '#f59e0b' }}>
                ({scoreDelta! >= 0 ? '+' : ''}{scoreDelta}%)
              </strong>
              {scoreDelta! > 0 ? ' ✅' : ''}
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION 1: Hero Score Card ── */}
      <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>

        {/* Top: ring + verdict + text */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Score ring */}
          <div className="relative flex-shrink-0">
            <ScoreRing score={report.overallScore} size={130} strokeWidth={11} />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>{report.overallScore}</span>
              <span className="text-[10px] font-medium tracking-wider" style={{ color: 'var(--text-muted)' }}>/ 100</span>
            </div>
          </div>

          {/* Verdict + explanation */}
          <div className="flex-1 text-center sm:text-left space-y-2.5">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold"
              style={{ background: vc.bg, color: vc.color, border: `1px solid ${vc.border}` }}>
              {vc.label}
            </span>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {report.verdictExplanation}
            </p>
            {report.estimatedPrepTime && (
              <p className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>
                ⏱ <span>Prep time: <strong>{report.estimatedPrepTime}</strong></span>
              </p>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="shine-divider my-5" />

        {/* Category score bars */}
        <div className="space-y-3.5">
          <p className="text-[10px] font-bold tracking-widest" style={{ color: 'var(--text-muted)' }}>PERFORMANCE BREAKDOWN</p>
          <ScoreBar label="Technical Knowledge" score={report.categoryScores.technical} />
          <ScoreBar label="Communication" score={report.categoryScores.communication} />
          <ScoreBar label="Problem Solving" score={report.categoryScores.problemSolving} />
        </div>
      </div>

      {/* ── SECTION 2: What You Nailed / Level Up Here ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Strengths */}
        <div className="rounded-2xl p-5 space-y-3"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderTop: '2px solid rgba(74,222,128,0.5)' }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🌟</span>
            <h3 className="text-xs font-bold tracking-widest" style={{ color: '#4ade80' }}>WHAT YOU NAILED</h3>
          </div>
          <div className="space-y-2">
            {(report.strengths ?? []).map((s, i) => (
              <div key={i} className="flex items-start gap-2.5 rounded-lg px-3 py-2.5"
                style={{ background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.12)' }}>
                <span className="text-xs mt-0.5 flex-shrink-0 font-bold" style={{ color: '#4ade80' }}>✓</span>
                <span className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{s}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Weaknesses */}
        <div className="rounded-2xl p-5 space-y-3"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderTop: '2px solid rgba(245,158,11,0.5)' }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">⚡</span>
            <h3 className="text-xs font-bold tracking-widest" style={{ color: '#f59e0b' }}>LEVEL UP HERE</h3>
          </div>
          <div className="space-y-2">
            {(report.weaknesses ?? []).map((w, i) => (
              <div key={i} className="flex items-start gap-2.5 rounded-lg px-3 py-2.5"
                style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.12)' }}>
                <span className="text-xs mt-0.5 flex-shrink-0 font-bold" style={{ color: '#f59e0b' }}>→</span>
                <span className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{w}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SECTION 3: Learning Roadmap ── */}
      {(report.studyPlan ?? []).length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          {/* Header */}
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2">
              <span>🗺️</span>
              <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Your Learning Roadmap</h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>
                {(report.studyPlan ?? []).length} topics
              </span>
              {totalHours > 0 && (
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>~{totalHours}h total</span>
              )}
            </div>
          </div>

          {/* Items */}
          <div>
            {(report.studyPlan ?? []).map((item, i) => {
              const ps = getPriorityStyle(item.priority)
              const isLast = i === (report.studyPlan ?? []).length - 1
              return (
                <div key={i} className="flex items-start gap-4 px-5 py-4"
                  style={{ borderLeft: `3px solid ${ps.color}`, borderBottom: isLast ? 'none' : '1px solid var(--border)' }}>
                  {/* Step number */}
                  <div className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                    style={{ background: ps.bg, color: ps.color }}>
                    {i + 1}
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: ps.bg, color: ps.color }}>{ps.label}</span>
                      <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{item.topic}</span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{item.reason}</p>
                  </div>
                  {/* Hours */}
                  {(item.estimatedHours ?? 0) > 0 && (
                    <div className="flex-shrink-0 text-right pl-2">
                      <div className="text-sm font-bold tabular-nums" style={{ color: 'var(--text-secondary)' }}>{item.estimatedHours}h</div>
                      <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>est.</div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── SECTION 4: Course Recommendations ── */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <span>🎓</span>
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Curated Learning Resources</h3>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)' }}>
            Powered by Gemini
          </span>
        </div>

        <div className="p-4 space-y-3">
          {loadingRecs && (
            <div className="flex items-center gap-3 py-3" style={{ color: 'var(--text-muted)' }}>
              <div className="w-4 h-4 border-2 rounded-full animate-spin flex-shrink-0"
                style={{ borderColor: 'var(--accent-border)', borderTopColor: 'var(--accent)' }} />
              <span className="text-sm">Finding the best courses for your gaps…</span>
            </div>
          )}

          {!loadingRecs && recommendations?.recommendations && recommendations.recommendations.length > 0 && (
            <div className="space-y-2">
              {recommendations.recommendations.map((rec, i) => (
                <CourseAccordion key={i} rec={rec} defaultOpen={i === 0} />
              ))}
            </div>
          )}

          {!loadingRecs && !recommendations && (
            <p className="text-sm py-2" style={{ color: 'var(--text-muted)' }}>
              Recommendations will appear after your report is generated.
            </p>
          )}
        </div>
      </div>

      {/* ── SECTION 5: Q&A Breakdown ── */}
      {assessment?.evaluations && assessment.evaluations.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              📋 Question-by-Question Breakdown
            </h3>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {assessment.evaluations.length} questions · tap to expand
            </span>
          </div>
          <div className="space-y-2">
            {assessment.evaluations.map((ev, i) => (
              <QuestionCard key={i} ev={ev as EvalItem} idx={i} />
            ))}
          </div>
        </div>
      )}

      {/* ── SECTION 6: Footer CTA ── */}
      <div className="rounded-2xl p-6 space-y-4" style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent-border)' }}>
        {report.encouragement && (
          <p className="text-base text-center font-medium leading-relaxed" style={{ color: 'var(--text-primary)' }}>
            {report.encouragement}
          </p>
        )}
        <div className="shine-divider" />

        {/* Primary actions */}
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <button
            onClick={handleRetake}
            className="flex-1 sm:flex-none btn-accent px-5 py-3 rounded-xl text-sm font-semibold text-white text-center">
            🔄 Retake Assessment
          </button>
          <a href="/resume"
            className="flex-1 sm:flex-none px-5 py-3 rounded-xl text-sm font-semibold text-center transition-colors"
            style={{ border: '1px solid var(--accent)', color: 'var(--accent)', background: 'transparent' }}>
            Prep for Another Role →
          </a>
        </div>

        {/* Secondary actions */}
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <button
            onClick={handleCopyLink}
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-sm font-medium text-center transition-colors"
            style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'transparent' }}>
            {copied ? '✓ Link copied!' : '🔗 Copy Report Link'}
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-sm font-medium text-center transition-colors"
            style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'transparent' }}>
            🖨️ Print / Save as PDF
          </button>
          <a href="/resume"
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-sm font-medium text-center transition-colors"
            style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'transparent' }}>
            Try Another Resume
          </a>
        </div>

        <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
          Retaking generates fresh questions targeting your latest weak areas
        </p>
      </div>

    </div>
  )
}
