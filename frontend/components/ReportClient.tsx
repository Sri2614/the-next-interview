'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { ReadinessReport, AssessmentSession } from '@/types/session'
import { getAssessmentSession, getPrepSession, saveAssessmentSession } from '@/lib/session'

const ADK_BASE = process.env.NEXT_PUBLIC_ADK_URL ?? 'http://localhost:8000'
const APP = 'readiness_assessor'

const VERDICT_CONFIG = {
  ready:        { label: 'Ready to Apply! 🎉', color: '#4ade80', bg: 'rgba(74,222,128,0.1)',  border: 'rgba(74,222,128,0.3)' },
  almost_ready: { label: 'Almost Ready! 💪',   color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.3)' },
  needs_work:   { label: 'Needs More Prep 📚',  color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.3)' },
  not_ready:    { label: 'Not Ready Yet 🔄',    color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.3)' },
}

const PRIORITY_STYLE = {
  high:   { color: '#ef4444', label: 'High' },
  medium: { color: '#f59e0b', label: 'Medium' },
  low:    { color: '#60a5fa', label: 'Low' },
}

const VERDICT_STYLE = {
  excellent: { color: '#4ade80', label: 'Excellent' },
  good:      { color: '#60a5fa', label: 'Good' },
  partial:   { color: '#f59e0b', label: 'Partial' },
  weak:      { color: '#fb923c', label: 'Weak' },
  missing:   { color: '#ef4444', label: 'Not answered' },
}

// Normalizers — AI may return "almost ready" or "Almost_Ready" instead of exact key
function getVerdictConfig(verdict: string) {
  const k = verdict?.toLowerCase().replace(/[\s-]/g, '_') as keyof typeof VERDICT_CONFIG
  return VERDICT_CONFIG[k] ?? VERDICT_CONFIG.needs_work
}
function getAnswerVerdictStyle(verdict: string) {
  const k = verdict?.toLowerCase() as keyof typeof VERDICT_STYLE
  return VERDICT_STYLE[k] ?? VERDICT_STYLE.partial
}
function getPriorityStyle(priority: string) {
  const k = priority?.toLowerCase() as keyof typeof PRIORITY_STYLE
  return PRIORITY_STYLE[k] ?? PRIORITY_STYLE.medium
}

interface Props {
  sessionId: string
}

function ScoreRing({ score, size = 120, strokeWidth = 10 }: { score: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = score >= 80 ? '#4ade80' : score >= 65 ? '#60a5fa' : score >= 45 ? '#f59e0b' : '#ef4444'

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--border)" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease-out' }}
      />
    </svg>
  )
}

