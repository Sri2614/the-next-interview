/**
 * Central configuration constants.
 * Import from here — never hardcode these values in components.
 */

/** ADK (Google Agent Dev Kit) backend base URL. Baked in at build time via NEXT_PUBLIC_ADK_URL. */
export const ADK_BASE =
  process.env.NEXT_PUBLIC_ADK_URL ||
  'https://the-next-interview-agents-379802788252.us-central1.run.app'

/**
 * Programming languages recognised when choosing the primary language for a coding challenge.
 * Extend this list as the platform supports more roles.
 */
export const CODING_LANGUAGES = [
  'Java', 'Python', 'TypeScript', 'JavaScript', 'Go',
  'Kotlin', 'Scala', 'Ruby', 'C#', 'Rust', 'Swift', 'C++',
]

/** Session TTL: 7 days in milliseconds. Sessions older than this are discarded on read. */
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1_000
