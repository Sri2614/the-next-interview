# Agent Reference

All agents are standalone `LlmAgent` instances registered with Google ADK.
All use **Gemini 2.5 Flash** with `thinking_budget=0` — cuts latency from ~60–180 s → 5–20 s with no quality loss on structured JSON tasks.

The browser calls each agent independently via `POST /run_sse` on the ADK API server.

---

## Agent Map

```
/resume      → resume_parser
/match       → vacancy_matcher
/prep        → ParallelAgent [ question_generator + code_challenge ]
/assessment  → answer_evaluator
/report      → SequentialAgent [ readiness_assessor → recommendation_agent ]
```

---

## `resume_parser`

| | |
|---|---|
| **Type** | `LlmAgent` |
| **Tool** | `parse_resume_with_document_ai` — sends PDF to Document AI OCR, returns extracted plain text |
| **Input** | `pdf_base64` from ADK session state |
| **Output key** | `parsed_resume` — `{ name, role, yearsExperience, skills[], experience[], education[] }` |
| **Note** | Raw PDF never enters the LLM — only the OCR text output does |

---

## `vacancy_matcher`

| | |
|---|---|
| **Type** | `LlmAgent` |
| **Input** | Parsed resume JSON |
| **Output key** | `match_results` — `{ "results": [MatchResult, ...] }` |
| **What it does** | Fetches live vacancies via RapidAPI JSearch (falls back to 23 local mock JSONs), scores each 0–100%, assigns `strong_fit / good_fit / partial_fit / mismatch`, lists matched and missing skills |
| **Cache** | Frontend caches results in `localStorage` per resume ID to avoid re-calling on revisit |

---

## `question_generator`

| | |
|---|---|
| **Type** | `LlmAgent` inside `ParallelAgent` |
| **Input** | Vacancy JSON + skill gaps |
| **Output key** | `generated_questions` — `{ "questions": [GeneratedQuestion, ...] }` |
| **What it does** | Generates 15 questions split across `junior / mid / senior` difficulty, each with `focusArea`, `hint`, `keyPoints`, `modelAnswer` |

---

## `code_challenge`

| | |
|---|---|
| **Type** | `LlmAgent` inside `ParallelAgent` |
| **Input** | Vacancy JSON + primary programming language |
| **Output key** | `code_challenge` |
| **What it does** | Creates a role-appropriate coding task with `starterCode`, `solution` (step-by-step + time/space complexity), `testCases`, and `followUps` |
| **Note** | Runs concurrently with `question_generator` — both finish together |

---

## `answer_evaluator`

| | |
|---|---|
| **Type** | `LlmAgent` |
| **Input** | All 15 questions + the user's free-text answers |
| **Output key** | `answer_evaluations` — `{ "evaluations": [AnswerEvaluation, ...] }` |
| **What it does** | Grades each answer: score (0–100), verdict (`excellent / good / partial / weak / missing`), 2–3 sentence feedback, missed concepts, suggested study topics |

---

## `readiness_assessor`

| | |
|---|---|
| **Type** | `LlmAgent` — first step of `SequentialAgent` |
| **Input** | Evaluations summary + match score + missing skills |
| **Output key** | `readiness_report` |
| **What it does** | Synthesises everything into a final report: `overallScore`, `verdict`, `categoryScores` (Technical / Communication / Problem Solving), `strengths[]`, `weaknesses[]`, `studyPlan[]` |

---

## `recommendation_agent`

| | |
|---|---|
| **Type** | `LlmAgent` — second step of `SequentialAgent` |
| **Input** | `readiness_report` from `readiness_assessor` (passed automatically via ADK session state) |
| **Output key** | `course_recommendations` |
| **What it does** | For each weak area in the study plan, generates Udemy course search links (`https://www.udemy.com/courses/search/?q=TOPIC`) |

---

## ADK Response Parsing

ADK's `stateDelta` values arrive as either a parsed JS object or a raw JSON string (when the agent wraps output in ` ```json ``` `). All frontend clients handle both cases with a triple-fallback pattern:

```typescript
const rawData = event?.actions?.stateDelta?.some_key

// 1. Already a parsed object
if (typeof rawData === 'object' && rawData !== null && 'expectedField' in rawData) {
  result = rawData
} else {
  const str = typeof rawData === 'string' ? rawData : JSON.stringify(rawData)
  try {
    // 2. Plain JSON string
    result = JSON.parse(str)
  } catch {
    // 3. Regex extraction from markdown-wrapped JSON
    const m = str.match(/\{[\s\S]*"expectedField"[\s\S]*\}/)
    if (m) result = JSON.parse(m[0])
  }
}

// Final fallback: content.parts text
if (!result) {
  const text = event?.content?.parts?.findLast(p => p.text)?.text ?? ''
  const m = text.match(/\{[\s\S]*"expectedField"[\s\S]*\}/)
  if (m) result = JSON.parse(m[0])
}

if (!result) throw new Error('Agent returned unparseable response')
```
