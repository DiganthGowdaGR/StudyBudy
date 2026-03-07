import React, { useState, useRef, useEffect } from 'react'
import { api } from '../services/api'

export default function VoiceOrb({ studentId, onResult, speakText }) {
  const [isRecording, setIsRecording] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const mediaRecorder = useRef(null)
  const chunks = useRef([])
  const audioPlayer = useRef(new Audio())

  // Handle speakText prop changes
  useEffect(() => {
    if (speakText) {
      handleTTS(speakText)
    }
  }, [speakText])

  const handleTTS = async (text) => {
    if (!text) return
    setIsSpeaking(true)
    try {
      const audioUrl = await api.textToSpeech(text)
      audioPlayer.current.src = audioUrl
      audioPlayer.current.play()
      audioPlayer.current.onended = () => setIsSpeaking(false)
    } catch (err) {
      console.error("TTS failed", err)
      setIsSpeaking(false)
    }
  }

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorder.current.stop()
      setIsRecording(false)
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        mediaRecorder.current = new MediaRecorder(stream)
        chunks.current = []

        mediaRecorder.current.ondataavailable = (e) => chunks.current.push(e.data)
        mediaRecorder.current.onstop = async () => {
          const blob = new Blob(chunks.current, { type: 'audio/webm' })
          handleSTT(blob)
          stream.getTracks().forEach(track => track.stop())
        }

        mediaRecorder.current.start()
        setIsRecording(true)
      } catch (err) {
        console.error("Mic access failed", err)
      }
    }
  }

  const handleSTT = async (blob) => {
    try {
      const { text } = await api.speechToText(blob)
      if (text) {
        // Step 2: Chat
        const { answer } = await api.chatQuery(studentId, text)
        onResult({ question: text, answer })
        // Step 3: Speak back
        handleTTS(answer)
      }
    } catch (err) {
      console.error("STT/Chat failed", err)
    }
  }

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
      <button
        onClick={toggleRecording}
        className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl relative
          ${isRecording ? 'bg-blue-500 shadow-blue-500/50 scale-110' : 
            isSpeaking ? 'bg-green-500 shadow-green-500/50 scale-105' : 
            'bg-gray-800 border-4 border-gray-700 shadow-black/50'}
        `}
      >
        {/* Animated Orbits */}
        {(isRecording || isSpeaking) && (
          <div className={`absolute inset-0 rounded-full animate-ping opacity-30 ${isRecording ? 'bg-blue-400' : 'bg-green-400'}`}></div>
        )}
        
        <div className="relative z-10 flex flex-col items-center">
          <span className="text-3xl">
            {isRecording ? '🎙️' : isSpeaking ? '🔊' : '🤖'}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest mt-1">
            {isRecording ? 'Listening' : isSpeaking ? 'Sensei' : 'Sensei'}
          </span>
        </div>
      </button>
    </div>
  )
}
