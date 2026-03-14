import Link from 'next/link'

/* ─── Mock data ─────────────────────────────────────────────────────────────── */

const MOCK_BARS = [
  { label: 'Skills Match', pct: 91, color: '#34d399' },
  { label: 'Experience',   pct: 78, color: '#60a5fa' },
  { label: 'Tech Stack',   pct: 85, color: '#8b5cf6' },
]

// skill pct >= 80 → green  |  >= 50 → yellow  |  < 50 → red (gap)
const MOCK_VACANCIES = [
  { title: 'Staff Engineer',      company: 'Stripe',  score: 87, color: '#34d399', badge: 'Strong Match',
    skills: [{ name: 'TypeScript', pct: 98 }, { name: 'React', pct: 94 }, { name: 'Node.js', pct: 87 }, { name: 'Kubernetes', pct: 28 }] },
  { title: 'Senior Frontend Dev', company: 'Vercel',  score: 71, color: '#60a5fa', badge: 'Good Match',
    skills: [{ name: 'Next.js', pct: 91 }, { name: 'CSS', pct: 85 }, { name: 'Tailwind', pct: 78 }, { name: 'GraphQL', pct: 41 }] },
  { title: 'Lead React Engineer', company: 'Revolut', score: 48, color: '#fbbf24', badge: 'Stretch Role',
    skills: [{ name: 'React Native', pct: 55 }, { name: 'GraphQL', pct: 41 }, { name: 'gRPC', pct: 12 }] },
]
function skillColor(pct: number)  { return pct >= 80 ? '#34d399' : pct >= 50 ? '#fbbf24' : '#f87171' }
function skillBg(pct: number)     { return pct >= 80 ? 'rgba(52,211,153,0.10)' : pct >= 50 ? 'rgba(251,191,36,0.10)' : 'rgba(248,113,113,0.10)' }
function skillBorder(pct: number) { return pct >= 80 ? 'rgba(52,211,153,0.25)' : pct >= 50 ? 'rgba(251,191,36,0.25)' : 'rgba(248,113,113,0.25)' }

const COMPARISON = [
  { feature: 'Matched to real job listings',    tni: true,  leet: false, blind: false },
  { feature: 'No sign-up required',             tni: true,  leet: false, blind: false },
  { feature: 'CV upload & AI parsing',          tni: true,  leet: false, blind: false },
  { feature: 'Skill gap analysis per vacancy',  tni: true,  leet: false, blind: false },
  { feature: 'AI readiness verdict',            tni: true,  leet: false, blind: false },
  { feature: 'Coding challenges',               tni: true,  leet: true,  blind: false },
  { feature: 'Track score across attempts',     tni: true,  leet: false, blind: false },
  { feature: 'Course recommendations',          tni: true,  leet: false, blind: false },
]

// Journey dots — shows the multi-attempt progression
const JOURNEY = [
  { score: 45, label: 'Attempt 1', done: false },
  { score: 71, label: 'Attempt 2', done: false },
  { score: 87, label: 'Attempt 3', done: true  },
]

const AGENTS = [
  { n: 1, name: 'Resume Parser',        color: '#34d399' },
  { n: 2, name: 'Text CV Parser',       color: '#34d399' },
  { n: 3, name: 'Vacancy Matcher',      color: '#60a5fa' },
  { n: 4, name: 'Question Generator',   color: '#8b5cf6' },
  { n: 5, name: 'Code Challenge',       color: '#f59e0b' },
  { n: 6, name: 'Answer Evaluator',     color: '#f87171' },
  { n: 7, name: 'Readiness Assessor',   color: '#a78bfa' },
  { n: 8, name: 'Recommendation Agent', color: '#fb923c' },
]

const TECH = ['Google ADK', 'Gemini 2.5 Flash', 'Document AI', 'Next.js 14', 'TypeScript', 'Cloud Run', 'SSE Streaming']

const SCORE_PCT  = 87
const CIRCUM     = 339.3
const DASHOFFSET = CIRCUM * (1 - SCORE_PCT / 100)

