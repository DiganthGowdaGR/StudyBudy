import React, { useState, useRef, useEffect } from 'react'
import { api } from '../services/api'
import { voiceKeywords } from '../utils/voiceKeywords'

const MAX_RECORD_MS = 4500
const MIN_TTS_GAP_MS = 1800

function normalizeTime(value, fallback) {
  const raw = String(value || '').trim().toLowerCase().replace(/\./g, '')
  if (!raw) return fallback

  const direct24 = raw.match(/^(\d{1,2}):(\d{2})$/)
  if (direct24) {
    const hours = Number(direct24[1])
    const minutes = Number(direct24[2])
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    }
  }

  const match = raw.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/)
  if (!match) return fallback

  let hours = Number(match[1])
  const minutes = Number(match[2] || 0)
  const meridian = match[3] || ''

  if (Number.isNaN(hours) || Number.isNaN(minutes) || minutes < 0 || minutes > 59) {
    return fallback
  }

  if (meridian === 'pm' && hours < 12) hours += 12
  if (meridian === 'am' && hours === 12) hours = 0

  if (hours < 0 || hours > 23) return fallback
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function addOneHour(time24) {
  const [h, m] = String(time24 || '').split(':').map((part) => Number(part))
  if (Number.isNaN(h) || Number.isNaN(m)) return '10:00'

  const date = new Date()
  date.setHours(h, m, 0, 0)
  date.setHours(date.getHours() + 1)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function formatLocalDate(dateObj) {
  return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`
}

function normalizeScheduleInfo(rawInfo, sourceText = '') {
  const info = rawInfo && typeof rawInfo === 'object' ? rawInfo : {}
  const now = new Date()
  const defaultDate = formatLocalDate(now)
  const plusOneHour = new Date(now.getTime() + (60 * 60 * 1000))
  const defaultStart = `${String(plusOneHour.getHours()).padStart(2, '0')}:${String(plusOneHour.getMinutes()).padStart(2, '0')}`

  const startTime = normalizeTime(info.start_time ?? info.startTime, defaultStart)
  let endTime = normalizeTime(info.end_time ?? info.endTime, addOneHour(startTime))
  if (endTime === startTime) {
    endTime = addOneHour(startTime)
  }

  const rawSubject = String(info.subject || '').trim()
  const subject = rawSubject || 'General'
  const rawTitle = String(info.title || '').trim()
  const title = rawTitle || `${subject} Study Session`
  let date = /^\d{4}-\d{2}-\d{2}$/.test(String(info.date || '').trim())
    ? String(info.date).trim()
    : defaultDate

  const loweredSource = String(sourceText || '').toLowerCase()
  if (/\bday\s+after\s+tomorrow\b/.test(loweredSource)) {
    const d = new Date(now)
    d.setDate(now.getDate() + 2)
    date = formatLocalDate(d)
  } else if (/\btomorrow\b/.test(loweredSource)) {
    const d = new Date(now)
    d.setDate(now.getDate() + 1)
    date = formatLocalDate(d)
  } else if (/\btoday\b|\btonight\b/.test(loweredSource)) {
    date = formatLocalDate(now)
  }

  const priority = String(info.priority || '').toLowerCase() === 'high' ? 'high' : 'normal'

  return {
    title,
    subject,
    date,
    start_time: startTime,
    end_time: endTime,
    priority,
  }
}

function MicIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="9" y="4" width="6" height="10" rx="3" stroke="currentColor" strokeWidth="2" />
      <path d="M6 11a6 6 0 0 0 12 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 17v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M9 20h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function SpeakerIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 10h4l5-4v12l-5-4H4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M17 9a4 4 0 0 1 0 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M19.5 7a7 7 0 0 1 0 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function speakWithBrowserTTS(text, onDone) {
  if (typeof window === 'undefined' || !window.speechSynthesis || typeof SpeechSynthesisUtterance === 'undefined') {
    return false
  }

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 1
  utterance.pitch = 1
  utterance.onend = () => onDone?.()
  utterance.onerror = () => onDone?.()

  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
  return true
}

function parseRetryDelayMs(messageText) {
  const msg = String(messageText || '').toLowerCase()
  const match = msg.match(/try again in\s*(\d+)m(\d+)s/)
  if (!match) return 4 * 60 * 1000

  const mins = Number(match[1])
  const secs = Number(match[2])
  if (Number.isNaN(mins) || Number.isNaN(secs)) return 4 * 60 * 1000
  return ((mins * 60) + secs) * 1000
}

export default function VoiceOrb({ studentId, onResult, speakText, onScheduleCreated }) {
  const [isRecording, setIsRecording] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [voiceError, setVoiceError] = useState('')
  const [contentCenterLeft, setContentCenterLeft] = useState('50vw')
  const mediaRecorder = useRef(null)
  const activeStream = useRef(null)
  const recordTimeout = useRef(null)
  const chunks = useRef([])
  const audioPlayer = useRef(new Audio())
  const ttsInFlightRef = useRef(false)
  const lastTtsAtRef = useRef(0)
  const lastTtsTextRef = useRef('')
  const ttsCooldownUntilRef = useRef(0)

  const clearRecordTimeout = () => {
    if (recordTimeout.current) {
      window.clearTimeout(recordTimeout.current)
      recordTimeout.current = null
    }
  }

  const releaseStream = () => {
    if (activeStream.current) {
      activeStream.current.getTracks().forEach((track) => track.stop())
      activeStream.current = null
    }
  }

  const stopRecordingSession = () => {
    clearRecordTimeout()

    const recorder = mediaRecorder.current
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop()
    }

    setIsRecording(false)
  }

  const handleTTS = async (text) => {
    const normalizedText = String(text || '').trim()
    if (!normalizedText) return

    const now = Date.now()
    const isDuplicate = normalizedText === lastTtsTextRef.current && (now - lastTtsAtRef.current) < 8000
    const tooSoon = (now - lastTtsAtRef.current) < MIN_TTS_GAP_MS
    if (ttsInFlightRef.current || isDuplicate || tooSoon) return

    if (now < ttsCooldownUntilRef.current) {
      setIsSpeaking(true)
      const browserSpoken = speakWithBrowserTTS(normalizedText, () => setIsSpeaking(false))
      if (browserSpoken) {
        console.log('TTS fallback: using device voice')
        lastTtsAtRef.current = now
        lastTtsTextRef.current = normalizedText
      } else {
        setVoiceError('Voice playback failed. Please try again.')
        setIsSpeaking(false)
      }
      return
    }

    ttsInFlightRef.current = true
    setIsSpeaking(true)
    setVoiceError('')

    try {
      const audioUrl = await api.textToSpeech(normalizedText)

      audioPlayer.current.pause()
      audioPlayer.current.currentTime = 0

      audioPlayer.current.onended = null
      audioPlayer.current.onerror = null
      audioPlayer.current.src = audioUrl
      audioPlayer.current.play()
      audioPlayer.current.onended = () => setIsSpeaking(false)
      audioPlayer.current.onerror = () => setIsSpeaking(false)

      lastTtsAtRef.current = Date.now()
      lastTtsTextRef.current = normalizedText
    } catch (err) {
      console.error("TTS failed", err)
      const message = String(err?.message || '').toLowerCase()
      if (message.includes('429') || message.includes('too many requests')) {
        ttsCooldownUntilRef.current = Date.now() + parseRetryDelayMs(err?.message)
        const browserSpoken = speakWithBrowserTTS(normalizedText, () => setIsSpeaking(false))
        if (browserSpoken) {
          console.log('TTS fallback: using device voice')
        } else {
          setVoiceError('Voice playback failed. Please try again.')
        }
      } else {
        const browserSpoken = speakWithBrowserTTS(normalizedText, () => setIsSpeaking(false))
        if (browserSpoken) {
          console.log('TTS fallback: using device voice')
        } else {
          setVoiceError('Voice playback failed. Please try again.')
        }
      }
      if (!window?.speechSynthesis?.speaking) {
        setIsSpeaking(false)
      }
    } finally {
      ttsInFlightRef.current = false
    }
  }

  useEffect(() => {
    return () => {
      clearRecordTimeout()
      releaseStream()

      const recorder = mediaRecorder.current
      if (recorder && recorder.state !== 'inactive') {
        recorder.stop()
      }
    }
  }, [])

  useEffect(() => {
    const anchorSelector = '[data-workspace-center-anchor="true"]'
    let resizeObserver = null
    let retryInterval = null

    const updateCenter = () => {
      const anchor = document.querySelector(anchorSelector)
      if (!anchor) return false

      const rect = anchor.getBoundingClientRect()
      if (rect.width <= 0) return false

      setContentCenterLeft(`${rect.left + (rect.width / 2)}px`)
      return true
    }

    const bindObserver = () => {
      const anchor = document.querySelector(anchorSelector)
      if (!anchor) return false

      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver?.disconnect()
        resizeObserver = new ResizeObserver(() => {
          updateCenter()
        })
        resizeObserver.observe(anchor)
      }

      updateCenter()
      return true
    }

    const onResize = () => {
      updateCenter()
    }

    window.addEventListener('resize', onResize)

    if (!bindObserver()) {
      retryInterval = window.setInterval(() => {
        if (bindObserver()) {
          window.clearInterval(retryInterval)
          retryInterval = null
        }
      }, 250)
    }

    return () => {
      window.removeEventListener('resize', onResize)
      if (retryInterval) {
        window.clearInterval(retryInterval)
      }
      resizeObserver?.disconnect()
    }
  }, [])

  // Handle speakText prop changes
  useEffect(() => {
    if (!speakText) return

    const timerId = window.setTimeout(() => {
      handleTTS(speakText)
    }, 0)

    return () => {
      window.clearTimeout(timerId)
    }
  }, [speakText])

  const toggleRecording = async () => {
    if (isProcessing) return

    if (isRecording) {
      stopRecordingSession()
    } else {
      try {
        if (!studentId) {
          setVoiceError('Student session missing. Please log in again.')
          return
        }

        if (typeof MediaRecorder === 'undefined') {
          setVoiceError('Recording is not supported in this browser.')
          return
        }

        setVoiceError('')

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        activeStream.current = stream
        mediaRecorder.current = new MediaRecorder(stream)
        chunks.current = []

        mediaRecorder.current.ondataavailable = (e) => chunks.current.push(e.data)
        mediaRecorder.current.onstop = async () => {
          clearRecordTimeout()

          const blob = new Blob(chunks.current, { type: 'audio/webm' })
          releaseStream()

          if (!blob.size) {
            setVoiceError('No audio detected. Please try again.')
            return
          }

          setIsProcessing(true)
          await handleSTT(blob)
          setIsProcessing(false)
        }

        mediaRecorder.current.start(250)
        setIsRecording(true)

        clearRecordTimeout()
        recordTimeout.current = window.setTimeout(() => {
          stopRecordingSession()
        }, MAX_RECORD_MS)
      } catch (err) {
        console.error("Mic access failed", err)
        setVoiceError('Microphone access denied or unavailable.')
        releaseStream()
      }
    }
  }

  const handleSTT = async (blob) => {
    try {
      const response = await api.speechToText(blob)
      const text = response.text || response.transcript || ''
      const question = String(text || '').trim()

      if (!question) {
        const fallback = 'I could not hear you clearly. Please try again.'
        setVoiceError(fallback)
        handleTTS(fallback)
        return
      }

      // Check for schedule keywords
      const lowered = question.toLowerCase()
      const isScheduleAction = voiceKeywords.schedule.some(kw => lowered.includes(kw))

      if (isScheduleAction) {
        setIsProcessing(true)
        try {
          // 1. Extract info from LLM
          const { info: rawInfo } = await api.extractChatInfo(studentId, question)
          const info = normalizeScheduleInfo(rawInfo, question)

          // 2. Save to schedule
          const created = await api.createScheduleEvent(studentId, {
            title: info.title,
            subject: info.subject,
            date: info.date,
            startTime: info.start_time,
            endTime: info.end_time,
            priority: info.priority
          })

          if (created?.event && typeof onScheduleCreated === 'function') {
            onScheduleCreated(created.event)
          }
          
          const successMsg = `Perfect! I've scheduled "${info.title}" for ${info.date} at ${info.start_time}.`
          setVoiceError('')
          handleTTS(successMsg)
          onResult({ question, answer: successMsg, chatId: 'action-schedule' })
          return
        } catch (err) {
          console.error("Schedule extraction/save failed", err)
          const fallback = 'I could not schedule that yet. Please say it like: schedule Math tomorrow at 6 PM.'
          setVoiceError(err?.message || 'Failed to save schedule event.')
          handleTTS(fallback)
          onResult({ question, answer: fallback, chatId: 'action-schedule-failed' })
          return
        }
      }

      // Default: Chat
      const { answer, chat_id } = await api.chatQuery(studentId, question, 'voice')
      onResult({ question, answer, chatId: chat_id })
      // Speaking back
      handleTTS(answer)
    } catch (err) {
      console.error("STT/Chat failed", err)
      const fallback = 'I had trouble understanding that. Please try once more.'
      setVoiceError(fallback)
      handleTTS(fallback)
    }
  }

  const isListeningState = isRecording || isProcessing

  function WaveformBars({ color, speed }) {
    const bars = [3, 5, 8, 6, 10, 7, 4, 9, 6, 8, 5, 3]

    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
          height: '40px',
        }}
      >
        {bars.map((h, i) => (
          <div
            key={i}
            style={{
              width: '3px',
              height: `${h * 3}px`,
              background: color,
              borderRadius: '999px',
              animation: `wave ${speed + (i * 0.1)}s ease-in-out infinite alternate`,
              animationDelay: `${i * 0.05}s`,
            }}
          />
        ))}
      </div>
    )
  }

  const orbStateClass = isSpeaking
    ? 'sensei-orb--speaking'
    : isListeningState
      ? 'sensei-orb--listening'
      : 'sensei-orb--idle'

  const statusText = isSpeaking
    ? 'Sensei is speaking...'
    : isListeningState
      ? 'Listening...'
      : 'Ask Sensei'

  const contentAreaCenterLeft = contentCenterLeft
  const isSpeakingState = isSpeaking
  const waveformColor = isSpeakingState ? '#2DD4BF' : '#6366F1'
  const labelText = isSpeakingState
    ? 'Speaking'
    : isListeningState
      ? 'Listening...'
      : 'Ask Sensei'
  const speed = isSpeakingState ? 0.8 : 0.4

  return (
    <>
      <div
        style={{
          position: 'fixed',
          bottom: '80px',
          left: contentAreaCenterLeft,
          transform: 'translateX(-50%)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'rgba(15, 20, 30, 0.85)',
          backdropFilter: 'blur(12px)',
          borderRadius: '999px',
          padding: isListeningState || isSpeakingState ? '12px 20px' : '10px 14px',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        {(isListeningState || isSpeakingState) && (
          <WaveformBars color={waveformColor} speed={speed} />
        )}

        <button
          type="button"
          onClick={toggleRecording}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 0 20px rgba(99,102,241,0.5)',
            flexShrink: 0,
            border: 'none',
            color: '#ffffff',
          }}
          title={statusText}
        >
          {isSpeakingState ? '🔊' : '🎙️'}
        </button>

        {(isListeningState || isSpeakingState) && (
          <WaveformBars color={waveformColor} speed={speed} />
        )}
      </div>

      <div
        style={{
          position: 'fixed',
          bottom: '56px',
          left: contentAreaCenterLeft,
          transform: 'translateX(-50%)',
          fontSize: '11px',
          color: '#4B5563',
          letterSpacing: '0.05em',
          zIndex: 1000,
        }}
      >
        {labelText}
      </div>

      {voiceError && (
        <p
          className="fixed bottom-[30px] z-[1000] max-w-[320px] -translate-x-1/2 text-center text-[11px] text-rose-300 pointer-events-none"
          style={{ left: contentAreaCenterLeft }}
        >
          {voiceError}
        </p>
      )}
    </>
  )
}
