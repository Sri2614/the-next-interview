'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { PROBLEMS } from '@/data/problems'

const CodeEditor = dynamic(() => import('@/components/CodeEditor'), { ssr: false })

type Lang = 'python' | 'javascript' | 'java'
const LANGUAGE_IDS: Record<Lang, number> = { python: 71, javascript: 63, java: 62 }

interface TestResult {
  passed: boolean
  input: string
  expected: string
  got: string
  error?: string
  time?: string
}

const DIFF_CONFIG = {
  easy:   { label: 'Easy',   color: '#34d399', bg: 'rgba(52,211,153,0.10)',  border: 'rgba(52,211,153,0.25)'  },
  medium: { label: 'Medium', color: '#fbbf24', bg: 'rgba(251,191,36,0.10)',  border: 'rgba(251,191,36,0.25)'  },
  hard:   { label: 'Hard',   color: '#f87171', bg: 'rgba(248,113,113,0.10)', border: 'rgba(248,113,113,0.25)' },
  expert: { label: 'Expert', color: '#a78bfa', bg: 'rgba(167,139,250,0.10)', border: 'rgba(167,139,250,0.25)' },
}

function markProblemProgress(id: string, status: 'solved' | 'attempted') {
  try {
    const raw = localStorage.getItem('tni_practice_progress')
    const progress = raw ? JSON.parse(raw) : {}
    // Don't downgrade from solved to attempted
    if (progress[id] === 'solved' && status === 'attempted') return
    progress[id] = status
    localStorage.setItem('tni_practice_progress', JSON.stringify(progress))
  } catch {}
}