export default function HomePage() {
  return (
    <div className="space-y-28">

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <section className="pt-16 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">

        {/* Left */}
        <div className="space-y-7">
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-medium"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}
          >
            ⚡ Powered by Google ADK + Gemini 2.5
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold leading-[1.1]" style={{ color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            Stop guessing.<br />
            <span className="gradient-text">Know</span>{' '}
            <span>you&apos;re ready.</span>
          </h1>

          {/* Animated readiness journey */}
          <div className="space-y-2 py-1">
            <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
              <span>Your readiness</span>
              <span className="font-semibold" style={{ color: '#34d399' }}>87% — Ready ✓</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div
                className="grow-bar h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, var(--accent), #34d399)', width: '45%' }}
              />
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Retake as many times as you want — each attempt targets your new gaps.
            </p>
          </div>

          <p className="text-lg leading-relaxed max-w-lg" style={{ color: 'var(--text-secondary)' }}>
            Upload your resume, match against 23 real vacancies, practice with AI-tailored questions,
            and get an honest readiness verdict — all in under 5 minutes.
          </p>

          {/* Dual CTAs */}
          <div className="flex items-center gap-3 flex-wrap">
            <Link href="/resume" className="btn-accent px-8 py-3.5 rounded-xl text-white font-semibold">
              Get Started Free →
            </Link>
            <Link
              href="/match/sarah-chen-demo"
              className="px-6 py-3.5 rounded-xl text-sm font-semibold transition-colors"
              style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            >
              See Example Report ↗
            </Link>
          </div>
        </div>

        {/* Right — floating mock readiness card */}
        <div className="float-anim hidden lg:flex justify-center">
          <div
            className="w-full max-w-sm rounded-2xl p-6 space-y-5"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              boxShadow: '0 0 60px rgba(139,92,246,0.12), 0 24px 60px rgba(0,0,0,0.3)',
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>AI Readiness Report</div>
                <div className="font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>Sarah Chen</div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Senior React Engineer</div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="pulse-dot w-2 h-2 rounded-full" style={{ background: '#34d399' }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Live</span>
              </div>
            </div>

            {/* Score ring */}
            <div className="flex flex-col items-center">
              <svg width="120" height="120" viewBox="0 0 130 130" className="-rotate-90">
                <circle cx="65" cy="65" r="54" fill="none" stroke="rgba(139,92,246,0.10)" strokeWidth="10" />
                <circle
                  cx="65" cy="65" r="54" fill="none"
                  stroke="#8b5cf6" strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={CIRCUM}
                  strokeDashoffset={DASHOFFSET}
                  style={{ '--target-offset': DASHOFFSET } as React.CSSProperties}
                  className="score-ring-progress"
                />
              </svg>
              <div style={{ marginTop: '-90px' }} className="flex flex-col items-center">
                <span className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{SCORE_PCT}%</span>
                <span className="text-xs font-semibold mt-0.5" style={{ color: '#34d399' }}>Ready ✓</span>
              </div>
              <div style={{ marginTop: '58px' }} />
            </div>

            {/* Score bars */}
            <div className="space-y-3">
              {MOCK_BARS.map(b => (
                <div key={b.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span style={{ color: 'var(--text-secondary)' }}>{b.label}</span>
                    <span className="font-medium tabular-nums" style={{ color: b.color }}>{b.pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-base)' }}>
                    <div className="h-full rounded-full" style={{ width: `${b.pct}%`, background: b.color }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Multi-attempt badge */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.18)' }}>
                <span style={{ color: '#34d399' }}>↑</span>
                <span className="text-xs" style={{ color: '#34d399' }}>+12 pts vs your last attempt</span>
              </div>
              {/* Journey dots */}
              <div className="flex items-center justify-between px-1">
                {JOURNEY.map((j, i) => (
                  <div key={j.label} className="flex items-center gap-0">
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                        style={j.done
                          ? { background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.35)' }
                          : { background: 'var(--bg-base)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
                        }
                      >
                        {j.score}%
                      </div>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{j.label}</span>
                    </div>
                    {i < JOURNEY.length - 1 && (
                      <div className="w-8 h-px mb-5 mx-1" style={{ background: 'var(--border)' }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust strip ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-center gap-6 text-sm" style={{ color: 'var(--text-muted)' }}>
        {[
          { icon: '⏱️', text: '~60 seconds to first results' },
          { icon: '🔓', text: 'No sign-up required' },
          { icon: '💼', text: '23 real vacancies' },
          { icon: '🔁', text: 'Retake anytime — free' },
        ].map(item => (
          <div key={item.text} className="flex items-center gap-2">
            <span>{item.icon}</span>
            <span>{item.text}</span>
          </div>
        ))}
      </div>

      {/* ── Mock vacancy results ──────────────────────────────────────────────── */}
      <section className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Example output</p>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            See exactly where you stand — for every vacancy
          </h2>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Not just a match percentage. Skill-by-skill breakdown, gaps highlighted, ranked by fit.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {MOCK_VACANCIES.map(v => (
            <div
              key={v.title}
              className="rounded-2xl p-5 space-y-4"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: `3px solid ${v.color}` }}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{v.title}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{v.company}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xl font-bold tabular-nums" style={{ color: v.color }}>{v.score}%</div>
                  <div className="text-xs font-medium" style={{ color: v.color }}>{v.badge}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {v.skills.map(s => (
                  <span
                    key={s.name}
                    className="text-xs px-2 py-0.5 rounded-full font-medium tabular-nums"
                    style={{ background: skillBg(s.pct), color: skillColor(s.pct), border: `1px solid ${skillBorder(s.pct)}` }}
                  >
                    {s.pct < 50 ? '⚠️' : '✓'} {s.name} {s.pct}%
                  </span>
                ))}
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-base)' }}>
                <div className="h-full rounded-full" style={{ width: `${v.score}%`, background: v.color }} />
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
          ↑ Actual platform output · All 23 vacancies scored in ~30s
        </p>
      </section>

      {/* ── Outcomes bento ───────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Why it works</p>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Built for the real interview</h2>
        </div>

        {/* Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Big card */}
          <div className="md:col-span-2 rounded-2xl p-6 space-y-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Real feedback</p>
              <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                You&apos;ll know exactly where you stand — and why.
              </h3>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Write in your own words. No multiple choice. The AI grades your actual reasoning.</p>
            </div>
            <div className="space-y-2.5">
              <div className="rounded-xl p-3 text-sm" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                <span className="font-semibold" style={{ color: 'var(--text-muted)' }}>Q:</span>
                <span className="ml-2" style={{ color: 'var(--text-secondary)' }}>Explain how React&apos;s reconciliation algorithm works.</span>
              </div>
              <div className="rounded-xl p-3 text-sm" style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent-border)' }}>
                <span className="font-semibold" style={{ color: 'var(--accent)' }}>Your answer:</span>
                <span className="ml-2" style={{ color: 'var(--text-secondary)' }}>React uses a virtual DOM and diffing algorithm to minimize DOM updates...</span>
              </div>
              <div className="rounded-xl p-3 flex items-start gap-3" style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.18)' }}>
                <span className="text-base flex-shrink-0">✅</span>
                <div>
                  <div className="text-xs font-semibold" style={{ color: '#34d399' }}>Excellent · 92/100</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Strong explanation. Mention Fiber architecture for a perfect answer.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Small card */}
          <div className="rounded-2xl p-6 flex flex-col justify-between space-y-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Coding practice</p>
              <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Problems you&apos;ll actually see in interviews.</h3>
              <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                One real-world challenge from your target industry, with a full step-by-step solution and complexity walkthrough.
              </p>
            </div>
            <div
              className="rounded-xl px-4 py-3 text-xs space-y-1"
              style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', fontFamily: 'monospace' }}
            >
              <div style={{ color: 'var(--text-muted)' }}>{'// Two Sum · JavaScript'}</div>
              <div style={{ color: '#60a5fa' }}>{'function twoSum(nums, target) {'}</div>
              <div style={{ color: 'var(--text-secondary)', paddingLeft: '1rem' }}>{'const map = new Map()'}</div>
              <div style={{ color: 'var(--text-muted)', paddingLeft: '1rem' }}>{'  ...'}</div>
              <div style={{ color: '#60a5fa' }}>{'}'}<span style={{ color: '#34d399' }}>{' // O(n) · O(n)'}</span></div>
            </div>
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl p-6 space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2">
              <div className="pulse-dot w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#34d399' }} />
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Instant results</p>
            </div>
            <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Results in under 60 seconds.</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Agents stream results as they run — no spinner waiting for a wall-clock timeout. Watch your report build live.
            </p>
            <div className="rounded-xl p-3 text-xs font-mono space-y-1.5" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              <div><span style={{ color: '#34d399' }}>✓</span> Scoring vacancy_1… 87%</div>
              <div><span style={{ color: '#34d399' }}>✓</span> Scoring vacancy_2… 71%</div>
              <div className="flex items-center gap-1.5">
                <span className="pulse-dot w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'var(--accent)' }} />
                <span style={{ color: 'var(--accent)' }}>Scoring vacancy_3…</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl p-6 space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Targeted prep</p>
            <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Questions built around your gaps — not a generic list.</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              The AI reads your match results and probes the exact skills you&apos;re missing for that role.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {['Kubernetes', 'gRPC', 'System Design'].map(s => (
                <span key={s} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.10)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}>
                  ✕ gap: {s}
                </span>
              ))}
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}>→ 15 questions generated</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Comparison table ─────────────────────────────────────────────────── */}
      <section className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>How it compares</p>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Not just practice problems.
          </h2>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            LeetCode tells you if your code runs. We tell you if you&apos;re ready for the job.
          </p>
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          {/* Header */}
          <div className="grid grid-cols-4 text-xs font-semibold uppercase tracking-widest px-5 py-3" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
            <div className="col-span-1">Feature</div>
            <div className="text-center" style={{ color: 'var(--accent)' }}>The Next Interview</div>
            <div className="text-center">LeetCode</div>
            <div className="text-center">Blind</div>
          </div>
          {/* Rows */}
          {COMPARISON.map((row, i) => (
            <div
              key={row.feature}
              className="grid grid-cols-4 px-5 py-3 text-sm items-center"
              style={{ background: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-base)', borderBottom: '1px solid var(--border)' }}
            >
              <div style={{ color: 'var(--text-secondary)' }}>{row.feature}</div>
              <div className="text-center">
                {row.tni
                  ? <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold" style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399' }}>✓</span>
                  : <span style={{ color: 'var(--text-muted)' }}>—</span>}
              </div>
              <div className="text-center">
                {row.leet
                  ? <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold" style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399' }}>✓</span>
                  : <span style={{ color: 'var(--text-muted)' }}>—</span>}
              </div>
              <div className="text-center">
                {row.blind
                  ? <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold" style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399' }}>✓</span>
                  : <span style={{ color: 'var(--text-muted)' }}>—</span>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Keep going section ────────────────────────────────────────────────── */}
      <section
        className="rounded-2xl p-8 text-center space-y-6"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>The retake loop</p>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Keep going until you&apos;re ready.
          </h2>
          <p className="mt-2 text-sm max-w-lg mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Each attempt generates fresh questions targeting your latest weak areas.
            Your score goes up. Your gaps shrink. You walk in confident.
          </p>
        </div>

        {/* Progress journey */}
        <div className="flex items-center justify-center gap-0 flex-wrap">
          {JOURNEY.map((j, i) => (
            <div key={j.label} className="flex items-center">
              <div className="flex flex-col items-center gap-2">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold"
                  style={j.done
                    ? { background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '2px solid rgba(52,211,153,0.35)' }
                    : { background: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
                  }
                >
                  {j.score}%
                </div>
                <span className="text-xs" style={{ color: j.done ? '#34d399' : 'var(--text-muted)' }}>
                  {j.done ? `${j.label} ✓` : j.label}
                </span>
              </div>
              {i < JOURNEY.length - 1 && (
                <div className="w-12 h-px mx-2 mb-5" style={{ background: 'var(--border)' }} />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Main CTA ──────────────────────────────────────────────────────────── */}
      <section
        className="rounded-2xl p-10 text-center space-y-5"
        style={{ background: 'linear-gradient(135deg, var(--accent-soft) 0%, var(--bg-card) 100%)', border: '1px solid var(--accent-border)' }}
      >
        <div className="text-4xl">🚀</div>
        <h2 className="text-3xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Ready to prepare smarter?</h2>
        <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
          Upload your resume and get a full AI readiness report in under 5 minutes.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap pt-1">
          <Link href="/resume" className="btn-accent px-10 py-3.5 rounded-xl text-white font-semibold inline-block">
            Get Started Free →
          </Link>
          <Link
            href="/resume"
            className="px-6 py-3.5 rounded-xl text-sm font-semibold"
            style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
          >
            See Demo Profiles ↗
          </Link>
        </div>
        {/* Time strip */}
        <div className="flex flex-wrap items-center justify-center gap-5 pt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>⏱️ ~60 seconds</span>
          <span>·</span>
          <span>🔓 No sign-up</span>
          <span>·</span>
          <span>💼 23 vacancies</span>
          <span>·</span>
          <span>🔁 Retake anytime</span>
        </div>
      </section>

      {/* ── Tech stack ────────────────────────────────────────────────────────── */}
      <section className="text-center space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Built with</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {TECH.map(t => (
            <span key={t} className="px-4 py-2 rounded-xl text-sm font-medium" style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* ── Agent pipeline (technical deep dive — bottom) ─────────────────────── */}
      <section className="rounded-2xl p-8 space-y-8 pb-20" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>For the technically curious</p>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>8-Agent AI Pipeline</h2>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Each agent is a standalone Google ADK app · Responses streamed via SSE · Zero gateway timeouts
          </p>
        </div>

        <div className="relative overflow-x-auto pb-2">
          <div className="flex items-start gap-0 min-w-max mx-auto" style={{ width: 'fit-content' }}>
            {AGENTS.map((a, i) => (
              <div key={a.name} className="flex items-center">
                <div className="flex flex-col items-center gap-2 w-28">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ background: `${a.color}18`, color: a.color, border: `2px solid ${a.color}40` }}
                  >
                    {a.n}
                  </div>
                  <div className="text-xs font-medium text-center leading-tight" style={{ color: 'var(--text-secondary)' }}>
                    {a.name}
                  </div>
                </div>
                {i < AGENTS.length - 1 && (
                  <div className="flex items-center mb-6 flex-shrink-0">
                    <div className="w-4 h-px" style={{ background: 'var(--border)' }} />
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>›</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}
