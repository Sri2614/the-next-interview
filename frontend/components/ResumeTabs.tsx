'use client'

import { useState } from 'react'
import type { MockResume } from '@/types/resume'
import ResumeUpload from './ResumeUpload'
import TextResumeInput from './TextResumeInput'
import ResumeSelector from './ResumeSelector'

type Tab = 'upload' | 'text' | 'mock'

interface Props {
  resumes: MockResume[]
}

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'upload', label: 'Upload PDF',     icon: '📄' },
  { id: 'text',   label: 'Paste CV Text',  icon: '📋' },
  { id: 'mock',   label: 'Demo Profiles',  icon: '👤' },
]

export default function ResumeTabs({ resumes }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('upload')

  return (
    <div className="space-y-5">
      {/* Tab row */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap"
            style={
              activeTab === tab.id
                ? { background: 'var(--accent)', color: 'white' }
                : { background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
            }
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'upload' && <ResumeUpload />}
      {activeTab === 'text'   && <TextResumeInput />}
      {activeTab === 'mock'   && <ResumeSelector resumes={resumes} />}
    </div>
  )
}
