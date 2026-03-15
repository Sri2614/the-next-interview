'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Lazy-load Monaco to avoid SSR issues and reduce initial bundle
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div
      className="w-full animate-pulse rounded-lg flex items-center justify-center"
      style={{ height: '100%', minHeight: 200, background: 'var(--code-bg)', border: '1px solid var(--border)' }}
    >
      <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading editor…</span>
    </div>
  ),
})

interface CodeEditorProps {
  value: string
  onChange?: (value: string) => void
  language?: string
  readOnly?: boolean
  height?: string | number
  className?: string
}

// Map our language names to Monaco language IDs
const LANG_MAP: Record<string, string> = {
  python: 'python',
  javascript: 'javascript',
  java: 'java',
  cpp: 'cpp',
  typescript: 'typescript',
}

export default function CodeEditor({
  value,
  onChange,
  language = 'python',
  readOnly = false,
  height = '100%',
  className = '',
}: CodeEditorProps) {
  // Read current theme immediately — avoids the dark flash when in light mode
  const [theme, setTheme] = useState<'vs-dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'vs-dark'
    }
    return 'vs-dark'
  })

  // Keep in sync whenever the user toggles the theme
  useEffect(() => {
    function syncTheme() {
      const t = document.documentElement.getAttribute('data-theme')
      setTheme(t === 'light' ? 'light' : 'vs-dark')
    }
    syncTheme()
    const observer = new MutationObserver(syncTheme)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  const monacoLang = LANG_MAP[language] ?? language

  return (
    <div className={`overflow-hidden rounded-lg ${className}`} style={{ height, border: '1px solid var(--border)' }}>
      <MonacoEditor
        height="100%"
        language={monacoLang}
        value={value}
        theme={theme}
        onChange={(v) => onChange?.(v ?? '')}
        options={{
          readOnly,
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, monospace",
          fontLigatures: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          lineNumbers: 'on',
          renderLineHighlight: 'gutter',
          padding: { top: 12, bottom: 12 },
          wordWrap: 'on',
          tabSize: 2,
          insertSpaces: true,
          automaticLayout: true,
          suggest: { showKeywords: true, showSnippets: true },
          quickSuggestions: { other: true, comments: false, strings: false },
          bracketPairColorization: { enabled: true },
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          scrollbar: {
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
          },
        }}
      />
    </div>
  )
}
