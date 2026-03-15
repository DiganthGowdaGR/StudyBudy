import React, { useEffect, useMemo, useState } from 'react'
import ProgressRing from './ProgressRing'

function TrashIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M4.7 5.8h10.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M8 5.8V4.6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M6.2 5.8 6.8 15a1.3 1.3 0 0 0 1.3 1.2h3.8a1.3 1.3 0 0 0 1.3-1.2l.6-9.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M8.6 8.4v5.2M11.4 8.4v5.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function getUniqueSubjects(flashcards) {
  const subjectSet = new Set()
  flashcards.forEach((card) => subjectSet.add(card.subject || 'General'))
  return Array.from(subjectSet)
}

function truncateText(value, maxLength = 96) {
  const text = String(value || '').trim()
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 1)}...`
}

function getDailyGoalTarget(totalCards) {
  if (totalCards <= 0) return 10
  return Math.min(30, Math.max(10, totalCards * 2))
}

export default function FlashcardsView({
  flashcards,
  reviewStats,
  onCreateCard,
  onGenerateAnswer,
  onToggleMastered,
  onMarkReviewed,
  onDeleteCard,
}) {
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [actionMessage, setActionMessage] = useState('')
  const [actionError, setActionError] = useState('')
  const [isGeneratingAnswer, setIsGeneratingAnswer] = useState(false)
  const [form, setForm] = useState({ subject: '', question: '', answer: '' })

  const subjects = useMemo(() => getUniqueSubjects(flashcards), [flashcards])

  const filteredCards = useMemo(() => {
    if (subjectFilter === 'all') return flashcards
    return flashcards.filter((card) => (card.subject || 'General') === subjectFilter)
  }, [flashcards, subjectFilter])

  useEffect(() => {
    setCurrentIndex((prev) => {
      if (filteredCards.length === 0) return 0
      return Math.min(prev, filteredCards.length - 1)
    })
  }, [filteredCards.length])

  const boundedIndex = filteredCards.length > 0
    ? Math.min(currentIndex, filteredCards.length - 1)
    : 0

  const activeCard = filteredCards[boundedIndex] || null
  const masteredCount = flashcards.filter((card) => card.mastered).length
  const masteryPercent = flashcards.length > 0 ? Math.round((masteredCount / flashcards.length) * 100) : 0
  const dailyGoalTarget = getDailyGoalTarget(flashcards.length)
  const dailyGoalPercent = Math.min(100, Math.round((reviewStats.todayReviews / dailyGoalTarget) * 100))

  const handleFlip = () => {
    if (!activeCard) return
    if (!showAnswer) {
      onMarkReviewed(activeCard.id)
    }
    setShowAnswer((prev) => !prev)
    setActionMessage('')
    setActionError('')
  }

  const handleShowFront = () => {
    setShowAnswer(false)
    setActionMessage('')
    setActionError('')
  }

  const handleShowBack = () => {
    if (!activeCard) return
    if (!showAnswer) {
      onMarkReviewed(activeCard.id)
    }
    setShowAnswer(true)
    setActionMessage('')
    setActionError('')
  }

  const handleNext = () => {
    if (filteredCards.length === 0) return
    setCurrentIndex((prev) => (prev + 1) % filteredCards.length)
    setShowAnswer(false)
  }

  const handlePrev = () => {
    if (filteredCards.length === 0) return
    setCurrentIndex((prev) => (prev - 1 + filteredCards.length) % filteredCards.length)
    setShowAnswer(false)
  }

  const handleSelectCard = (index) => {
    if (index < 0 || index >= filteredCards.length) return
    setCurrentIndex(index)
    setShowAnswer(false)
    setActionError('')
    setActionMessage('')
  }

  const handleMastered = async () => {
    if (!activeCard) return

    try {
      await onToggleMastered(activeCard.id)
      setActionMessage(activeCard.mastered ? 'Marked as learning' : 'Marked as mastered')
      setActionError('')
    } catch (err) {
      setActionError(err.message || 'Could not update this card right now.')
      setActionMessage('')
    }
  }

  const handleShare = async () => {
    if (!activeCard) return
    try {
      await navigator.clipboard.writeText(`Q: ${activeCard.question}\nA: ${activeCard.answer}`)
      setActionMessage('Card copied to clipboard.')
      setActionError('')
    } catch {
      setActionError('Clipboard permission blocked. Copy manually.')
      setActionMessage('')
    }
  }

  const handleDelete = async () => {
    if (!activeCard || !onDeleteCard) return

    try {
      await onDeleteCard(activeCard.id)
      setActionMessage('Flashcard deleted.')
      setActionError('')
      setShowAnswer(false)
      setCurrentIndex(0)
    } catch (err) {
      setActionError(err.message || 'Could not delete this card right now.')
      setActionMessage('')
    }
  }

  const handleCreateCard = async (e) => {
    e.preventDefault()
    const payload = {
      subject: (form.subject.trim() || 'General'),
      question: form.question.trim(),
      answer: form.answer.trim(),
    }

    if (!payload.question || !payload.answer) {
      setActionError('Question and answer are required.')
      return
    }

    try {
      await onCreateCard(payload)
      setForm({ subject: '', question: '', answer: '' })
      setShowCreateForm(false)
      setActionMessage('Flashcard created.')
      setActionError('')
      setSubjectFilter('all')
      setCurrentIndex(0)
      setShowAnswer(false)
    } catch (err) {
      setActionError(err.message || 'Could not create flashcard right now.')
      setActionMessage('')
    }
  }

  const handleGenerateAnswer = async () => {
    if (!onGenerateAnswer) return

    const question = form.question.trim()
    if (!question) {
      setActionError('Enter a question first to generate an answer.')
      setActionMessage('')
      return
    }

    try {
      setIsGeneratingAnswer(true)
      setActionError('')
      setActionMessage('')

      const generated = await onGenerateAnswer({
        subject: form.subject.trim() || 'General',
        question,
      })

      const answer = String(generated || '').trim()
      if (!answer) {
        setActionError('AI could not generate an answer. Try rephrasing the question.')
        return
      }

      setForm((prev) => ({ ...prev, answer }))
      setActionMessage('AI answer generated. Review it, then save.')
    } catch (err) {
      setActionError(err.message || 'Could not generate answer right now.')
      setActionMessage('')
    } finally {
      setIsGeneratingAnswer(false)
    }
  }

  return (
    <div className="h-full flex bg-gradient-to-br from-[#070912] via-[#0a0f1e] to-[#0e162c] text-slate-200">
      <aside className="w-56 border-r border-[#131933] bg-[#0a0f1e]/80 backdrop-blur p-4 space-y-4 overflow-y-auto shadow-[inset_-1px_0_0_rgba(99,102,241,0.08)]">
        <section className="rounded-xl border border-[#151c32] bg-gradient-to-b from-[#0f1426] to-[#0b1020] p-4 shadow-[0_12px_28px_rgba(0,0,0,0.4)]">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Your Subjects</p>
          <div className="mt-3 space-y-2">
            <button
              type="button"
              onClick={() => {
                setSubjectFilter('all')
                setCurrentIndex(0)
                setShowAnswer(false)
              }}
              className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-all ${
                subjectFilter === 'all' ? 'bg-indigo-600 text-white shadow-[0_10px_22px_rgba(99,102,241,0.25)]' : 'bg-[#0f1426] text-slate-300 hover:text-white border border-[#1f2744]'
              }`}
            >
              All Subjects ({flashcards.length})
            </button>

            {subjects.length > 0 ? (
              subjects.map((subject) => {
                const count = flashcards.filter((card) => (card.subject || 'General') === subject).length
                return (
                  <button
                    key={subject}
                    type="button"
                    onClick={() => {
                      setSubjectFilter(subject)
                      setCurrentIndex(0)
                      setShowAnswer(false)
                    }}
                    className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-all ${
                      subjectFilter === subject ? 'bg-indigo-600 text-white shadow-[0_10px_22px_rgba(99,102,241,0.25)]' : 'bg-[#0f1426] text-slate-300 hover:text-white border border-[#1f2744]'
                    }`}
                  >
                    {subject} ({count})
                  </button>
                )
              })
            ) : (
              <p className="text-xs text-slate-500 text-center py-1">No subjects yet</p>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-[#151c32] bg-gradient-to-b from-[#0f1426] to-[#0b1020] p-4 shadow-[0_12px_28px_rgba(0,0,0,0.4)]">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Study Progress</p>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-2xl font-bold text-indigo-300">{masteryPercent}%</p>
            <p className="text-xs text-slate-500">Mastery</p>
          </div>
          <p className="text-xs text-slate-400 mt-2">{masteredCount} of {flashcards.length} cards mastered</p>
        </section>

        <section className="rounded-xl border border-[#151c32] bg-gradient-to-b from-[#0f1426] to-[#0b1020] p-4 shadow-[0_12px_28px_rgba(0,0,0,0.4)]">
          <p className="text-xs text-slate-400 uppercase tracking-wider">Current Streak</p>
          <p className="mt-2 text-2xl font-bold text-white">{reviewStats.streakDays} days</p>
          <p className="text-xs text-slate-500 mt-1">Keep reviewing daily to grow mastery.</p>
        </section>
      </aside>

      <main className="flex-1 p-6 overflow-y-auto relative">
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.12) 1px, transparent 1px)',
            backgroundSize: '46px 46px'
          }}
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-3xl font-bold text-white">Flashcards Session</h2>
            <p className="text-sm text-slate-400 mt-1">Active recall mode with minimal distractions.</p>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowCreateForm((prev) => !prev)
              setActionError('')
              setActionMessage('')
            }}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-[0_14px_32px_rgba(99,102,241,0.25)]"
          >
            {showCreateForm ? 'Close Form' : 'New Card'}
          </button>
        </div>

        {showCreateForm && (
          <form onSubmit={handleCreateCard} className="mt-4 rounded-xl border border-[#151c32] bg-gradient-to-r from-[#0f1426] via-[#0f172a] to-[#0b1020] p-4 grid grid-cols-1 md:grid-cols-2 gap-3 shadow-[0_16px_32px_rgba(0,0,0,0.35)]">
            <input
              type="text"
              value={form.subject}
              onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
              placeholder="Subject"
              className="bg-[#0f1426] border border-[#1f2744] rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div />
            <textarea
              value={form.question}
              onChange={(e) => setForm((prev) => ({ ...prev, question: e.target.value }))}
              placeholder="Card question"
              rows={3}
              className="bg-[#0f1426] border border-[#1f2744] rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <textarea
              value={form.answer}
              onChange={(e) => setForm((prev) => ({ ...prev, answer: e.target.value }))}
              placeholder="Card answer"
              rows={3}
              className="bg-[#0f1426] border border-[#1f2744] rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="md:col-span-2 flex items-center justify-between">
              <p className="text-red-400 text-xs">{actionError}</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGenerateAnswer}
                  disabled={isGeneratingAnswer || !onGenerateAnswer}
                  className="px-4 py-2 rounded-lg bg-[#0f1426] border border-[#1f2744] text-slate-200 text-sm hover:text-white disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isGeneratingAnswer ? 'Generating...' : 'AI Generate Answer'}
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm shadow-[0_12px_24px_rgba(99,102,241,0.25)]">
                  Save Card
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="mt-5 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_280px] gap-5 relative z-10">
          <div className="space-y-4">
            <section className="rounded-2xl border border-[#151c32] bg-gradient-to-b from-[#0f1426] to-[#0b0f1e] min-h-[340px] p-5 md:p-6 shadow-[0_16px_36px_rgba(0,0,0,0.4)]">
              {activeCard ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="rounded-md bg-[#0f1426] border border-[#1f2744] px-2 py-1 text-[11px] text-slate-200 uppercase tracking-wider">
                        {activeCard.subject || 'General'}
                      </span>
                      <p className="text-xs text-slate-500">Card {boundedIndex + 1} / {filteredCards.length}</p>
                    </div>
                    <span className={`text-[11px] rounded-md px-2 py-1 border ${activeCard.mastered ? 'bg-emerald-900/30 text-emerald-300 border-emerald-700/50' : 'bg-[#0f1426] text-slate-300 border-[#1f2744]'}`}>
                      {activeCard.mastered ? 'Mastered' : 'Learning'}
                    </span>
                  </div>

                  <div className="mt-4 rounded-xl border border-[#1f2744] bg-[#0b1020] p-4 md:p-5 shadow-[0_12px_26px_rgba(0,0,0,0.35)]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[11px] uppercase tracking-wider text-slate-500">
                        {showAnswer ? 'Back • Answer' : 'Front • Question'}
                      </p>
                      <div className="rounded-lg border border-[#1f2744] bg-[#0f1426] p-1 flex gap-1">
                        <button
                          type="button"
                          onClick={handleShowFront}
                          className={`px-2 py-1 rounded text-xs ${!showAnswer ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:text-white'}`}
                        >
                          Front
                        </button>
                        <button
                          type="button"
                          onClick={handleShowBack}
                          className={`px-2 py-1 rounded text-xs ${showAnswer ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:text-white'}`}
                        >
                          Back
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 min-h-[170px] max-h-[260px] overflow-y-auto pr-1">
                      <p className="text-lg md:text-xl font-semibold text-white leading-relaxed whitespace-pre-wrap break-words">
                        {showAnswer ? activeCard.answer : activeCard.question}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={handlePrev}
                      className="px-3 py-1.5 rounded-lg bg-[#0f1426] border border-[#1f2744] text-slate-200 hover:text-white"
                    >
                      Prev
                    </button>
                    <button
                      type="button"
                      onClick={handleFlip}
                      className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
                    >
                      {showAnswer ? 'Flip to Front' : 'Flip to Back'}
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="px-3 py-1.5 rounded-lg bg-[#0f1426] border border-[#1f2744] text-slate-200 hover:text-white"
                    >
                      Next
                    </button>
                  </div>
                </>
              ) : (
                <div className="h-full grid place-items-center text-center py-12">
                  <div>
                    <p className="text-slate-300">No flashcards yet.</p>
                    <p className="text-slate-500 text-sm mt-1">Create your first card to begin active recall.</p>
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-xl border border-[#151c32] bg-gradient-to-b from-[#0f1426] to-[#0b1020] p-4 shadow-[0_12px_28px_rgba(0,0,0,0.35)]">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-slate-400 uppercase tracking-wider">Card Deck</p>
                <p className="text-xs text-slate-500">{filteredCards.length} cards</p>
              </div>

              {filteredCards.length > 0 ? (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {filteredCards.map((card, index) => (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => handleSelectCard(index)}
                      title={card.question}
                      className={`rounded-lg border p-3 text-left transition-all shadow-[0_10px_24px_rgba(0,0,0,0.3)] ${index === boundedIndex ? 'bg-indigo-600/20 border-indigo-500/50' : 'bg-[#0f1426] border-[#1f2744] hover:border-indigo-500/40'}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-500">#{index + 1}</span>
                        {card.mastered && <span className="text-[10px] text-emerald-300">Mastered</span>}
                      </div>
                      <p className="mt-2 text-[11px] uppercase tracking-wider text-slate-500">{card.subject || 'General'}</p>
                      <p className="mt-1 text-sm text-slate-100 leading-snug">{truncateText(card.question, 84)}</p>
                      <p className="mt-1 text-xs text-slate-500">{truncateText(card.answer, 70)}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 text-center py-3">No cards in this filter.</p>
              )}
            </section>
          </div>

          <aside className="space-y-4">
            <section className="rounded-xl border border-[#151c32] bg-gradient-to-b from-[#0f1426] to-[#0b1020] p-4 shadow-[0_12px_28px_rgba(0,0,0,0.35)]">
              <p className="text-xs text-slate-400 uppercase tracking-wider">Daily Goal</p>
              <div className="mt-3 flex justify-center">
                <ProgressRing
                  value={dailyGoalPercent}
                  size={96}
                  stroke={8}
                  trackClass="stroke-[#2a2b3f]"
                  progressClass="stroke-indigo-500"
                  label="goal"
                />
              </div>
              <p className="text-xs text-center text-slate-400 mt-2">{reviewStats.todayReviews} / {dailyGoalTarget} reviews today</p>
            </section>

            <section className="rounded-xl border border-[#151c32] bg-gradient-to-b from-[#0f1426] to-[#0b1020] p-4 shadow-[0_12px_28px_rgba(0,0,0,0.35)]">
              <p className="text-xs text-slate-400 uppercase tracking-wider">Shortcuts</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button type="button" onClick={handleShowFront} className="rounded-lg bg-[#0f1426] border border-[#1f2744] text-slate-200 text-xs py-2 hover:text-white">Front</button>
                <button type="button" onClick={handleShowBack} className="rounded-lg bg-[#0f1426] border border-[#1f2744] text-slate-200 text-xs py-2 hover:text-white">Back</button>
                <button type="button" onClick={handlePrev} className="rounded-lg bg-[#0f1426] border border-[#1f2744] text-slate-200 text-xs py-2 hover:text-white">Prev</button>
                <button type="button" onClick={handleNext} className="rounded-lg bg-[#0f1426] border border-[#1f2744] text-slate-200 text-xs py-2 hover:text-white">Next</button>
                <button type="button" onClick={handleMastered} className="rounded-lg bg-[#0f1426] border border-[#1f2744] text-slate-200 text-xs py-2 hover:text-white">Mastered</button>
                <button type="button" onClick={handleShare} className="rounded-lg bg-[#0f1426] border border-[#1f2744] text-slate-200 text-xs py-2 hover:text-white">Share</button>
                <button
                  type="button"
                  onClick={handleDelete}
                  title="Delete card"
                  aria-label="Delete card"
                  className="col-span-2 rounded-lg bg-[#2d1020] border border-[#4b1f31] text-red-200 py-2 flex items-center justify-center hover:bg-red-600 hover:text-white"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
              {actionMessage && <p className="text-green-400 text-xs mt-2">{actionMessage}</p>}
              {actionError && <p className="text-red-400 text-xs mt-2">{actionError}</p>}
            </section>
          </aside>
        </div>
      </main>
    </div>
  )
}
