import { NextRequest, NextResponse } from 'next/server'

// Judge0 language IDs
// 71 = Python 3, 63 = JavaScript (Node.js), 62 = Java, 54 = C++
const JUDGE0_URL = 'https://judge0-ce.p.rapidapi.com/submissions'
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY ?? ''

export async function POST(req: NextRequest) {
  try {
    const { code, language_id, stdin } = await req.json()

    if (!code || !language_id) {
      return NextResponse.json({ error: 'code and language_id are required' }, { status: 400 })
    }

    if (!RAPIDAPI_KEY) {
      return NextResponse.json({ error: 'Code execution not configured' }, { status: 503 })
    }

    const response = await fetch(`${JUDGE0_URL}?base64_encoded=false&wait=true&fields=stdout,stderr,compile_output,status,time,memory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
      },
      body: JSON.stringify({
        source_code: code,
        language_id,
        stdin: stdin ?? '',
        cpu_time_limit: 5,
        memory_limit: 128000,
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      return NextResponse.json({ error: `Judge0 error: ${text}` }, { status: response.status })
    }

    const result = await response.json()
    return NextResponse.json(result)
  } catch (err) {
    console.error('run-code error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
