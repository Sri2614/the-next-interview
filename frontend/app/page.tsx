import Link from 'next/link'

/* ─── Mock data — renders the actual app UI as landing page content ─────────── */

const MOCK_BARS = [
  { label: 'Skills Match', pct: 91, color: '#34d399' },
  { label: 'Experience',   pct: 78, color: '#60a5fa' },
  { label: 'Tech Stack',   pct: 85, color: '#8b5cf6' },
]

const MOCK_VACANCIES = [
  { title: 'Staff Engineer',      company: 'Stripe',  score: 87, color: '#34d399', badge: 'Strong Match',  skills: ['TypeScript','React','Node.js'] },
  { title: 'Senior Frontend Dev', company: 'Vercel',  score: 71, color: '#60a5fa', badge: 'Good Match',    skills: ['Next.js','CSS','Tailwind'] },
  { title: 'Lead React Engineer', company: 'Revolut', score: 48, color: '#fbbf24', badge: 'Stretch Role',  skills: ['React Native','GraphQL'] },
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

// SVG score ring: r=54, circumference=339.3
const SCORE_PCT  = 87
const CIRCUM     = 339.3
const DASHOFFSET = CIRCUM * (1 - SCORE_PCT / 100)   // 44.1

export default function HomePage() {
  return (
    <div className="space-y-32">

      {/* ── Hero ── split: text left · mock report card right ────────────────── */}
      <section className="pt-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

        {/* Left — copy */}
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
            <span style={{ color: 'var(--text-primary)' }}>you&apos;re ready.</span>
          </h1>

          <p className="text-lg leading-relaxed max-w-lg" style={{ color: 'var(--text-secondary)' }}>
            Upload your resume, match against 23 real vacancies, prep with AI-tailored questions,
            and get an honest readiness verdict — all in under 5 minutes.
          </p>

          {/* Inline stats */}
          <div className="flex flex-wrap gap-6 py-2">
            {[
              { v: '23', l: 'vacancies' },
              { v: '8',  l: 'AI agents' },
              { v: '15', l: 'questions' },
            ].map(s => (
              <div key={s.l}>
                <span className="text-2xl font-bold tabular-nums" style={{ color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>{s.v}</span>
                <span className="text-sm ml-1.5" style={{ color: 'var(--text-muted)' }}>{s.l}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <Link href="/resume" className="btn-accent px-8 py-3.5 rounded-xl text-white font-semibold">
              Start Preparing →
            </Link>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Free · No sign-in</span>
          </div>
        </div>

        {/* Right — mock AI Readiness Report card */}
        <div className="float-anim hidden lg:flex justify-center">
          <div
            className="w-full max-w-sm rounded-2xl p-6 space-y-5 shadow-2xl"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              boxShadow: '0 0 60px rgba(139,92,246,0.12), 0 24px 60px rgba(0,0,0,0.3)',
            }}
          >
            {/* Card header */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>AI Readiness Report</div>
                <div className="font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>Sarah Chen</div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Senior React Engineer</div>
              </div>
              {/* Live dot */}
              <div className="flex items-center gap-1.5">
                <div className="pulse-dot w-2 h-2 rounded-full" style={{ background: '#34d399' }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Live</span>
              </div>
            </div>

            {/* Score ring */}
            <div className="flex flex-col items-center gap-2">
              <svg width="130" height="130" viewBox="0 0 130 130" className="-rotate-90">
                <circle cx="65" cy="65" r="54" fill="none" stroke="rgba(139,92,246,0.10)" strokeWidth="10" />
                <circle
                  cx="65" cy="65" r="54" fill="none"
                  stroke="#8b5cf6" strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={CIRCUM}
                  strokeDashoffset={DASHOFFSET}
                  style={{'--target-offset': DASHOFFSET} as React.CSSProperties}
                  className="score-ring-progress"
                />
              </svg>
              <div className="-mt-[105px] flex flex-col items-center">
                <span className="text-3xl font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>{SCORE_PCT}%</span>
                <span className="text-xs font-semibold mt-0.5" style={{ color: '#34d399' }}>Ready ✓</span>
              </div>
              <div className="mt-[68px]" />
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

            {/* Improvement badge */}
            <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.18)' }}>
              <span style={{ color: '#34d399' }}>↑</span>
              <span className="text-xs" style={{ color: '#34d399' }}>+12 pts vs your last attempt</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Mock vacancy results — "This is what you'll see" ─────────────────── */}
      <section className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
            Example output
          </p>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            AI scores every vacancy against your profile
          </h2>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Real skill-gap breakdown. Not generic advice.
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
                  <span key={s} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>
                    ✓ {s}
                  </span>
                ))}
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-base)' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${v.score}%`, background: v.color }} />
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
          ↑ Actual output from the platform · 23 vacancies scored in ~30s
        </p>
      </section>

      {/* ── Bento — what makes it different ──────────────────────────────────── */}
      <section className="space-y-4">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>What makes it different</p>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Built for the real interview</h2>
        </div>

        {/* Row 1: big card + two small */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Big card — mock Q&A */}
          <div className="md:col-span-2 rounded-2xl p-6 space-y-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>No multiple choice</div>
            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              Write real answers. Get real feedback.
            </h3>
            {/* Mock Q&A */}
            <div className="space-y-3 mt-2">
              <div className="rounded-xl p-3 text-sm" style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Q:</span>
                <span className="ml-2" style={{ color: 'var(--text-secondary)' }}>Explain how React's reconciliation algorithm works.</span>
              </div>
              <div className="rounded-xl p-3 text-sm" style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent-border)' }}>
                <span className="font-semibold" style={{ color: 'var(--accent)' }}>Your answer:</span>
                <span className="ml-2" style={{ color: 'var(--text-secondary)' }}>React uses a virtual DOM and diffing algorithm to minimize DOM updates...</span>
              </div>
              <div className="rounded-xl p-3 flex items-start gap-3" style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.18)' }}>
                <span className="text-lg flex-shrink-0">✅</span>
                <div>
                  <div className="text-xs font-semibold" style={{ color: '#34d399' }}>Excellent · 92/100</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Strong explanation. Mention Fiber architecture for a perfect answer.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Small card — coding challenge */}
          <div className="rounded-2xl p-6 flex flex-col justify-between space-y-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div>
              <div className="text-2xl mb-3">💻</div>
              <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Coding challenge + full solution</h3>
              <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                Real task from your target industry. Step-by-step walkthrough with time & space complexity.
              </p>
            </div>
            <div className="rounded-lg px-3 py-2 text-xs font-mono" style={{ background: 'var(--bg-base)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
              O(n log n) · JavaScript · ~20 mins
            </div>
          </div>
        </div>

        {/* Row 2: two medium cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Streaming */}
          <div className="rounded-2xl p-6 space-y-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2">
              <div className="pulse-dot w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#34d399' }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Live streaming</span>
            </div>
            <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Results stream in real-time</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              All 8 agents run over SSE — no waiting for a 60-second HTTP timeout. Watch your report build as the AI thinks.
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

          {/* Gap analysis */}
          <div className="rounded-2xl p-6 space-y-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="text-2xl">🎯</div>
            <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Questions target your exact gaps</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              The Question Generator reads your skill gaps from the match results and probes the areas you&apos;re weakest in — not generic interview lists.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {['Kubernetes', 'gRPC', 'System Design'].map(s => (
                <span key={s} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.10)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}>
                  ✕ gap: {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Agent pipeline ────────────────────────────────────────────────────── */}
      <section className="rounded-2xl p-8 space-y-8" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Architecture</p>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>8 specialized agents</h2>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>Each is a standalone Google ADK app · Orchestrated independently · Streamed via SSE</p>
        </div>

        {/* Pipeline row with connecting line */}
        <div className="relative overflow-x-auto">
          <div className="flex items-center gap-0 min-w-max mx-auto" style={{ width: 'fit-content' }}>
            {AGENTS.map((a, i) => (
              <div key={a.name} className="flex items-center">
                {/* Agent node */}
                <div className="flex flex-col items-center gap-2 w-28">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ background: `${a.color}18`, color: a.color, border: `2px solid ${a.color}40` }}
                  >
                    {a.n}
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-medium leading-tight" style={{ color: 'var(--text-primary)' }}>{a.name}</div>
                  </div>
                </div>
                {/* Arrow connector */}
                {i < AGENTS.length - 1 && (
                  <div className="w-8 flex-shrink-0 flex items-center justify-center -mt-6">
                    <div className="h-px w-full" style={{ background: 'var(--border)' }} />
                    <span className="text-xs flex-shrink-0 -ml-1" style={{ color: 'var(--text-muted)' }}>›</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tech stack ────────────────────────────────────────────────────────── */}
      <section className="text-center space-y-5">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Built with</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {TECH.map(t => (
            <span key={t} className="px-4 py-2 rounded-xl text-sm font-medium" style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────────── */}
      <section
        className="rounded-2xl p-10 text-center pb-20 space-y-5"
        style={{ background: 'linear-gradient(135deg, var(--accent-soft) 0%, var(--bg-card) 100%)', border: '1px solid var(--accent-border)' }}
      >
        <div className="text-4xl">🚀</div>
        <h2 className="text-3xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Ready to prepare smarter?</h2>
        <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
          Upload your resume or paste your CV and get a full AI readiness report in under 5 minutes. No sign-in, no credit card.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap pt-2">
          <Link href="/resume" className="btn-accent px-10 py-3.5 rounded-xl text-white font-semibold inline-block">
            Get Started Free →
          </Link>
          <Link href="/resume" className="px-6 py-3.5 rounded-xl text-sm font-medium" style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
            View Demo Profiles
          </Link>
        </div>
        <p className="text-xs pt-1" style={{ color: 'var(--text-muted)' }}>23 vacancies · 8 AI agents · Results in ~60s</p>
      </section>

    </div>
  )
}