export default function ReportClient({ sessionId }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _router = useRouter()
  const [assessment, setAssessment] = useState<AssessmentSession | null>(null)
  const [report, setReport] = useState<ReadinessReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const a = getAssessmentSession()
    // Only use the stored assessment if it belongs to this report session
    if (!a || a.sessionId !== sessionId) return
    setAssessment(a)
    if (a?.report) {
      setReport(a.report)
    } else if (a?.evaluations && a.evaluations.length > 0) {
      generateReport(a) // eslint-disable-line react-hooks/exhaustive-deps
    }
  }, [sessionId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function generateReport(a: AssessmentSession) {
    setLoading(true)
    const userId = 'user-1'
    // Append timestamp so each attempt gets a fresh ADK session (avoids 409 on retry)
    const adkSessionId = `report-${sessionId}-${Date.now()}`
    const prep = getPrepSession()

    try {
      await fetch(`${ADK_BASE}/apps/${APP}/users/${userId}/sessions/${adkSessionId}`, {
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

      const res = await fetch(`${ADK_BASE}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appName: APP, userId, sessionId: adkSessionId, newMessage: { parts: [{ text: prompt }], role: 'user' } }),
      })

      if (!res.ok) throw new Error('ADK server error')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const events: any[] = await res.json()

      const reportEvent = [...events].reverse().find((e: { author?: string }) => e.author === 'readiness_assessor')

      // --- Robust parsing: stateDelta can be already-parsed object or string ---
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
      // Fallback: content.parts text
      if (!parsedReport) {
        const textFallback: string =
          reportEvent?.content?.parts?.findLast((p: { text?: string }) => p.text)?.text
          ?? events.map((e: { content?: { parts?: Array<{ text?: string }> } }) => e.content?.parts?.findLast?.((p: { text?: string }) => p.text)?.text ?? '').join('\n')
        const m = textFallback.match(/\{[\s\S]*"overallScore"[\s\S]*\}/)
        if (m) { try { parsedReport = JSON.parse(m[0]) } catch { /* skip */ } }
      }
      if (parsedReport) {
        setReport(parsedReport)
        saveAssessmentSession({ ...a, report: parsedReport })
      } else {
        throw new Error('Report generation returned no data — click Retry to try again')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-24 space-y-4">
        <div className="w-12 h-12 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto" />
        <p style={{ color: 'var(--text-secondary)' }}>Generating your readiness report...</p>
      </div>
    )
  }

  if (!report && !loading) {
    return (
      <div className="text-center py-16 space-y-4">
        {error ? (
          <>
            <p className="text-sm px-4 py-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>{error}</p>
            <button
              onClick={() => { setError(''); const a = getAssessmentSession(); if (a) generateReport(a) }}
              className="px-6 py-2.5 rounded-xl text-sm font-medium text-white"
              style={{ background: 'var(--accent)' }}
            >
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

  const verdictConf = getVerdictConfig(report.verdict)

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Overall score + verdict */}
      <div className="rounded-2xl p-8" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Score ring */}
          <div className="relative flex-shrink-0">
            <ScoreRing score={report.overallScore} size={140} strokeWidth={12} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>{report.overallScore}</span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>/ 100</span>
            </div>
          </div>
          {/* Verdict */}
          <div className="flex-1 text-center md:text-left space-y-3">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold"
              style={{ background: verdictConf.bg, color: verdictConf.color, border: `1px solid ${verdictConf.border}` }}
            >
              {verdictConf.label}
            </div>
            <p className="text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {report.verdictExplanation}
            </p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Estimated prep time: <span style={{ color: 'var(--text-secondary)' }}>{report.estimatedPrepTime}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Category scores */}
      <div className="grid grid-cols-3 gap-4">
        {([
          ['Technical', report.categoryScores.technical],
          ['Communication', report.categoryScores.communication],
          ['Problem Solving', report.categoryScores.problemSolving],
        ] as [string, number][]).map(([label, score]) => (
          <div key={label} className="rounded-2xl p-5 text-center space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="relative mx-auto" style={{ width: 80, height: 80 }}>
              <ScoreRing score={score} size={80} strokeWidth={7} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{score}</span>
              </div>
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Strengths & weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="rounded-2xl p-5 space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h3 className="font-semibold" style={{ color: '#4ade80' }}>✓ Strengths</h3>
          <ul className="space-y-2">
            {(report.strengths ?? []).map((s, i) => (
              <li key={i} className="text-sm flex items-start gap-2" style={{ color: 'var(--text-secondary)' }}>
                <span style={{ color: '#4ade80', flexShrink: 0 }}>•</span>{s}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl p-5 space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h3 className="font-semibold" style={{ color: '#f59e0b' }}>⚠ Areas to Improve</h3>
          <ul className="space-y-2">
            {(report.weaknesses ?? []).map((w, i) => (
              <li key={i} className="text-sm flex items-start gap-2" style={{ color: 'var(--text-secondary)' }}>
                <span style={{ color: '#f59e0b', flexShrink: 0 }}>•</span>{w}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Study plan */}
      <div className="rounded-2xl p-6 space-y-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>📚 Study Plan</h3>
        <div className="space-y-3">
          {(report.studyPlan ?? []).map((item, i) => {
            const pStyle = getPriorityStyle(item.priority)
            return (
              <div key={i} className="flex items-start gap-4 rounded-xl p-4" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                <span className="text-xs font-semibold px-2 py-0.5 rounded flex-shrink-0 mt-0.5" style={{ background: `${pStyle.color}18`, color: pStyle.color, border: `1px solid ${pStyle.color}30` }}>
                  {pStyle.label}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{item.topic}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{item.reason}</p>
                </div>
                <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>~{item.estimatedHours}h</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Per-answer feedback */}
      {assessment?.evaluations && assessment.evaluations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Question-by-Question Feedback</h3>
          {assessment.evaluations.map((ev, i) => {
            const vStyle = getAnswerVerdictStyle(ev.verdict)
            return (
              <div key={i} className="rounded-2xl p-5 space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-sm flex-1" style={{ color: 'var(--text-primary)' }}>{ev.question}</p>
                  <div className="text-right flex-shrink-0">
                    <div className="text-lg font-bold" style={{ color: vStyle.color }}>{ev.score}</div>
                    <div className="text-xs" style={{ color: vStyle.color }}>{vStyle.label}</div>
                  </div>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{ev.feedback}</p>
                {(ev.missedConcepts?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {ev.missedConcepts.map((mc, mi) => (
                      <span key={mi} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                        Missed: {mc}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Encouragement + actions */}
      <div className="rounded-2xl p-6 space-y-4 text-center" style={{ background: 'var(--accent-soft)', border: '1px solid rgba(139,92,246,0.28)' }}>
        <p className="text-lg" style={{ color: 'var(--text-primary)' }}>{report.encouragement}</p>
        <div className="flex justify-center gap-3 flex-wrap">
          <a href="/resume" className="px-6 py-2.5 rounded-xl text-sm font-medium transition-colors" style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            Try Another Resume
          </a>
          <a href="/resume" className="px-6 py-2.5 rounded-xl text-sm font-medium text-white transition-all" style={{ background: 'var(--accent)' }}>
            Prep for Another Role →
          </a>
        </div>
      </div>
    </div>
  )
}
