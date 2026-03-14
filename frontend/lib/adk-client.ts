/**
 * Client for the Google ADK API server (v1.26+).
 * New API: POST /run and POST /run_sse with appName/userId/sessionId in the body.
 */

const ADK_BASE = process.env.NEXT_PUBLIC_ADK_URL || 'https://the-next-interview-agents-379802788252.us-central1.run.app'
const APP_NAME = 'interview_system'

// ── SSE event type ────────────────────────────────────────────────────────────
export interface ADKEvent {
  author?: string
  content?: { parts?: { text?: string }[] }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  actions?: { stateDelta?: Record<string, any> }
}

/**
 * Call /run_sse and collect all streamed events into an array.
 * Drop-in replacement for fetch('/run') + res.json() — returns same event shape
 * but avoids gateway timeouts on long-running agents.
 */
export async function collectSSEEvents(url: string, body: object): Promise<ADKEvent[]> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Agent error (${res.status})`)

  const events: ADKEvent[] = []
  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim()
        if (data === '[DONE]') continue
        try { events.push(JSON.parse(data)) } catch { /* skip malformed SSE lines */ }
      }
    }
  }
  return events
}

export async function ensureSession(userId: string, sessionId: string): Promise<void> {
  await fetch(`${ADK_BASE}/apps/${APP_NAME}/users/${userId}/sessions/${sessionId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
}

function buildRunBody(userId: string, sessionId: string, message: string) {
  return {
    appName: APP_NAME,
    userId,
    sessionId,
    newMessage: { parts: [{ text: message }], role: 'user' },
  }
}

/**
 * Run an agent synchronously. Returns the last text response from any agent.
 */
export async function runAgent(
  userId: string,
  sessionId: string,
  message: string,
): Promise<string> {
  await ensureSession(userId, sessionId)

  const res = await fetch(`${ADK_BASE}/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildRunBody(userId, sessionId, message)),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`ADK agent failed (${res.status}): ${error}`)
  }

  const events: Array<{ content?: { parts?: Array<{ text?: string }> }; author?: string }> = await res.json()
  // Return the last non-empty text from any agent event
  for (let i = events.length - 1; i >= 0; i--) {
    const text = events[i]?.content?.parts?.[0]?.text
    if (text) return text
  }
  return ''
}

/**
 * Run an agent with streaming (Server-Sent Events).
 * Yields text chunks as they arrive.
 */
export async function* streamAgent(
  userId: string,
  sessionId: string,
  message: string,
): AsyncGenerator<string, void, unknown> {
  await ensureSession(userId, sessionId)

  const res = await fetch(`${ADK_BASE}/run_sse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildRunBody(userId, sessionId, message)),
  })

  if (!res.ok) {
    throw new Error(`ADK streaming failed (${res.status})`)
  }

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })
    for (const line of chunk.split('\n')) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6))
          const text = data?.content?.parts?.[0]?.text
          if (text) yield text
        } catch {
          // Skip malformed SSE lines
        }
      }
    }
  }
}

/**
 * Get the current session state from ADK.
 */
export async function getSessionState(
  userId: string,
  sessionId: string
): Promise<Record<string, unknown>> {
  const res = await fetch(
    `${ADK_BASE}/apps/${APP_NAME}/users/${userId}/sessions/${sessionId}`,
    { method: 'GET' }
  )
  if (!res.ok) return {}
  const data = await res.json()
  return data.state ?? {}
}
