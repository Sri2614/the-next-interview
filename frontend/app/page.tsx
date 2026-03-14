import Link from 'next/link'

const STATS = [
  { value: '23',  label: 'Live Vacancies',      icon: '💼' },
  { value: '8',   label: 'AI Agents',            icon: '🤖' },
  { value: '15',  label: 'Questions / Session',  icon: '🎯' },
  { value: '5',   label: 'Steps to Readiness',   icon: '📈' },
]

const STEPS = [
  {
    n: 1, icon: '📄', title: 'Upload Resume',
    desc: 'Drop a PDF, paste CV text, or pick a demo profile. Document AI extracts your full skill set.',
    tag: 'Google Document AI',
  },
  {
    n: 2, icon: '🎯', title: 'Match Vacancies',
    desc: 'AI scores all 23 open roles against your profile with breakdown and skill gap analysis.',
    tag: 'Vacancy Matcher Agent',
  },
  {
    n: 3, icon: '📝', title: 'Prep Questions',
    desc: '15 tailored interview questions + a coding challenge designed around your exact gaps.',
    tag: 'Question + Code Agents',
  },
  {
    n: 4, icon: '✍️', title: 'Take Assessment',
    desc: 'Answer in your own words — no multiple choice. The AI evaluates your actual reasoning.',
    tag: 'Answer Evaluator Agent',
  },
  {
    n: 5, icon: '📊', title: 'Get Your Report',
    desc: 'Readiness verdict, per-question feedback, score vs. previous attempts, and curated courses.',
    tag: 'Readiness Assessor Agent',
  },
]

const AGENTS = [
  { n: 1, name: 'Resume Parser',        desc: 'PDF → structured profile',          color: '#34d399', used: 'Document AI' },
  { n: 2, name: 'Text CV Parser',       desc: 'Plain text → structured profile',   color: '#34d399', used: 'Gemini 2.5 Flash' },
  { n: 3, name: 'Vacancy Matcher',      desc: 'Scores all 23 open roles',          color: '#60a5fa', used: 'Gemini 2.5 Flash' },
  { n: 4, name: 'Question Generator',   desc: '15 tailored interview questions',   color: '#8b5cf6', used: 'Gemini 2.5 Flash' },
  { n: 5, name: 'Code Challenge',       desc: 'Task + step-by-step solution',      color: '#f59e0b', used: 'Gemini 2.5 Flash' },
  { n: 6, name: 'Answer Evaluator',     desc: 'Grades every written response',     color: '#f87171', used: 'Gemini 2.5 Flash' },
  { n: 7, name: 'Readiness Assessor',   desc: 'Final readiness verdict + score',   color: '#a78bfa', used: 'Gemini 2.5 Flash' },
  { n: 8, name: 'Recommendation Agent', desc: 'Curated courses for weak areas',    color: '#fb923c', used: 'Gemini 2.5 Flash' },
]

const TECH = [
  'Google ADK', 'Gemini 2.5 Flash', 'Document AI',
  'Next.js 14', 'TypeScript', 'Cloud Run', 'Artifact Registry',
]

export default function HomePage() {
  return (
    <div className="space-y-28">

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <section className="text-center pt-16 pb-4 space-y-7 relative">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-medium tracking-wide"
          style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}
        >
          ⚡ Powered by Google ADK + Gemini 2.5
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.1]" style={{ color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
          Stop guessing.<br />
          <span className="gradient-text">Know</span>{' '}
          <span style={{ color: 'var(--text-primary)' }}>you&apos;re ready.</span>
        </h1>

        <p className="text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)', letterSpacing: '-0.01em' }}>
          Match your resume to real vacancies, practice with AI-generated questions tailored to your gaps,
          and get an honest readiness verdict — all in under 5 minutes.
        </p>

        {/* CTAs */}
        <div className="flex items-center justify-center gap-4 pt-1 flex-wrap">
          <Link href="/resume" className="btn-accent px-8 py-3.5 rounded-xl text-white font-semibold text-base">
            Start Preparing →
          </Link>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Free · No sign-in required</span>
        </div>

        <div className="shine-divider max-w-xs mx-auto mt-10" />
      </section>

      {/* ── Stats bar ─────────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATS.map(s => (
          <div
            key={s.label}
            className="rounded-2xl p-5 text-center space-y-1"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="text-3xl font-bold tabular-nums" style={{ color: 'var(--accent)', letterSpacing: '-0.03em' }}>
              {s.value}
            </div>
            <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </section>

      {/* ── How it works ──────────────────────────────────────────────────────── */}
      <section>
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
            How it works
          </p>
          <h2 className="text-3xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            5 steps from upload to verdict
          </h2>
        </div>

        <div className="space-y-3">
          {STEPS.map((step, i) => (
            <div
              key={step.n}
              className="rounded-2xl p-5 flex gap-5 items-start"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              {/* Step number */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}
              >
                {step.n}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap mb-1">
                  <span className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
                    {step.icon} {step.title}
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: 'var(--bg-base)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                  >
                    {step.tag}
                  </span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{step.desc}</p>
              </div>

              {/* Connector arrow (all except last) */}
              {i < STEPS.length - 1 && (
                <div className="hidden md:flex items-center self-center flex-shrink-0">
                  <span className="text-lg" style={{ color: 'var(--text-muted)' }}>→</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link href="/resume" className="btn-accent px-8 py-3 rounded-xl text-white font-semibold inline-block">
            Try it now →
          </Link>
        </div>
      </section>

      {/* ── Agent pipeline ────────────────────────────────────────────────────── */}
      <section
        className="rounded-2xl p-8"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        <div className="text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
            Under the hood
          </p>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            8-Agent AI Pipeline
          </h2>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Each agent is a standalone Google ADK app · Streamed via SSE · Zero gateway timeouts
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {AGENTS.map(a => (
            <div
              key={a.name}
              className="rounded-xl p-4 space-y-2.5"
              style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: `${a.color}18`, color: a.color, border: `1px solid ${a.color}30` }}
                >
                  {a.n}
                </div>
                <span className="font-medium text-sm leading-tight" style={{ color: 'var(--text-primary)' }}>{a.name}</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{a.desc}</p>
              <div
                className="text-xs px-1.5 py-0.5 rounded inline-block"
                style={{ background: `${a.color}12`, color: a.color }}
              >
                {a.used}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Tech stack ────────────────────────────────────────────────────────── */}
      <section className="text-center space-y-5">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          Built with
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {TECH.map(t => (
            <span
              key={t}
              className="px-4 py-2 rounded-xl text-sm font-medium"
              style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
            >
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────────── */}
      <section
        className="rounded-2xl p-10 text-center pb-20 space-y-5"
        style={{
          background: 'linear-gradient(135deg, var(--accent-soft) 0%, var(--bg-card) 100%)',
          border: '1px solid var(--accent-border)',
        }}
      >
        <div className="text-4xl">🚀</div>
        <h2 className="text-3xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Ready to prepare smarter?
        </h2>
        <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
          Upload your resume or paste your CV text and get a full AI readiness report in under 5 minutes.
          No sign-in, no credit card.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap pt-2">
          <Link href="/resume" className="btn-accent px-10 py-3.5 rounded-xl text-white font-semibold inline-block">
            Get Started Free →
          </Link>
          <Link
            href="/resume"
            className="px-6 py-3.5 rounded-xl text-sm font-medium"
            style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          >
            View Demo Profiles
          </Link>
        </div>
        <p className="text-xs pt-1" style={{ color: 'var(--text-muted)' }}>
          23 vacancies · 8 AI agents · Results in ~60s
        </p>
      </section>

    </div>
  )
}
