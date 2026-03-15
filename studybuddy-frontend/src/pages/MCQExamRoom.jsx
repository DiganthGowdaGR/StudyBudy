import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../services/api'

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function MCQExamRoom() {
  const { examId } = useParams()
  const navigate = useNavigate()
  const studentId = localStorage.getItem('student_id')

  const [exam, setExam] = useState(null)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({}) // { questionId: 'A' | 'B' | 'C' | 'D' }
  const [currentQ, setCurrentQ] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    document.title = 'StudyBuddy — Exam in Progress'
  }, [])

  /* ── Load exam ── */
  useEffect(() => {
    if (!studentId) { navigate('/'); return }
    ;(async () => {
      setLoading(true)
      try {
        const res = await api.getExamDetails(examId)
        if (!res || res.exam_type !== 'mcq') { setError('Invalid MCQ exam.'); return }
        setExam(res)
        setQuestions(Array.isArray(res.questions) ? res.questions : [])
        setTimeLeft((res.duration_mins || 60) * 60)
      } catch (err) {
        setError(err.message || 'Failed to load exam')
      } finally {
        setLoading(false)
      }
    })()
  }, [examId, studentId, navigate])

  /* ── Timer ── */
  useEffect(() => {
    if (!exam || submitted) return
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          handleSubmit(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [exam, submitted])

  const selectOption = (qId, option) => {
    setAnswers((prev) => ({ ...prev, [qId]: option }))
  }

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers])
  const totalQ = questions.length
  const currentQuestion = questions[currentQ]

  const handleSubmit = useCallback(async (autoSubmit = false) => {
    if (submitting || submitted) return
    if (!autoSubmit) { setShowConfirm(true); return }
    setShowConfirm(false)
    setSubmitting(true)
    clearInterval(timerRef.current)
    try {
      const payload = {
        exam_id: examId,
        student_id: studentId,
        answers: questions.map((q) => ({
          question_id: q.id,
          selected_option: answers[q.id] || null,
        })),
      }
      const res = await api.submitMCQExam(payload)
      setResult(res)
      setSubmitted(true)
    } catch (err) {
      setError(err.message || 'Submission failed')
      setSubmitting(false)
    }
  }, [submitting, submitted, examId, studentId, questions, answers])

  const confirmSubmit = () => handleSubmit(true)

  /* ── RENDER ── */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080B14] text-white flex items-center justify-center">
        <div className="sb-spinner" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#080B14] text-white flex items-center justify-center">
        <div className="sb-card max-w-md text-center border-red-400/40">
          <p className="text-sm text-red-200">{error}</p>
          <button onClick={() => navigate(-1)} className="mt-4 sb-btn-secondary text-xs px-4 py-2">Go Back</button>
        </div>
      </div>
    )
  }

  if (submitted && result) {
    return (
      <div className="min-h-screen bg-[#080B14] text-white flex items-center justify-center p-6">
        <div className="sb-card max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center">
            <svg className="w-8 h-8 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Exam Submitted!</h2>
          <p className="text-3xl font-bold text-[#A5B4FC] mb-1">{result.total_score} / {result.total_marks}</p>
          <p className="text-sm text-[#94A3B8] mb-1">{result.correct_count} correct out of {totalQ} questions</p>
          {result.rank && <p className="text-sm text-amber-300 mt-2">Rank: #{result.rank}</p>}
          <button onClick={() => navigate(-1)} className="mt-6 sb-btn-primary text-sm px-6 py-2">Back to Class</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#080B14] text-white flex flex-col">
      <header className="h-14 flex-shrink-0 px-4 flex items-center justify-between bg-[rgba(8,11,20,0.9)] backdrop-blur-xl border-b border-[#1C2333] shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold">{exam?.title || 'MCQ Exam'}</h1>
          <span className="sb-badge" style={{ background: 'rgba(99,102,241,0.12)', color: '#6366F1', borderColor: 'rgba(99,102,241,0.3)' }}>MCQ</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-mono font-semibold px-3 py-1 rounded-lg border ${timeLeft < 300 ? 'text-red-300 border-red-500/40 bg-red-500/10 animate-pulse' : 'text-white border-[#1C2333] bg-[#0F1324]'}`}>
            {formatTime(timeLeft)}
          </span>
          <button onClick={() => handleSubmit(false)} disabled={submitting} className="sb-btn-primary text-xs px-4 py-2 disabled:opacity-50">
            {submitting ? 'Submitting...' : 'Submit Exam'}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-56 border-r border-[#1C2333] bg-[rgba(12,15,25,0.95)] p-4 flex flex-col flex-shrink-0">
          <p className="text-xs text-[#4B5563] mb-3">{answeredCount}/{totalQ} answered</p>
          <div className="grid grid-cols-5 gap-2 flex-1 content-start">
            {questions.map((q, i) => {
              const isAnswered = !!answers[q.id]
              const isCurrent = i === currentQ
              let classes = 'bg-[#0F1324] text-[#4B5563] border border-[#1C2333]'
              if (isCurrent) classes = 'bg-[#6366F1] text-white border border-[#6366F1] shadow-[0_0_18px_rgba(99,102,241,0.35)]'
              else if (isAnswered) classes = 'bg-[rgba(16,185,129,0.12)] text-[#10B981] border border-[rgba(16,185,129,0.25)]'
              return (
                <button key={q.id} onClick={() => setCurrentQ(i)} className={`rounded-lg w-10 h-10 text-xs font-semibold transition-all ${classes}`}>
                  {i + 1}
                </button>
              )
            })}
          </div>
          <div className="mt-4 space-y-1 text-[11px] text-[#4B5563]">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[rgba(16,185,129,0.25)] border border-[rgba(16,185,129,0.35)] inline-block" /> Answered</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[#0F1324] border border-[#1C2333] inline-block" /> Not answered</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[#6366F1] inline-block" /> Current</div>
          </div>
        </aside>

        <main className="flex-1 p-6 overflow-y-auto">
          {currentQuestion && (
            <div className="max-w-2xl mx-auto">
              <p className="text-xs text-[#4B5563] mb-2">Question {currentQ + 1} of {totalQ} · {currentQuestion.marks || 1} mark(s)</p>
              <h2 className="text-lg font-semibold text-white mb-6">{currentQuestion.question_text}</h2>

              <div className="space-y-3">
                {['A', 'B', 'C', 'D'].map((opt) => {
                  const optKey = `option_${opt.toLowerCase()}`
                  const isSelected = answers[currentQuestion.id] === opt
                  return (
                    <button
                      key={opt}
                      onClick={() => selectOption(currentQuestion.id, opt)}
                      className={`w-full text-left rounded-xl border p-4 transition-all ${
                        isSelected
                          ? 'border-[#6366F1] bg-[rgba(99,102,241,0.12)] text-white shadow-[0_0_18px_rgba(99,102,241,0.15)]'
                          : 'border-[#1C2333] bg-[#0F1324] text-[#CBD5E1] hover:border-[#6366F1]/70 hover:-translate-y-0.5'
                      }`}
                    >
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full mr-3 text-sm font-semibold ${
                        isSelected ? 'bg-[#6366F1] text-white' : 'bg-[#111827] text-[#4B5563] border border-[#1C2333]'
                      }`}>{opt}</span>
                      {currentQuestion[optKey] || ''}
                    </button>
                  )
                })}
              </div>

              <div className="flex justify-between mt-8">
                <button onClick={() => setCurrentQ(Math.max(0, currentQ - 1))} disabled={currentQ === 0} className="sb-btn-secondary text-xs px-4 py-2 disabled:opacity-40">
                  Previous
                </button>
                {currentQ < totalQ - 1 ? (
                  <button onClick={() => setCurrentQ(currentQ + 1)} className="sb-btn-primary text-xs px-4 py-2">
                    Next
                  </button>
                ) : (
                  <button onClick={() => handleSubmit(false)} disabled={submitting} className="sb-btn-primary text-xs px-4 py-2 disabled:opacity-50">
                    Finish & Submit
                  </button>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="sb-card max-w-sm w-full">
            <h3 className="text-base font-semibold text-white mb-2">Submit Exam?</h3>
            <p className="text-sm text-[#94A3B8] mb-1">You have answered {answeredCount} of {totalQ} questions.</p>
            {answeredCount < totalQ && (
              <p className="text-sm text-amber-300 mb-3">{totalQ - answeredCount} question(s) unanswered!</p>
            )}
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowConfirm(false)} className="sb-btn-secondary flex-1 text-xs px-3 py-2">Cancel</button>
              <button onClick={confirmSubmit} className="sb-btn-primary flex-1 text-xs px-3 py-2">Yes, Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
