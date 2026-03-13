# The Next Interview - Agent Architecture

## Agent Components

### Overview

| # | Agent | What It Does |
|---|-------|--------------|
| 1 | **Resume Agent** | Reads and understands your resume |
| 2 | **Matching Agent** | Finds the perfect job for your skills |
| 3 | **Preparation Agent** | Creates personalized interview prep |
| 4 | **Review Agent** | Evaluates your practice answers |
| 5 | **Recommendation Agent** | Suggests courses to fill skill gaps |
| 6 | **Readiness Agent** | Tells you if you're interview-ready |

---

## What Each Step Produces

### Step 1: Resume Analysis
```
📄 Input: Your Resume (PDF/Word)
    ↓
🤖 Agent extracts:
    • Technical Skills (Java, Python, K8s...)
    • Years of Experience
    • Projects & Achievements
    • Education & Certifications
    ↓
📋 Output: Candidate Profile
```

### Step 2: Job Matching
```
📋 Input: Your Profile
    ↓
🔍 Agent searches:
    • Available Job Descriptions
    • Skill Requirements Match
    • Experience Level Fit
    ↓
💼 Output: Best Matching Job Vacancy
```

### Step 3: Interview Preparation
```
💼 Input: Matched Job Description
    ↓
📝 Agent generates:
    • Technical Interview Questions
    • Behavioral Questions  
    • System Design Problems
    • Coding Exercises
    ↓
📚 Output: Personalized Prep Materials
```

### Step 4: Practice & Review
```
✍️ Input: Your Answers & Solutions
    ↓
🎯 Agent evaluates:
    • Technical Accuracy
    • Code Quality
    • Problem-Solving Approach
    • Communication Clarity
    ↓
📊 Output: Score + Feedback
```

### Step 5: Recommendations
```
📊 Input: Your Performance Gaps
    ↓
📚 Agent recommends:
    • Udemy Courses
    • Practice Resources
    • Focus Areas
    ↓
🎓 Output: Learning Path
```

### Step 6: Readiness Check
```
📈 Input: All Practice Scores
    ↓
✅ Agent determines:
    • Overall Readiness Score
    • Strengths Summary
    • Remaining Gaps
    ↓
🏆 Output: READY / NOT READY
```

## Example User Journey

```
👤 Sarah uploads her Java Developer resume
         ↓
🔍 Agent matches her to "Senior Java Developer" vacancy
         ↓
📝 Agent generates 20 interview questions + 3 coding exercises
         ↓
✍️ Sarah practices and submits her answers
         ↓
🎯 Agent scores her: 65% (needs improvement in Spring Boot)
         ↓
📚 Agent recommends: "Spring Boot Masterclass" on Udemy
         ↓
📖 Sarah takes the course and practices again
         ↓
🎯 Agent scores her: 85%
         ↓
✅ Agent says: "You're ready for the interview!"
```

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| AI/LLM | OpenAI GPT-4 / Claude |
| Framework | LangChain / LangGraph |
| Backend | Python + FastAPI |
| Frontend | React / Next.js |
| Database | PostgreSQL |
| Vector DB | Pinecone / Chroma |
