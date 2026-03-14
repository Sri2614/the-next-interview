'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { GeneratedQuestion, QuestionAnswer, AnswerEvaluation, AssessmentSession } from '@/types/session'
import { getPrepSession, getAssessmentSession, saveAssessmentSession } from '@/lib/session'
import { nanoid } from 'nanoid'
import { collectSSEEvents } from '@/lib/adk-client'
import { ADK_BASE } from '@/lib/constants'

const APP = 'answer_evaluator'

interface Props {
  sessionId: string
}

export default function AssessmentClient({ sessionId }: Props) {
  const router = useRouter()
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [currentQ, setCurrentQ] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [vacancyId, setVacancyId] = useState('')

  useEffect(() => {
    const prep = getPrepSession()
    const assessment = getAssessmentSession()

    if (prep?.generatedQuestions) {
      setQuestions(prep.generatedQuestions)
      setVacancyId(prep.vacancyId)
    }
    // Only restore answers / redirect if this assessment belongs to the current prep session
    if (assessment?.answers && assessment.prepSessionId === sessionId) {
      const answerMap: Record<string, string> = {}
      assessment.answers.forEach(a => { answerMap[a.questionId] = a.userAnswer })
      setAnswers(answerMap)
    }
    if (assessment?.evaluations && assessment.evaluations.length > 0 && assessment.prepSessionId === sessionId) {
      // Already evaluated for THIS prep session — redirect to its report
      router.push(`/report/${assessment.sessionId}`)
    }
  }, [router]) // eslint-disable-line react-hooks/exhaustive-deps

  if (questions.length === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <p style={{ color: 'var(--text-secondary)' }}>No questions found. Go back and generate questions first.</p>
        <a href="/resume" className="text-sm" style={{ color: 'var(--accent)' }}>← Back to resumes</a>
      </div>
    )
  }

  async function submitAnswers() {
    setSubmitting(true)
    setError('')

    const userId = 'user-1'
    // Use random UUID so each attempt gets a fresh ADK session (avoids 409 on retry)
    const adkSessionId = `assess-${nanoid()}`

    try {
      await fetch(`${ADK_BASE}/apps/${APP}/users/${userId}/sessions/${adkSessionId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}),
      })

      const answeredQuestions = questions.map(q => ({
        questionId: q.id,
        question: q.question,
        difficulty: q.difficulty,
        focusArea: q.focusArea,
        keyPoints: q.keyPoints ?? [],
        userAnswer: answers[q.id] ?? '',
      }))

      const prompt = `Evaluate these interview answers for a ${vacancyId} role.
Questions and answers: ${JSON.stringify(answeredQuestions)}.
For each question return: questionId, question, userAnswer, score (0-100), verdict (excellent/good/partial/weak/missing), feedback (2-3 sentences), missedConcepts[], suggestedStudyTopics[].
Return JSON: { "evaluations": [...] }`

      const events = await collectSSEEvents(`${ADK_BASE}/run_sse`, {
        appName: APP, userId, sessionId: adkSessionId, newMessage: { parts: [{ text: prompt }], role: 'user' },
      })

      let evals: AnswerEvaluation[] = []
      const evalEvent = [...events].reverse().find((e: { author?: string }) => e.author === 'answer_evaluator')

      // --- Robust parsing: stateDelta can be already-parsed object or string ---
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawData: any = evalEvent?.actions?.stateDelta?.answer_evaluations
      if (rawData !== undefined && rawData !== null) {
        if (typeof rawData === 'object' && Array.isArray(rawData.evaluations)) {
          evals = rawData.evaluations
        } else {
          const rawStr = typeof rawData === 'string' ? rawData : JSON.stringify(rawData)
          try { evals = JSON.parse(rawStr).evaluations ?? [] } catch {
            const m = rawStr.match(/\{[\s\S]*"evaluations"[\s\S]*\}/)
            if (m) { try { evals = JSON.parse(m[0]).evaluations ?? [] } catch { /* skip */ } }
          }
        }
      }
      // Fallback: content.parts text
      if (evals.length === 0) {
        const textFallback: string =
          evalEvent?.content?.parts?.findLast((p: { text?: string }) => p.text)?.text
          ?? events.map((e: { content?: { parts?: Array<{ text?: string }> } }) => e.content?.parts?.findLast?.((p: { text?: string }) => p.text)?.text ?? '').join('\n')
        const m = textFallback.match(/\{[\s\S]*"evaluations"[\s\S]*\}/)
        if (m) { try { evals = JSON.parse(m[0]).evaluations ?? [] } catch { /* skip */ } }
      }

      // Guard: don't navigate to a broken report if agent returned nothing
      if (evals.length === 0) {
        throw new Error('Evaluation returned no scores — please try again')
      }

      // Save assessment session
      const qaArray: QuestionAnswer[] = questions.map(q => ({
        questionId: q.id, question: q.question, difficulty: q.difficulty,
        focusArea: q.focusArea, userAnswer: answers[q.id] ?? '',
      }))
      const prepSession = getPrepSession()
      const assessSession: AssessmentSession = {
        sessionId: nanoid(),
        prepSessionId: sessionId,
        resumeId: prepSession?.resumeId ?? '',
        vacancyId: vacancyId,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        answers: qaArray,
        evaluations: evals,
      }
      saveAssessmentSession(assessSession)

      router.push(`/report/${assessSession.sessionId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Evaluation failed')
    } finally {
      setSubmitting(false)
    }
  }

  const q = questions[currentQ]
  const answeredCount = Object.values(answers).filter(a => a.trim().length > 0).length
  const progress = (currentQ / questions.length) * 100

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span style={{ color: 'var(--text-secondary)' }}>Question {currentQ + 1} of {questions.length}</span>
          <span style={{ color: 'var(--text-muted)' }}>{answeredCount} answered</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: 'var(--accent)' }} />
        </div>
      </div>

      {/* Question card */}
      <div className="rounded-2xl p-6 space-y-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-start gap-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full badge-${q.difficulty} flex-shrink-0 mt-0.5`}>
            {q.difficulty}
          </span>
          <div className="space-y-1">
            <p className="font-medium text-lg leading-relaxed" style={{ color: 'var(--text-primary)' }}>{q.question}</p>
            {q.focusArea && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Focus: {q.focusArea}</p>}
          </div>
        </div>

        {q.hint && (
          <div className="rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>
            💡 {q.hint}
          </div>
        )}

        <textarea
          value={answers[q.id] ?? ''}
          onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
          placeholder="Type your answer here... Be thorough — explain your reasoning, mention trade-offs, and use specific examples from your experience."
          rows={6}
          className="w-full rounded-xl px-4 py-3 text-sm resize-y outline-none transition-colors"
          style={{
            minHeight: '140px',
            background: 'var(--bg-base)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            fontFamily: 'inherit',
          }}
        />

        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {(answers[q.id] ?? '').length} chars
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
              disabled={currentQ === 0}
              className="px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-40"
              style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            >
              ← Prev
            </button>
            {currentQ < questions.length - 1 ? (
              <button
                onClick={() => setCurrentQ(currentQ + 1)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
                style={{ background: 'var(--accent)' }}
              >
                Next →
              </button>
            ) : (
              <button
                onClick={submitAnswers}
                disabled={submitting || answeredCount === 0}
                className="px-6 py-2 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-60"
                style={{ background: 'var(--success)', color: '#fff' }}
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin inline-block" />
                    Evaluating...
                  </span>
                ) : `Submit ${answeredCount} Answers →`}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Question nav dots */}
      <div className="flex flex-wrap gap-2">
        {questions.map((q, i) => {
          const hasAnswer = (answers[q.id] ?? '').trim().length > 0
          return (
            <button
              key={q.id}
              onClick={() => setCurrentQ(i)}
              className="w-8 h-8 rounded-full text-xs font-medium transition-all"
              style={i === currentQ
                ? { background: 'var(--accent)', color: 'white' }
                : hasAnswer
                  ? { background: 'rgba(5,150,105,0.12)', color: 'var(--success)', border: '1px solid rgba(5,150,105,0.28)' }
                  : { background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
              }
            >
              {i + 1}
            </button>
          )
        })}
      </div>

      {error && (
        <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--error)', border: '1px solid rgba(239,68,68,0.3)' }}>
          {error}
        </div>
      )}
    </div>
  )
}