export default function ProblemPage() {
  const params = useParams()
  const problem = PROBLEMS.find(p => p.id === params.problemId)

  const [lang, setLang] = useState<Lang>('python')
  const [code, setCode] = useState('')
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<TestResult[]>([])
  const [allPassed, setAllPassed] = useState<boolean | null>(null)
  const [showHints, setShowHints] = useState(false)
  const [hintIndex, setHintIndex] = useState(0)
  const [showSolution, setShowSolution] = useState(false)
  const [activeTab, setActiveTab] = useState<'description' | 'solution'>('description')

  // Seed code from starter code
  useEffect(() => {
    if (!problem) return
    const sc = problem.starterCode as Record<string, string>
    setCode(sc[lang] ?? problem.starterCode.python)
  }, [problem, lang])

  // Mark as attempted when user starts typing
  useEffect(() => {
    if (!problem || !code) return
    const sc = problem.starterCode as Record<string, string>
    if (code !== (sc[lang] ?? problem.starterCode.python)) {
      markProblemProgress(problem.id, 'attempted')
    }
  }, [code, problem, lang])

  async function runCode() {
    if (!code.trim()) return
    setRunning(true)
    setResults([])
    setAllPassed(null)

    const testCases = problem!.testCases.filter(tc => !tc.isHidden).slice(0, 4)
    const newResults: TestResult[] = []

    for (const tc of testCases) {
      try {
        const res = await fetch('/api/run-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, language_id: LANGUAGE_IDS[lang], stdin: tc.input }),
        })
        const data = await res.json()
        const stdout = (data.stdout ?? '').trim()
        const expected = tc.expected.trim()
        const passed = stdout === expected
        newResults.push({
          passed,
          input: tc.input,
          expected,
          got: stdout || data.stderr || data.compile_output || '(no output)',
          error: data.status?.id > 3 ? (data.stderr || data.compile_output || data.status?.description) : undefined,
          time: data.time ? `${(parseFloat(data.time) * 1000).toFixed(0)}ms` : undefined,
        })
      } catch {
        newResults.push({ passed: false, input: tc.input, expected: tc.expected, got: 'Network error' })
      }
    }

    setResults(newResults)
    const passed = newResults.every(r => r.passed)
    setAllPassed(passed)
    if (passed) markProblemProgress(problem!.id, 'solved')
    setRunning(false)
  }

  // Keyboard shortcut: Ctrl+Enter to run
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        runCode()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, lang])

  if (!problem) {
    return (
      <div className="text-center py-24">
        <p className="text-4xl mb-4">🤔</p>
        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Problem not found</h2>
        <Link href="/practice" className="text-sm underline" style={{ color: 'var(--accent)' }}>← Back to Practice</Link>
      </div>
    )
  }

  const cfg = DIFF_CONFIG[problem.difficulty]
  const problemIdx = PROBLEMS.indexOf(problem)
  const prevProblem = PROBLEMS[problemIdx - 1]
  const nextProblem = PROBLEMS[problemIdx + 1]

  return (
    <div className="flex flex-col gap-0" style={{ height: 'calc(100vh - 120px)', minHeight: 600 }}>
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 py-2 flex-shrink-0"
        style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', borderRadius: '12px 12px 0 0' }}
      >
        <div className="flex items-center gap-3">
          <Link href="/practice" className="text-sm hover:opacity-70 transition-opacity" style={{ color: 'var(--text-muted)' }}>
            ← Problems
          </Link>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{problem.title}</span>
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
          >
            {cfg.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {prevProblem && (
            <Link href={`/practice/${prevProblem.id}`}
              className="px-3 py-1.5 rounded-lg text-xs transition-colors hover:opacity-80"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
            >
              ← Prev
            </Link>
          )}
          {nextProblem && (
            <Link href={`/practice/${nextProblem.id}`}
              className="px-3 py-1.5 rounded-lg text-xs transition-colors hover:opacity-80"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
            >
              Next →
            </Link>
          )}
        </div>
      </div>

      {/* Main split pane */}
      <div className="flex flex-1 overflow-hidden" style={{ gap: 1, background: 'var(--border)' }}>

        {/* LEFT: Problem description */}
        <div
          className="overflow-y-auto p-5 space-y-5"
          style={{ width: '45%', background: 'var(--bg-base)', flexShrink: 0 }}
        >
          {/* Tabs */}
          <div className="flex gap-2">
            {(['description', 'solution'] as const).map(t => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize"
                style={{
                  background: activeTab === t ? 'var(--accent)' : 'var(--bg-card)',
                  color: activeTab === t ? 'white' : 'var(--text-secondary)',
                  border: activeTab === t ? 'none' : '1px solid var(--border)',
                }}
              >
                {t === 'description' ? '📝 Description' : '💡 Solution'}
              </button>
            ))}
          </div>

          {activeTab === 'description' && (
            <>
              {/* Title + meta */}
              <div>
                <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{problem.title}</h1>
                <div className="flex flex-wrap gap-2">
                  {problem.tags.map(tag => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 rounded"
                      style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Description */}
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--text-secondary)' }}>
                {problem.description}
              </p>

              {/* Examples */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Examples</h3>
                {problem.examples.map((ex, i) => (
                  <div key={i} className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                    <div className="px-3 py-1.5" style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
                      <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Example {i + 1}</span>
                    </div>
                    <div className="p-3 space-y-1 text-sm font-mono" style={{ background: 'var(--code-bg)' }}>
                      <p><span style={{ color: 'var(--text-muted)' }}>Input:</span> <span style={{ color: 'var(--text-primary)' }}>{ex.input}</span></p>
                      <p><span style={{ color: 'var(--text-muted)' }}>Output:</span> <span style={{ color: '#34d399' }}>{ex.output}</span></p>
                      {ex.explanation && (
                        <p className="text-xs pt-1" style={{ color: 'var(--text-muted)', fontFamily: 'inherit' }}>
                          {ex.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Constraints */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Constraints</h3>
                <ul className="space-y-1">
                  {problem.constraints.map((c, i) => (
                    <li key={i} className="text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>• {c}</li>
                  ))}
                </ul>
              </div>

              {/* Hints */}
              {problem.hints.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowHints(!showHints)}
                    className="text-sm font-medium transition-opacity hover:opacity-80"
                    style={{ color: 'var(--accent)' }}
                  >
                    💡 {showHints ? 'Hide' : 'Show'} Hints ({problem.hints.length})
                  </button>
                  {showHints && (
                    <div className="mt-3 space-y-2">
                      {problem.hints.slice(0, hintIndex + 1).map((h, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-xl text-sm"
                          style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', color: 'var(--text-secondary)' }}
                        >
                          <span className="font-semibold" style={{ color: '#fbbf24' }}>Hint {i + 1}: </span>
                          {h}
                        </div>
                      ))}
                      {hintIndex < problem.hints.length - 1 && (
                        <button
                          onClick={() => setHintIndex(hintIndex + 1)}
                          className="text-xs font-medium transition-opacity hover:opacity-70"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          Show next hint →
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {activeTab === 'solution' && (
            <div className="space-y-4">
              <div
                className="p-4 rounded-xl text-sm"
                style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24' }}
              >
                ⚠️ Try to solve it yourself first! Solutions are here for reference only.
              </div>
              {!showSolution ? (
                <button
                  onClick={() => setShowSolution(true)}
                  className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-80"
                  style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                >
                  Reveal Solution
                </button>
              ) : (
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Python Solution</h3>
                  <pre
                    className="p-4 rounded-xl text-sm overflow-x-auto"
                    style={{ background: '#0d1117', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    {`# Optimal solution — try to understand each step\n${problem.starterCode.python.replace('pass\n', '# Your implementation would go here')}`}
                  </pre>
                  <div
                    className="p-4 rounded-xl text-sm"
                    style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', color: 'var(--text-secondary)' }}
                  >
                    <p className="font-semibold mb-1" style={{ color: '#34d399' }}>Key Insight</p>
                    <p>{problem.hints[problem.hints.length - 1]}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: Code editor + results */}
        <div
          className="flex flex-col flex-1 overflow-hidden"
          style={{ background: 'var(--bg-base)' }}
        >
          {/* Editor toolbar */}
          <div
            className="flex items-center gap-3 px-4 py-2.5 flex-shrink-0"
            style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}
          >
            <select
              value={lang}
              onChange={e => setLang(e.target.value as Lang)}
              className="px-3 py-1.5 rounded-lg text-sm outline-none"
              style={{
                background: 'var(--bg-elevated)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
              }}
            >
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="java">Java</option>
            </select>

            <div className="flex-1" />

            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>⌘+Enter to run</span>

            <button
              onClick={runCode}
              disabled={running || !code.trim()}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: 'var(--accent)', color: 'white' }}
            >
              {running ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-t-transparent animate-spin border-white" />
                  Running…
                </>
              ) : (
                <>▶ Run Code</>
              )}
            </button>
          </div>

          {/* Monaco editor */}
          <div className="flex-1 overflow-hidden" style={{ minHeight: 200 }}>
            <CodeEditor
              value={code}
              onChange={setCode}
              language={lang}
              height="100%"
            />
          </div>

          {/* Test Results */}
          {results.length > 0 && (
            <div
              className="flex-shrink-0 overflow-y-auto"
              style={{ maxHeight: 260, borderTop: '1px solid var(--border)', background: 'var(--bg-card)' }}
            >
              {/* Summary bar */}
              <div
                className="sticky top-0 flex items-center justify-between px-4 py-2"
                style={{
                  background: allPassed ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <span className="text-sm font-semibold" style={{ color: allPassed ? '#34d399' : '#f87171' }}>
                  {allPassed ? '✅ All test cases passed!' : `❌ ${results.filter(r => !r.passed).length} test case(s) failed`}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {results.filter(r => r.passed).length}/{results.length} passed
                </span>
              </div>

              {results.map((r, i) => (
                <div
                  key={i}
                  className="px-4 py-3 border-b last:border-b-0"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm">{r.passed ? '✅' : '❌'}</span>
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Test Case {i + 1}
                    </span>
                    {r.time && (
                      <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>{r.time}</span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Input: </span>
                      <span style={{ color: 'var(--text-secondary)' }}>{r.input.replace(/\n/g, ', ').slice(0, 40)}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Expected: </span>
                      <span style={{ color: '#34d399' }}>{r.expected}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Got: </span>
                      <span style={{ color: r.passed ? '#34d399' : '#f87171' }}>
                        {r.error ? r.error.slice(0, 60) : r.got}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
