# Development & Deployment Guide

---

## Local Development

### Prerequisites

- Python 3.11+, Node.js 20+
- Google AI Studio API key → https://aistudio.google.com/apikey
- *(Optional)* Google Cloud project with Document AI API enabled (for PDF upload)

### 1. Start the ADK agents backend

```bash
cd agents
cp .env.example .env
# Edit .env — set GOOGLE_API_KEY (and optionally DOCUMENT_AI_PROCESSOR_ID)
pip install -e .
adk api_server --port 8000
# Swagger UI: http://localhost:8000/docs
```

### 2. Start the Next.js frontend

```bash
cd frontend
cp .env.example .env.local
# .env.local already points to http://localhost:8000
npm install
npm run dev
# App: http://localhost:3000
```

### 3. Verify the flow

1. Open http://localhost:3000
2. Pick a mock profile or upload a PDF resume
3. Click **Find Live Matches** — vacancy cards appear in ~10–30 s
4. Pick a vacancy → click **Generate Prep Material**
5. Answer questions → Submit All → view Report

---

## Environment Variables

### `agents/.env`

```bash
# Option A — Google AI Studio (local dev / hackathon)
GOOGLE_API_KEY=your_key_here

# Option B — Vertex AI (production, recommended)
GOOGLE_GENAI_USE_VERTEXAI=TRUE
GOOGLE_CLOUD_PROJECT=thesimplifiedtech
GOOGLE_CLOUD_LOCATION=us-central1

# Document AI (for PDF resume upload)
DOCUMENT_AI_PROCESSOR_ID=your_processor_id
DOCUMENT_AI_LOCATION=us-central1

# Live job listings (optional — falls back to mock vacancies if not set)
RAPIDAPI_KEY=your_rapidapi_key
```

### `frontend/.env.local`

```bash
# Local dev — points to adk api_server on port 8000
NEXT_PUBLIC_ADK_URL=http://localhost:8000
```

In production this is set via `--substitutions=_ADK_URL=...` during Cloud Build. `NEXT_PUBLIC_` variables are baked into the Next.js bundle at **build time** — they cannot be changed via Cloud Run runtime env vars.

---

## Deployment (Google Cloud Run)

### Prerequisites

- `gcloud` CLI authenticated (`gcloud auth login`)
- Artifact Registry repo: `us-central1-docker.pkg.dev/thesimplifiedtech/the-next-interview/`

### Deploy Agents

```bash
gcloud builds submit . \
  --tag us-central1-docker.pkg.dev/thesimplifiedtech/the-next-interview/agents:latest

gcloud run deploy the-next-interview-agents \
  --image us-central1-docker.pkg.dev/thesimplifiedtech/the-next-interview/agents:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --min-instances=1 \
  --timeout=300 \
  --set-env-vars GOOGLE_GENAI_USE_VERTEXAI=TRUE,GOOGLE_CLOUD_PROJECT=thesimplifiedtech,GOOGLE_CLOUD_LOCATION=us-central1
```

> `--min-instances=1` prevents cold starts. Agent calls can take up to 2 minutes — `--timeout=300` is required.

### Deploy Frontend

```bash
cd frontend
gcloud builds submit . --config cloudbuild.yaml
```

`cloudbuild.yaml` fetches the agents URL dynamically at build time via `gcloud run services describe` — nothing is hardcoded in source control.

---

## Session Storage

The frontend uses three `localStorage` keys:

| Key | Type | Contents |
|-----|------|----------|
| `tni_prep_session` | `PrepSession` | Vacancy, match result, questions, code challenge |
| `tni_assessment_session` | `AssessmentSession` | Answers, evaluations, final report |
| `tni_match_<resumeId>` | `MatchResult[]` | Cached match results per resume (24 h TTL) |

**Isolation rules** — prevents stale state bugs:
- `PrepClient` only restores cached questions if `session.vacancyId === vacancy.id`
- `AssessmentClient` only redirects to report if `assessment.prepSessionId === sessionId`
- `ReportClient` only loads stored report if `assessment.sessionId === sessionId`
- All ADK session IDs use `crypto.randomUUID()` — no collisions on retry

---

## Mock Data

### Resumes (`data/resumes/`)

| File | Candidate | Role | Years |
|------|-----------|------|-------|
| `java-dev-3yr.json` | Alex Chen | Java Developer | 3 |
| `python-ml-5yr.json` | Priya Sharma | ML Engineer | 5 |
| `devops-2yr.json` | Marcus Lee | DevOps Engineer | 2 |
| `fullstack-react-4yr.json` | Sofia Novak | Full-Stack Developer | 4 |
| `cloud-architect-8yr.json` | James Okafor | Cloud Architect | 8 |
| `database-engineer-elena-6yr.json` | Elena Vasquez | Database Engineer | 6 |
| `java-dev-sarah-5yr.json` | Sarah Kim | Java Developer | 5 |
| `kubernetes-engineer-marcus-5yr.json` | Marcus Johnson | Kubernetes Engineer | 5 |

### Vacancies (`data/vacancies/`)

23 roles across fintech, healthtech, SaaS, big-tech, and startups — Java, Python, Go, TypeScript, DevOps, ML, Cloud, Android, Security, and Data Engineering.

---

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| `Failed to fetch` on match page | Wrong `NEXT_PUBLIC_ADK_URL` baked in at build | Rebuild frontend with correct agents URL in `--substitutions` |
| `409 Conflict` from ADK | Duplicate session ID | Already handled via `crypto.randomUUID()` — clear localStorage if it persists |
| 0 vacancy cards shown | Agent timed out on cold start | Click Retry. Set `--min-instances=1` to avoid cold starts |
| Challenge fails first time, works second | Cloud Run cold start | Fixed: warmup ping sent on page load + auto-retry with "Agent warming up…" message |
| `**bold**` or `- bullets` showing as raw text | No markdown renderer | Fixed: `react-markdown` renders all agent text in `PrepClient` |
| Agents taking 60+ seconds | `thinking_budget` not set to 0 | All agents must have `thinking_config=ThinkingConfig(thinking_budget=0)` |
| Document AI `404` | Wrong processor ID or endpoint | Use `ClientOptions(api_endpoint="us-central1-documentai.googleapis.com")` and verify ID in Cloud Console |
| Resume upload returns empty JSON | PDF has no selectable text (scanned image) | Ensure PDF has selectable text; image-only PDFs need a Form Parser processor |
