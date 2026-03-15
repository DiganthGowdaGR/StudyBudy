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
        setVoiceError('Cloud voice cooling down. Using device voice temporarily.')
        lastTtsAtRef.current = now
        lastTtsTextRef.current = normalizedText
      } else {
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
          setVoiceError('Cloud voice is rate-limited. Using device voice temporarily.')
        } else {
          setVoiceError('Voice is rate-limited right now. Please try again in a few seconds.')
        }
      } else {
        const browserSpoken = speakWithBrowserTTS(normalizedText, () => setIsSpeaking(false))
        if (browserSpoken) {
          setVoiceError('Cloud voice unavailable. Using device voice temporarily.')
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

  const orbState = isSpeaking
    ? 'speaking'
    : isListeningState
      ? 'listening'
      : 'idle'

  const handleOrbClick = toggleRecording

  return (
    <div style={{
      position: 'fixed',
      bottom: '28px',
      right: '28px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>

      {/* Orb wrapper */}
      <div style={{
        position: 'relative',
        width: '60px',
        height: '60px',
      }}>

        {/* Ripple rings — speaking only */}
        {orbState === 'speaking' && (
          <>
            <div className="ripple-ring-1" />
            <div className="ripple-ring-2" />
            <div className="ripple-ring-3" />
          </>
        )}

        {/* Main orb */}
        <div
          onClick={handleOrbClick}
          className={`orb-main orb-${orbState}`}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleOrbClick()}
        >
          {/* Icon */}
          {orbState === 'idle' && (
            <span style={{ fontSize: '22px', lineHeight: 1, userSelect: 'none', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
              🎙️
            </span>
          )}

          {orbState === 'listening' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              height: '20px',
            }}>
              <div className="bar bar-1" />
              <div className="bar bar-2" />
              <div className="bar bar-3" />
            </div>
          )}

          {orbState === 'speaking' && (
            <span style={{ fontSize: '22px', lineHeight: 1, userSelect: 'none', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
              🔊
            </span>
          )}
        </div>

        {/* Label */}
        <div className={`orb-label orb-label-${orbState}`}>
          {orbState === 'idle' && 'Ask Sensei'}
          {orbState === 'listening' && (
            <>
              <span className="blink-dot" />
              Listening...
            </>
          )}
          {orbState === 'speaking' && 'Sensei is speaking...'}
        </div>

      </div>

      {voiceError && (
        <p style={{
          marginTop: '32px',
          maxWidth: '220px',
          textAlign: 'center',
          fontSize: '11px',
          color: '#fca5a5',
          pointerEvents: 'none',
        }}>{voiceError}</p>
      )}
    </div>
  )
}
