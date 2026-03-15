'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import dynamic from 'next/dynamic'
import type { Vacancy } from '@/types/vacancy'
import type { GeneratedQuestion, CodeChallenge, PrepSession, SolutionStep, ATSAnalysis } from '@/types/session'
import { getPrepSession, savePrepSession } from '@/lib/session'
import { collectSSEEvents } from '@/lib/adk-client'
import { ADK_BASE, CODING_LANGUAGES } from '@/lib/constants'

const CodeEditor = dynamic(() => import('./CodeEditor'), { ssr: false })

interface Props {
  vacancy: Vacancy
}

type Tab = 'questions' | 'challenge' | 'ats'

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

  const [atsLoading, setAtsLoading] = useState(false)
  const [atsText, setAtsText] = useState('')
  const [atsAnalysis, setAtsAnalysis] = useState<ATSAnalysis | null>(null)
  const [atsError, setAtsError] = useState('')
  const [jdInput, setJdInput] = useState('')

  const [revealedAnswers, setRevealedAnswers] = useState<Set<string>>(new Set())
  const [expandedSteps, setExpandedSteps] = useState(false)

  const [userCode, setUserCode] = useState<string>('')
  const [codeLanguage, setCodeLanguage] = useState<'python' | 'javascript' | 'java'>('python')
  const [runningCode, setRunningCode] = useState(false)
  const [testResults, setTestResults] = useState<{passed: boolean; input: string; expected: string; got: string; error?: string}[]>([])
  const [allPassed, setAllPassed] = useState<boolean | null>(null)

  // Safely coerce any value to an array — guards against the agent returning
  // a string, object, or null instead of a proper JS array.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function toArr(v: any): any[] { return Array.isArray(v) ? v : [] }

  // Safely coerce any value to a string — prevents "Objects are not valid as
  // React children" when the LLM returns a nested object instead of plain text.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function toStr(v: any): string {
    if (v == null) return ''
    if (typeof v === 'string') return v
    if (typeof v === 'object') return JSON.stringify(v)
    return String(v)
  }

  // Normalise a step regardless of whether the agent returned an object or a
  // bare string (e.g. "1. Initialise the DP table…").
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function normalizeStep(step: any, idx: number): SolutionStep {
    if (typeof step === 'string') {
      return { stepNumber: idx + 1, title: '', explanation: step }
    }
    return {
      stepNumber: typeof step?.stepNumber === 'number' ? step.stepNumber : idx + 1,
      title: toStr(step?.title),
      explanation: toStr(step?.explanation),
      codeSnippet: step?.codeSnippet ? toStr(step.codeSnippet) : undefined,
    }
  }

  // Renders markdown text safely — used for any field that may contain
  // markdown syntax like **bold**, bullet lists, or inline code.
  function Md({ children, className }: { children: string; className?: string }) {
    return (
      <div className={className}>
      <ReactMarkdown
        components={{
          p: ({ children: c }) => <p className="mb-1 last:mb-0">{c}</p>,
          ul: ({ children: c }) => <ul className="list-disc ml-4 space-y-0.5">{c}</ul>,
          ol: ({ children: c }) => <ol className="list-decimal ml-4 space-y-0.5">{c}</ol>,
          li: ({ children: c }) => <li>{c}</li>,
          code: ({ children: c }) => <code className="px-1 rounded text-xs" style={{ background: 'rgba(148,163,184,0.12)', color: '#94a3b8' }}>{c}</code>,
          pre: ({ children: c }) => <pre className="rounded-lg p-3 overflow-x-auto text-xs my-2" style={{ background: '#0d1117', color: '#e2e8f0' }}>{c}</pre>,
          strong: ({ children: c }) => <strong style={{ color: 'var(--text-primary)' }}>{c}</strong>,
          em: ({ children: c }) => <em style={{ color: 'var(--text-secondary)' }}>{c}</em>,
          h1: ({ children: c }) => <h1 className="text-base font-bold mt-2 mb-1" style={{ color: 'var(--text-primary)' }}>{c}</h1>,
          h2: ({ children: c }) => <h2 className="text-sm font-bold mt-2 mb-1" style={{ color: 'var(--text-primary)' }}>{c}</h2>,
          h3: ({ children: c }) => <h3 className="text-sm font-semibold mt-1 mb-0.5" style={{ color: 'var(--text-primary)' }}>{c}</h3>,
        }}
      >
        {children}
      </ReactMarkdown>
      </div>
    )
  }

  useEffect(() => {
    const s = getPrepSession()
    // Only restore cached questions/challenge if they belong to THIS vacancy
    if (s?.vacancyId === vacancy.id) {
      setSession(s)
      if (s.generatedQuestions) setQuestions(s.generatedQuestions)
      if (s.codeChallenge) setChallenge(s.codeChallenge)
      if (s.atsAnalysis) setAtsAnalysis(s.atsAnalysis)
    }
    // Pre-fill JD textarea with vacancy description if available
    if (vacancy.description) {
      const jd = [
        vacancy.description,
        vacancy.requirements?.mustHave?.length ? `\n\nRequired: ${vacancy.requirements.mustHave.join(', ')}` : '',
        vacancy.techStack?.length ? `\nTech Stack: ${vacancy.techStack.join(', ')}` : '',
      ].join('')
      setJdInput(jd)
    }

    // Warmup ping — silently wake the Cloud Run container so the first real
    // request doesn't hit a cold-start timeout. Fire-and-forget, no UI effect.
    fetch(`${ADK_BASE}/apps/question_generator/users/warmup/sessions/warmup-ping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }).catch(() => { /* ignore — warmup is best-effort */ })
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

  // Helper: create an ADK session, with one retry if the agent is cold-starting.
  async function createADKSession(appName: string, userId: string, sessionId: string): Promise<void> {
    const url = `${ADK_BASE}/apps/${appName}/users/${userId}/sessions/${sessionId}`
    const opts = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) }
    const res = await fetch(url, opts)
    if (!res.ok) {
      // Cold-start 503 — wait 4 s and try once more before giving up
      await new Promise(r => setTimeout(r, 4000))
      const retry = await fetch(url, opts)
      if (!retry.ok) throw new Error(`Agent unavailable (${retry.status}) — please try again`)
    }
  }

  async function generateQuestions() {
    setQuestionsLoading(true)
    setQuestionsText('Connecting to AI…')
    setQuestionsError('')

    const userId = 'user-1'

    // Two attempts: handles cold-start on first visit
    for (let attempt = 0; attempt < 2; attempt++) {
      const sessionId = `qgen-${crypto.randomUUID()}`
      try {
        if (attempt > 0) {
          setQuestionsText('Agent warming up — retrying…')
          await new Promise(r => setTimeout(r, 4000))
        }

        await createADKSession('question_generator', userId, sessionId)

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

        if (qs.length === 0) throw new Error('No questions returned')

        setQuestions(qs)
        const baseSession: PrepSession = session ?? {
          sessionId, resumeId: '', vacancyId: vacancy.id,
          matchResult: { vacancyId: vacancy.id, overallScore: 0, breakdown: { skillsMatch: 0, experienceMatch: 0, techStackMatch: 0 }, matchedSkills: [], missingSkills: [], niceToHaveGaps: [], recommendation: 'good', strengthSummary: '', gapSummary: '' },
          createdAt: new Date().toISOString(),
        }
        const updated: PrepSession = { ...baseSession, generatedQuestions: qs, questionsGeneratedAt: new Date().toISOString() }
        savePrepSession(updated)
        setSession(updated)
        break // success — exit retry loop

      } catch (err) {
        if (attempt < 1) continue // retry once
        setQuestionsError(err instanceof Error ? err.message : 'Failed to generate questions — please try again')
      }
    }

    setQuestionsLoading(false)
    setQuestionsText('')
  }

  async function generateChallenge() {
    setChallengeLoading(true)
    setChallengeText('Connecting to AI…')
    setChallengeError('')

    const userId = 'user-1'

    // Two attempts: handles cold-start on first visit
    for (let attempt = 0; attempt < 2; attempt++) {
      const sessionId = `challenge-${crypto.randomUUID()}`
      try {
        if (attempt > 0) {
          setChallengeText('Agent warming up — retrying…')
          await new Promise(r => setTimeout(r, 4000))
        }

        await createADKSession('code_challenge', userId, sessionId)

        const primaryLang = session ? [
          ...session.matchResult.matchedSkills.filter(s => CODING_LANGUAGES.includes(s))
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
        if (!parsed?.title) throw new Error('No challenge returned')

        const c = parsed as unknown as CodeChallenge
        setChallenge(c)
        setUserCode(c.starterCode ?? '')
        const baseSession = session ?? {
          sessionId, resumeId: '', vacancyId: vacancy.id,
          matchResult: { vacancyId: vacancy.id, overallScore: 0, breakdown: { skillsMatch: 0, experienceMatch: 0, techStackMatch: 0 }, matchedSkills: [], missingSkills: [], niceToHaveGaps: [], recommendation: 'good' as const, strengthSummary: '', gapSummary: '' },
          createdAt: new Date().toISOString(),
        }
        const updated = { ...baseSession, codeChallenge: c, challengeGeneratedAt: new Date().toISOString() }
        savePrepSession(updated)
        setSession(updated)
        break // success — exit retry loop

      } catch (err) {
        if (attempt < 1) continue // retry once
        setChallengeError(err instanceof Error ? err.message : 'Failed to generate challenge — please try again')
      }
    }

    setChallengeLoading(false)
    setChallengeText('')
  }

  async function runAtsCheck() {
    if (!jdInput.trim()) return
    setAtsLoading(true)
    setAtsText('Connecting to ATS analyser…')
    setAtsError('')

    const userId = 'user-1'

    for (let attempt = 0; attempt < 2; attempt++) {
      const sessionId = `ats-${crypto.randomUUID()}`
      try {
        if (attempt > 0) {
          setAtsText('Agent warming up — retrying…')
          await new Promise(r => setTimeout(r, 4000))
        }

        await createADKSession('ats_analyzer', userId, sessionId)

        // Get resume from localStorage (custom or session)
        let resume: unknown = null
        try {
          const raw = localStorage.getItem('tni_custom_resume')
          if (raw) resume = JSON.parse(raw)
        } catch { /* use null */ }

        const prompt = resume
          ? `Resume:\n${JSON.stringify(resume, null, 2)}\n\nJob Description:\n${jdInput}`
          : `Resume (from match):\n${JSON.stringify({ role: vacancy.title, techStack: vacancy.techStack }, null, 2)}\n\nJob Description:\n${jdInput}`

        setAtsText('Analysing keyword match…')
        const events = await collectSSEEvents(`${ADK_BASE}/run_sse`, {
          appName: 'ats_analyzer', userId, sessionId,
          newMessage: { parts: [{ text: prompt }], role: 'user' },
        })
        setAtsText('Parsing results…')

        // Extract ats_analysis from stateDelta (triple-fallback pattern)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let parsed: any = null
        for (let i = events.length - 1; i >= 0; i--) {
          const e = events[i]
          const delta = e?.actions?.stateDelta?.['ats_analysis']
          if (delta) {
            if (typeof delta === 'object') { parsed = delta; break }
            try { parsed = JSON.parse(delta); break } catch { /* try next */ }
          }
          const text = e?.content?.parts?.findLast?.((p: { text?: string }) => p.text)?.text
          if (text) {
            try { parsed = JSON.parse(text); break } catch { /* try next */ }
            const m = text.match(/\{[\s\S]*\}/)
            if (m) { try { parsed = JSON.parse(m[0]); break } catch { /* try next */ } }
          }
        }

        if (!parsed?.atsScore) throw new Error('No ATS analysis returned')

        const analysis = parsed as ATSAnalysis
        setAtsAnalysis(analysis)
        const baseSession: PrepSession = session ?? {
          sessionId, resumeId: '', vacancyId: vacancy.id,
          matchResult: { vacancyId: vacancy.id, overallScore: 0, breakdown: { skillsMatch: 0, experienceMatch: 0, techStackMatch: 0 }, matchedSkills: [], missingSkills: [], niceToHaveGaps: [], recommendation: 'good', strengthSummary: '', gapSummary: '' },
          createdAt: new Date().toISOString(),
        }
        const updated: PrepSession = { ...baseSession, atsAnalysis: analysis, atsAnalysedAt: new Date().toISOString() }
        savePrepSession(updated)
        setSession(updated)
        break

      } catch (err) {
        if (attempt < 1) continue
        setAtsError(err instanceof Error ? err.message : 'ATS analysis failed — please try again')
      }
    }

    setAtsLoading(false)
    setAtsText('')
  }

  function toggleReveal(id: string) {
    setRevealedAnswers(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  const LANGUAGE_IDS: Record<string, number> = { python: 71, javascript: 63, java: 62 }

  async function runCode() {
    if (!challenge || !userCode.trim()) return
    setRunningCode(true)
    setTestResults([])
    setAllPassed(null)

    const results: typeof testResults = []
    const testCases = toArr(challenge.testCases).slice(0, 3)

    for (const tc of testCases) {
      try {
        const res = await fetch('/api/run-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: userCode,
            language_id: LANGUAGE_IDS[codeLanguage],
            stdin: tc.input,
          }),
        })
        const data = await res.json()

        // Surface setup errors clearly
        if (!res.ok) {
          const msg = data.error ?? `HTTP ${res.status}`
          results.push({ passed: false, input: tc.input, expected: tc.expectedOutput, got: '', error: `Code execution error: ${msg}` })
          break
        }

        const stdout = (data.stdout ?? '').trim()
        const expected = tc.expectedOutput.trim()
        const passed = stdout === expected
        results.push({
          passed,
          input: tc.input,
          expected,
          got: stdout || data.stderr || data.compile_output || 'No output',
          error: data.status?.id > 3 ? (data.stderr || data.compile_output || data.status?.description) : undefined,
        })
      } catch {
        results.push({ passed: false, input: tc.input, expected: tc.expectedOutput, got: '', error: 'Network error — check your connection' })
        break
      }
    }

    setTestResults(results)
    setAllPassed(results.length > 0 && results.every(r => r.passed))
    setRunningCode(false)
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
        <button
          onClick={() => setTab('questions')}
          className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors whitespace-nowrap"
          style={tab === 'questions'
            ? { background: 'var(--accent)', color: 'white' }
            : { background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
          }
        >
          📝 Questions {questions.length ? `(${questions.length})` : ''}
        </button>
        <button
          onClick={() => setTab('challenge')}
          className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors whitespace-nowrap"
          style={tab === 'challenge'
            ? { background: 'var(--accent)', color: 'white' }
            : { background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
          }
        >
          💻 Challenge {challenge ? '✓' : ''}
        </button>
        <button
          onClick={() => setTab('ats')}
          className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors whitespace-nowrap"
          style={tab === 'ats'
            ? { background: 'var(--accent)', color: 'white' }
            : { background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
          }
        >
          🎯 ATS Check {atsAnalysis ? `(${atsAnalysis.atsScore}%)` : ''}
        </button>
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
                      <div className="font-medium leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                        <Md>{toStr(q.question)}</Md>
                      </div>
                    </div>
                    {q.focusArea && (
                      <p className="text-xs ml-6" style={{ color: 'var(--text-muted)' }}>Focus: {toStr(q.focusArea)}</p>
                    )}
                    {q.hint && (
                      <div className="ml-6 rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>
                        <span className="font-semibold">💡 Hint: </span>
                        <Md>{toStr(q.hint)}</Md>
                      </div>
                    )}
                    {revealedAnswers.has(q.id) && q.keyPoints && (
                      <div className="ml-6 rounded-lg p-3 space-y-1" style={{ background: 'rgba(5,150,105,0.06)', border: '1px solid rgba(5,150,105,0.18)' }}>
                        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--success)' }}>Key Points to Cover:</p>
                        {q.keyPoints.map((kp, ki) => (
                          <div key={ki} className="text-sm flex gap-2" style={{ color: 'var(--text-secondary)' }}>
                            <span>•</span>
                            <Md>{toStr(kp)}</Md>
                          </div>
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

      {/* ATS Check Tab */}
      {tab === 'ats' && (
        <div className="space-y-5">
          {/* Job Description input */}
          <div className="rounded-2xl p-5 space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Job Description</h3>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Pre-filled from this vacancy</span>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Paste any job posting to check how well your resume would pass ATS screening — or use the pre-filled vacancy description below.
            </p>
            <textarea
              value={jdInput}
              onChange={e => setJdInput(e.target.value)}
              rows={7}
              placeholder="Paste the full job description here…"
              className="w-full rounded-xl px-4 py-3 text-sm resize-y font-mono"
              style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none', minHeight: '140px' }}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{jdInput.length.toLocaleString()} characters</span>
              <button
                onClick={runAtsCheck}
                disabled={atsLoading || !jdInput.trim()}
                className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-60"
                style={{ background: 'var(--accent)' }}
              >
                {atsLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                    Analysing…
                  </span>
                ) : '🎯 Run ATS Check →'}
              </button>
            </div>
            {atsLoading && atsText && (
              <div className="rounded-xl p-3 text-xs font-mono" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                {atsText}<span className="streaming-cursor" />
              </div>
            )}
            {atsError && <p className="text-sm" style={{ color: 'var(--error)' }}>{atsError}</p>}
          </div>

          {/* ATS Results */}
          {atsAnalysis && (
            <div className="space-y-4">
              {/* Score header */}
              <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-6">
                  {/* Score ring */}
                  <div className="relative flex-shrink-0 w-24 h-24">
                    <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--border)" strokeWidth="3" />
                      <circle
                        cx="18" cy="18" r="15.9" fill="none"
                        stroke={atsAnalysis.atsScore >= 85 ? 'var(--success)' : atsAnalysis.atsScore >= 70 ? 'var(--accent)' : atsAnalysis.atsScore >= 50 ? '#f59e0b' : 'var(--error)'}
                        strokeWidth="3"
                        strokeDasharray={`${atsAnalysis.atsScore} ${100 - atsAnalysis.atsScore}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{atsAnalysis.atsScore}</span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>/ 100</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        atsAnalysis.verdict === 'excellent' ? 'badge-senior' :
                        atsAnalysis.verdict === 'good' ? 'badge-mid' :
                        atsAnalysis.verdict === 'needs_work' ? 'badge-junior' : 'badge-junior'
                      }`}>
                        {atsAnalysis.verdict === 'excellent' ? '✅ Excellent' :
                         atsAnalysis.verdict === 'good' ? '👍 Good Match' :
                         atsAnalysis.verdict === 'needs_work' ? '⚠️ Needs Work' : '❌ Poor Match'}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{atsAnalysis.verdictSummary}</p>
                  </div>
                </div>
              </div>

              {/* Keywords grid */}
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Found */}
                <div className="rounded-2xl p-5 space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <h4 className="font-semibold text-sm" style={{ color: 'var(--success)' }}>✅ Keywords Found ({atsAnalysis.keywordsFound.length})</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {atsAnalysis.keywordsFound.map((kw, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{ background: 'rgba(5,150,105,0.1)', color: 'var(--success)', border: '1px solid rgba(5,150,105,0.2)' }}>
                        {kw}
                      </span>
                    ))}
                    {atsAnalysis.keywordsFound.length === 0 && (
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>None detected</p>
                    )}
                  </div>
                </div>

                {/* Missing */}
                <div className="rounded-2xl p-5 space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <h4 className="font-semibold text-sm" style={{ color: 'var(--error)' }}>❌ Missing Keywords ({atsAnalysis.keywordsMissing.length})</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {atsAnalysis.keywordsMissing.map((kw, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--error)', border: '1px solid rgba(239,68,68,0.2)' }}>
                        {kw}
                      </span>
                    ))}
                    {atsAnalysis.keywordsMissing.length === 0 && (
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Nothing critical missing!</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Skills to add */}
              {atsAnalysis.skillsToAdd.length > 0 && (
                <div className="rounded-2xl p-5 space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <h4 className="font-semibold text-sm" style={{ color: '#f59e0b' }}>🛠 Skills to Add to Your Resume</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {atsAnalysis.skillsToAdd.map((s, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>
                        + {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Phrases + Formatting tips */}
              <div className="grid sm:grid-cols-2 gap-4">
                {atsAnalysis.phrasesToUse.length > 0 && (
                  <div className="rounded-2xl p-5 space-y-2" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <h4 className="font-semibold text-sm" style={{ color: 'var(--accent)' }}>💬 Exact Phrases to Use</h4>
                    {atsAnalysis.phrasesToUse.map((p, i) => (
                      <p key={i} className="text-sm flex gap-2" style={{ color: 'var(--text-secondary)' }}>
                        <span style={{ color: 'var(--accent)' }}>→</span> <em>&ldquo;{p}&rdquo;</em>
                      </p>
                    ))}
                  </div>
                )}
                {atsAnalysis.formattingTips.length > 0 && (
                  <div className="rounded-2xl p-5 space-y-2" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <h4 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>📄 Formatting Tips</h4>
                    {atsAnalysis.formattingTips.map((t, i) => (
                      <p key={i} className="text-sm flex gap-2" style={{ color: 'var(--text-secondary)' }}>
                        <span>•</span> {t}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* Tailored summary */}
              {atsAnalysis.tailoredSummary && (
                <div className="rounded-2xl p-5 space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <h4 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>✍️ ATS-Optimised Professional Summary</h4>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{atsAnalysis.tailoredSummary}</p>
                  <button
                    onClick={() => navigator.clipboard.writeText(atsAnalysis.tailoredSummary)}
                    className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                    style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}
                  >
                    Copy to clipboard
                  </button>
                </div>
              )}

              {/* Re-run button */}
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => setAtsAnalysis(null)}
                  className="text-xs px-4 py-2 rounded-xl transition-colors"
                  style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                >
                  ↩ Run again with different JD
                </button>
              </div>
            </div>
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
            <div style={{ display: 'flex', gap: 16, height: 600, flexWrap: 'wrap' }}>
              {/* LEFT PANE — problem description */}
              <div style={{ width: 'clamp(280px, 45%, 100%)', flex: '1 1 280px', overflow: 'auto', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Title + meta */}
                <div>
                  <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{challenge.title}</h2>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full badge-${challenge.difficulty}`}>{challenge.difficulty}</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>~{challenge.estimatedMinutes} mins</span>
                    <span className="text-xs font-medium" style={{ color: 'var(--accent)' }}>{challenge.language}</span>
                  </div>
                </div>

                {/* Description */}
                <div className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  <Md>{toStr(challenge.description)}</Md>
                </div>

                {/* Test Cases */}
                {toArr(challenge.testCases).length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Test Cases</h3>
                    {toArr(challenge.testCases).map((tc, i) => (
                      <div key={i} className="rounded-xl p-3 text-xs" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                        {tc.description && (
                          <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                            {tc.description}
                            {tc.isEdgeCase && <span className="ml-2 px-1.5 py-0.5 rounded" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>Edge case</span>}
                          </p>
                        )}
                        <p style={{ color: 'var(--text-muted)' }}>Input: <code style={{ color: '#94a3b8' }}>{tc.input}</code></p>
                        <p style={{ color: 'var(--text-muted)' }}>Expected: <code style={{ color: 'var(--success)' }}>{tc.expectedOutput}</code></p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Solution accordion */}
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                  <button
                    onClick={() => setExpandedSteps(!expandedSteps)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left"
                    style={{ background: 'var(--bg-base)' }}
                  >
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {expandedSteps ? '▲' : '▼'} View Solution
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {toArr(challenge.solution?.steps).length} steps · {challenge.solution?.timeComplexity}
                    </span>
                  </button>
                  {expandedSteps && (
                    <div className="p-4 space-y-5" style={{ borderTop: '1px solid var(--border)' }}>
                      {toArr(challenge.solution?.steps).map((rawStep, idx) => {
                        const step = normalizeStep(rawStep, idx)
                        return (
                          <div key={step.stepNumber} className="space-y-1">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                                {step.stepNumber}
                              </div>
                              {step.title && (
                                <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{step.title}</h4>
                              )}
                            </div>
                            {step.explanation && (
                              <div className="ml-8 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                <Md>{step.explanation}</Md>
                              </div>
                            )}
                            {step.codeSnippet && (
                              <pre className="ml-8 rounded-lg p-2 overflow-x-auto text-xs" style={{ background: '#0d1117' }}>
                                <code style={{ color: '#e2e8f0' }}>{step.codeSnippet}</code>
                              </pre>
                            )}
                          </div>
                        )
                      })}
                      <div className="rounded-xl p-3 space-y-1" style={{ background: 'rgba(5,150,105,0.06)', border: '1px solid rgba(5,150,105,0.18)' }}>
                        <p className="text-xs font-semibold" style={{ color: 'var(--success)' }}>Why It Works</p>
                        <div className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                          <Md>{toStr(challenge.solution?.whyItWorks)}</Md>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-xl p-2" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                          <p className="font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>Time</p>
                          <p style={{ color: 'var(--accent)' }}>{challenge.solution?.timeComplexity}</p>
                        </div>
                        <div className="rounded-xl p-2" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                          <p className="font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>Space</p>
                          <p style={{ color: 'var(--accent)' }}>{challenge.solution?.spaceComplexity}</p>
                        </div>
                      </div>
                      {toArr(challenge.solution?.commonMistakes).length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold" style={{ color: 'var(--error)' }}>Common Mistakes</p>
                          {toArr(challenge.solution?.commonMistakes).map((m, i) => (
                            <div key={i} className="text-xs flex gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                              <span>⚠️</span>
                              <Md>{toStr(m)}</Md>
                            </div>
                          ))}
                        </div>
                      )}
                      {toArr(challenge.followUps).length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold" style={{ color: '#f59e0b' }}>Follow-Up Questions</p>
                          {toArr(challenge.followUps).map((fu, i) => (
                            <p key={i} className="text-xs" style={{ color: 'var(--text-secondary)' }}>→ {fu}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT PANE — editor + results */}
              <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
                {/* Top bar: language selector + Run button */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <select
                    value={codeLanguage}
                    onChange={e => setCodeLanguage(e.target.value as 'python' | 'javascript' | 'java')}
                    className="rounded-lg px-3 py-1.5 text-sm font-medium"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }}
                  >
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript</option>
                    <option value="java">Java</option>
                  </select>
                  <button
                    onClick={runCode}
                    disabled={runningCode}
                    className="px-4 py-1.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-60"
                    style={{ background: 'var(--accent)' }}
                  >
                    {runningCode ? '⏳ Running...' : '▶ Run Code'}
                  </button>
                </div>

                {/* Monaco editor */}
                <div style={{ flex: 1, minHeight: 0 }}>
                  <CodeEditor
                    value={userCode}
                    onChange={setUserCode}
                    language={codeLanguage}
                    height="100%"
                  />
                </div>

                {/* Test results */}
                {testResults.length > 0 && (
                  <div className="rounded-xl p-3 space-y-2" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', maxHeight: 200, overflow: 'auto' }}>
                    {allPassed && (
                      <p className="text-sm font-semibold" style={{ color: 'var(--success)' }}>All tests passed!</p>
                    )}
                    {testResults.map((r, i) => (
                      <div
                        key={i}
                        className="rounded-lg p-2 text-xs space-y-0.5"
                        style={{
                          background: r.passed ? 'rgba(5,150,105,0.08)' : 'rgba(239,68,68,0.08)',
                          border: `1px solid ${r.passed ? 'rgba(5,150,105,0.2)' : 'rgba(239,68,68,0.2)'}`,
                        }}
                      >
                        <p className="font-semibold" style={{ color: r.passed ? 'var(--success)' : 'var(--error)' }}>
                          {r.passed ? '✅' : '❌'} Test {i + 1}
                        </p>
                        <p style={{ color: 'var(--text-muted)' }}>Input: <code style={{ color: '#94a3b8' }}>{r.input.length > 40 ? r.input.slice(0, 40) + '…' : r.input}</code></p>
                        <p style={{ color: 'var(--text-muted)' }}>Expected: <code style={{ color: 'var(--success)' }}>{r.expected}</code></p>
                        {!r.passed && <p style={{ color: 'var(--text-muted)' }}>Got: <code style={{ color: 'var(--error)' }}>{r.got.length > 60 ? r.got.slice(0, 60) + '…' : r.got}</code></p>}
                        {r.error && <p style={{ color: 'var(--error)' }}>{r.error.length > 80 ? r.error.slice(0, 80) + '…' : r.error}</p>}
                      </div>
                    ))}
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
