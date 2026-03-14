'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Vacancy } from '@/types/vacancy'
import type { GeneratedQuestion, CodeChallenge, PrepSession } from '@/types/session'
import { getPrepSession, savePrepSession } from '@/lib/session'
import { collectSSEEvents } from '@/lib/adk-client'

const ADK_BASE = process.env.NEXT_PUBLIC_ADK_URL || 'https://the-next-interview-agents-379802788252.us-central1.run.app'

interface Props {
  vacancy: Vacancy
}

type Tab = 'questions' | 'challenge'

export default function PrepClient({ vacancy }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('questions')
  const [session, setSession] = useState<PrepSession | null>(null)

  const [questionsLoading, setQuestionsLoading] = useState(false)
  const [questionsText, setQuestionsText] = useState('')
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([])
  const [questionsError, setQuestionsError] = useState('')

  const [challengeLoading, setChallengeLoading] = useState(false)
  const [challengeText, setChallengeText] = useState('')
  const [challenge, setChallenge] = useState<CodeChallenge | null>(null)
  const [challengeError, setChallengeError] = useState('')

  const [revealedAnswers, setRevealedAnswers] = useState<Set<string>>(new Set())
  const [expandedSteps, setExpandedSteps] = useState(false)

  useEffect(() => {
    const s = getPrepSession()
    // Only restore cached questions/challenge if they belong to THIS vacancy
    if (s?.vacancyId === vacancy.id) {
      setSession(s)
      if (s.generatedQuestions) setQuestions(s.generatedQuestions)
      if (s.codeChallenge) setChallenge(s.codeChallenge)
    }
  }, [vacancy.id])

  // Robust ADK response parser — handles stateDelta (object or string) + content.parts text fallback
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function extractJsonFromEvents(events: any[], stateKey: string, jsonKey: string): Record<string, unknown> | null {
    const agentEvent = [...events].reverse().find((e: { author?: string }) => e.author === stateKey)
    if (!agentEvent) return null

    // 1. stateDelta can be already-parsed object
    const rawData = agentEvent?.actions?.stateDelta?.[stateKey === 'question_generator' ? 'generated_questions' : 'code_challenge']
    if (rawData) {
      if (typeof rawData === 'object' && rawData[jsonKey]) return rawData as Record<string, unknown>
      const str = typeof rawData === 'string' ? rawData : JSON.stringify(rawData)
      try { return JSON.parse(str) } catch { /* fall through */ }
      const m = str.match(/\{[\s\S]*\}/)
      if (m) { try { return JSON.parse(m[0]) } catch { /* fall through */ } }
    }

    // 2. Fallback: content.parts text
    const text: string = agentEvent?.content?.parts?.findLast?.((p: { text?: string }) => p.text)?.text ?? ''
    if (text) {
      try { return JSON.parse(text) } catch { /* fall through */ }
      const m = text.match(/\{[\s\S]*\}/)
      if (m) { try { return JSON.parse(m[0]) } catch { /* fall through */ } }
    }
    return null
  }

  async function generateQuestions() {
    setQuestionsLoading(true)
    setQuestionsText('Connecting to AI…')
    setQuestionsError('')

    const userId = 'user-1'
    const sessionId = `qgen-${vacancy.id}-${Date.now()}`

    try {
      await fetch(`${ADK_BASE}/apps/question_generator/users/${userId}/sessions/${sessionId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}),
      })

      const matchResult = session?.matchResult
      const prompt = `Generate 15 interview questions for vacancy_id: ${vacancy.id}.
Vacancy: ${JSON.stringify({ title: vacancy.title, techStack: vacancy.techStack, requirements: vacancy.requirements, industry: vacancy.industry })}.
${matchResult ? `Skill gaps to probe: ${matchResult.missingSkills.join(', ')}` : ''}
Return JSON with { "questions": [...] } where each has: id, question, difficulty, focusArea, hint, keyPoints.`

      setQuestionsText('Generating questions…')
      const events = await collectSSEEvents(`${ADK_BASE}/run_sse`, {
        appName: 'question_generator', userId, sessionId, newMessage: { parts: [{ text: prompt }], role: 'user' },
      })
      setQuestionsText('Parsing results…')

      const parsed = extractJsonFromEvents(events, 'question_generator', 'questions')
      const qs: GeneratedQuestion[] = (parsed?.questions as GeneratedQuestion[]) ?? []

      if (qs.length === 0) throw new Error('No questions returned — please try again')

      setQuestions(qs)
      const baseSession: PrepSession = session ?? {
        sessionId, resumeId: '', vacancyId: vacancy.id,
        matchResult: { vacancyId: vacancy.id, overallScore: 0, breakdown: { skillsMatch: 0, experienceMatch: 0, techStackMatch: 0 }, matchedSkills: [], missingSkills: [], niceToHaveGaps: [], recommendation: 'good', strengthSummary: '', gapSummary: '' },
        createdAt: new Date().toISOString(),
      }
      const updated: PrepSession = { ...baseSession, generatedQuestions: qs, questionsGeneratedAt: new Date().toISOString() }
      savePrepSession(updated)
      setSession(updated)
    } catch (err) {
      setQuestionsError(err instanceof Error ? err.message : 'Failed to generate questions')
    } finally {
      setQuestionsLoading(false)
      setQuestionsText('')
    }
  }

  async function generateChallenge() {
    setChallengeLoading(true)
    setChallengeText('Connecting to AI…')
    setChallengeError('')

    const userId = 'user-1'
    const sessionId = `challenge-${vacancy.id}-${Date.now()}`

    try {
      await fetch(`${ADK_BASE}/apps/code_challenge/users/${userId}/sessions/${sessionId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}),
      })

      const primaryLang = session ? [
        ...session.matchResult.matchedSkills.filter(s =>
          ['Java', 'Python', 'TypeScript', 'Go', 'Kotlin', 'JavaScript', 'Scala'].includes(s)
        )
      ][0] : vacancy.techStack[0]

      const prompt = `Generate a coding challenge for vacancy_id: ${vacancy.id}.
Vacancy: ${JSON.stringify({ title: vacancy.title, industry: vacancy.industry, techStack: vacancy.techStack })}.
Primary language: ${primaryLang ?? vacancy.techStack[0]}.
Return complete JSON CodeChallenge with: title, description, difficulty, language, estimatedMinutes, starterCode, solution (code, steps[], timeComplexity, spaceComplexity, whyItWorks, commonMistakes[]), testCases[], followUps[], relatedConcepts[].`

      setChallengeText('Generating challenge…')
      const events = await collectSSEEvents(`${ADK_BASE}/run_sse`, {
        appName: 'code_challenge', userId, sessionId, newMessage: { parts: [{ text: prompt }], role: 'user' },
      })
      setChallengeText('Parsing challenge…')

      const parsed = extractJsonFromEvents(events, 'code_challenge', 'title')
      if (!parsed?.title) throw new Error('No challenge returned — please try again')

      const c = parsed as unknown as CodeChallenge
      setChallenge(c)
      const baseSession = session ?? {
        sessionId, resumeId: '', vacancyId: vacancy.id,
        matchResult: { vacancyId: vacancy.id, overallScore: 0, breakdown: { skillsMatch: 0, experienceMatch: 0, techStackMatch: 0 }, matchedSkills: [], missingSkills: [], niceToHaveGaps: [], recommendation: 'good' as const, strengthSummary: '', gapSummary: '' },
        createdAt: new Date().toISOString(),
      }
      const updated = { ...baseSession, codeChallenge: c, challengeGeneratedAt: new Date().toISOString() }
      savePrepSession(updated)
      setSession(updated)
    } catch (err) {
      setChallengeError(err instanceof Error ? err.message : 'Failed to generate challenge')
    } finally {
      setChallengeLoading(false)
      setChallengeText('')
    }
  }

  function toggleReveal(id: string) {
    setRevealedAnswers(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  function goToAssessment() {
    if (session) router.push(`/assessment/${session.sessionId}`)
  }

  const byDifficulty = {
    junior: questions.filter(q => q.difficulty === 'junior'),
    mid: questions.filter(q => q.difficulty === 'mid'),
    senior: questions.filter(q => q.difficulty === 'senior'),
  }

  const DIFF_STYLE = {
    junior: { label: 'Junior', className: 'badge-junior' },
    mid:    { label: 'Mid-Level', className: 'badge-mid' },
    senior: { label: 'Senior', className: 'badge-senior' },
  }

  return (
    <div className="space-y-5">
      {/* Tabs + CTA */}
      <div className="flex flex-wrap items-center gap-2">
        {(['questions', 'challenge'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors whitespace-nowrap"
            style={tab === t
              ? { background: 'var(--accent)', color: 'white' }
              : { background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
            }
          >
            {t === 'questions' ? `📝 Questions ${questions.length ? `(${questions.length})` : ''}` : `💻 Challenge ${challenge ? '✓' : ''}`}
          </button>
        ))}
        {questions.length > 0 && (
          <button
            onClick={goToAssessment}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-white transition-all whitespace-nowrap sm:ml-auto"
            style={{ background: 'var(--accent)' }}
          >
            Start Assessment →
          </button>
        )}
      </div>

      {/* Questions Tab */}
      {tab === 'questions' && (
        <div className="space-y-5">
          {questions.length === 0 ? (
            <div className="text-center py-16 space-y-5">
              <div className="text-6xl">🎯</div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Generate Your Questions</h2>
                <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
                  15 tailored questions based on the {vacancy.title} role and your skill gaps.
                </p>
              </div>
              {questionsError && <p className="text-sm" style={{ color: 'var(--error)' }}>{questionsError}</p>}
              {questionsLoading && questionsText && (
                <div className="max-w-xl mx-auto text-left rounded-xl p-4 text-xs font-mono overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)', maxHeight: '150px', overflow: 'auto' }}>
                  {questionsText.slice(-400)}
                  <span className="streaming-cursor" />
                </div>
              )}
              <button
                onClick={generateQuestions}
                disabled={questionsLoading}
                className="px-8 py-3 rounded-xl text-white font-semibold transition-all disabled:opacity-60"
                style={{ background: 'var(--accent)' }}
              >
                {questionsLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                    Generating...
                  </span>
                ) : 'Generate 15 Questions →'}
              </button>
            </div>
          ) : (
            Object.entries(byDifficulty).map(([diff, qs]) => qs.length > 0 && (
              <div key={diff} className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${DIFF_STYLE[diff as keyof typeof DIFF_STYLE].className}`}>
                    {DIFF_STYLE[diff as keyof typeof DIFF_STYLE].label}
                  </span>
                  <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{qs.length} questions</span>
                </div>
                {qs.map((q, i) => (
                  <div key={q.id} className="rounded-2xl p-5 space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <div className="flex items-start gap-3">
                      <span className="text-sm font-bold mt-0.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>Q{i + 1}</span>
                      <p className="font-medium leading-relaxed" style={{ color: 'var(--text-primary)' }}>{q.question}</p>
                    </div>
                    {q.focusArea && (
                      <p className="text-xs ml-6" style={{ color: 'var(--text-muted)' }}>Focus: {q.focusArea}</p>
                    )}
                    {q.hint && (
                      <div className="ml-6 rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>
                        💡 Hint: {q.hint}
                      </div>
                    )}
                    {revealedAnswers.has(q.id) && q.keyPoints && (
                      <div className="ml-6 rounded-lg p-3 space-y-1" style={{ background: 'rgba(5,150,105,0.06)', border: '1px solid rgba(5,150,105,0.18)' }}>
                        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--success)' }}>Key Points to Cover:</p>
                        {q.keyPoints.map((kp, ki) => (
                          <p key={ki} className="text-sm" style={{ color: 'var(--text-secondary)' }}>• {kp}</p>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => toggleReveal(q.id)}
                      className="ml-6 text-xs transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {revealedAnswers.has(q.id) ? '▲ Hide key points' : '▼ Reveal key points'}
                    </button>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      )}

      {/* Challenge Tab */}
      {tab === 'challenge' && (
        <div className="space-y-5">
          {!challenge ? (
            <div className="text-center py-16 space-y-5">
              <div className="text-6xl">💻</div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Generate Coding Challenge</h2>
                <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
                  A realistic coding task from the {vacancy.industry} industry with a full step-by-step solution.
                </p>
              </div>
              {challengeError && <p className="text-sm" style={{ color: 'var(--error)' }}>{challengeError}</p>}
              {challengeLoading && challengeText && (
                <div className="max-w-xl mx-auto text-left rounded-xl p-4 text-xs font-mono overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)', maxHeight: '150px', overflow: 'auto' }}>
                  {challengeText.slice(-400)}
                  <span className="streaming-cursor" />
                </div>
              )}
              <button
                onClick={generateChallenge}
                disabled={challengeLoading}
                className="px-8 py-3 rounded-xl text-white font-semibold transition-all disabled:opacity-60"
                style={{ background: 'var(--accent)' }}
              >
                {challengeLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                    Generating challenge...
                  </span>
                ) : 'Generate Challenge →'}
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Challenge header */}
              <div className="rounded-2xl p-6 space-y-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{challenge.title}</h2>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full badge-${challenge.difficulty}`}>{challenge.difficulty}</span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>~{challenge.estimatedMinutes} mins</span>
                      <span className="text-xs font-medium" style={{ color: 'var(--accent)' }}>{challenge.language}</span>
                    </div>
                  </div>
                </div>
                <div className="prose prose-invert text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {challenge.description.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                </div>
              </div>

              {/* Starter code */}
              <div className="rounded-2xl p-5 space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Starter Code</h3>
                <pre style={{ background: '#0d1117' }}><code style={{ color: '#e2e8f0' }}>{challenge.starterCode}</code></pre>
              </div>

              {/* Test cases */}
              {challenge.testCases.length > 0 && (
                <div className="rounded-2xl p-5 space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Test Cases</h3>
                  <div className="space-y-2">
                    {challenge.testCases.map((tc, i) => (
                      <div key={i} className="rounded-xl p-3 text-sm" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                        <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                          {tc.description}
                          {tc.isEdgeCase && <span className="ml-2 text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>Edge case</span>}
                        </p>
                        <p style={{ color: 'var(--text-muted)' }}>Input: <code style={{ color: '#94a3b8' }}>{tc.input}</code></p>
                        <p style={{ color: 'var(--text-muted)' }}>Expected: <code style={{ color: 'var(--success)' }}>{tc.expectedOutput}</code></p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Solution (expandable) */}
              <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                <button
                  onClick={() => setExpandedSteps(!expandedSteps)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                  style={{ background: 'var(--bg-card)' }}
                >
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {expandedSteps ? '▲' : '▼'} Step-by-Step Solution
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {challenge.solution.steps.length} steps · {challenge.solution.timeComplexity}
                  </span>
                </button>
                {expandedSteps && (
                  <div className="p-5 space-y-6" style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
                    {challenge.solution.steps.map(step => (
                      <div key={step.stepNumber} className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                            {step.stepNumber}
                          </div>
                          <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{step.title}</h4>
                        </div>
                        <p className="ml-10 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{step.explanation}</p>
                        {step.codeSnippet && (
                          <pre className="ml-10" style={{ background: '#0d1117' }}><code style={{ color: '#e2e8f0' }}>{step.codeSnippet}</code></pre>
                        )}
                      </div>
                    ))}
                    <div className="rounded-xl p-4 space-y-2" style={{ background: 'rgba(5,150,105,0.06)', border: '1px solid rgba(5,150,105,0.18)' }}>
                      <p className="text-sm font-semibold" style={{ color: 'var(--success)' }}>Why It Works</p>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{challenge.solution.whyItWorks}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl p-3" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                        <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Time Complexity</p>
                        <p style={{ color: 'var(--accent)' }}>{challenge.solution.timeComplexity}</p>
                      </div>
                      <div className="rounded-xl p-3" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                        <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Space Complexity</p>
                        <p style={{ color: 'var(--accent)' }}>{challenge.solution.spaceComplexity}</p>
                      </div>
                    </div>
                    {challenge.solution.commonMistakes?.length > 0 && (
                      <div className="space-y-2">
                        <p className="font-semibold text-sm" style={{ color: 'var(--error)' }}>Common Mistakes</p>
                        {challenge.solution.commonMistakes.map((m, i) => (
                          <p key={i} className="text-sm" style={{ color: 'var(--text-secondary)' }}>⚠️ {m}</p>
                        ))}
                      </div>
                    )}
                    {challenge.followUps?.length > 0 && (
                      <div className="space-y-2">
                        <p className="font-semibold text-sm" style={{ color: '#f59e0b' }}>Follow-Up Questions</p>
                        {challenge.followUps.map((fu, i) => (
                          <p key={i} className="text-sm" style={{ color: 'var(--text-secondary)' }}>→ {fu}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
