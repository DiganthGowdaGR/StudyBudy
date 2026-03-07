import React, { useState, useEffect } from 'react'
import Dashboard from '../components/Dashboard'
import A4Sheet from '../components/A4Sheet'
import VoiceOrb from '../components/VoiceOrb'
import { api } from '../services/api'

export default function MainApp() {
  const [student, setStudent] = useState({
    id: localStorage.getItem('student_id'),
    name: localStorage.getItem('student_name')
  })
  const [greeting, setGreeting] = useState("")
  const [documents, setDocuments] = useState([])
  const [sessions, setSessions] = useState([])
  const [activeNotes, setActiveNotes] = useState("")
  const [activeTitle, setActiveTitle] = useState("")
  const [speakText, setSpeakText] = useState("")

  // Initial load
  useEffect(() => {
    if (!student.id) return
    fetchData()
  }, [student.id])

  const fetchData = async () => {
    try {
      const mem = await api.getMemory(student.id)
      setGreeting(mem.greeting)
      setSessions(mem.recent_sessions || [])
      setSpeakText(mem.greeting) // Auto greet

      const docs = await api.getDocuments(student.id)
      setDocuments(docs)
    } catch (err) {
      console.error("Data fetch failed", err)
    }
  }

  const handleUpload = async (file) => {
    try {
      await api.uploadPDF(file, student.id)
      fetchData()
      setSpeakText("Document uploaded successfully! You can now generate notes.")
    } catch (err) {
      console.error("Upload failed", err)
    }
  }

  const handleGenerate = async (doc) => {
    setActiveTitle(doc.filename)
    setActiveNotes("Generating notes, please wait...")
    try {
      const res = await api.generateNotes(student.id, doc.id, doc.filename)
      setActiveNotes(res.notes)
      setSpeakText(`Your notes for ${doc.filename} are ready!`)
    } catch (err) {
      console.error("Notes failed", err)
      setActiveNotes("Error generating notes.")
    }
  }

  const handleChat = async (question) => {
    try {
      const res = await api.chatQuery(student.id, question)
      // Append to notes as a chat bubble style
      setActiveNotes(prev => prev + 
        `\n\n<div class="bg-primary-50 p-6 rounded-xl border-l-4 border-primary-500 my-6 shadow-sm">
          <p class="text-xs font-bold text-primary-600 uppercase mb-2">Sensei Assistant</p>
          ${res.answer}
        </div>`
      )
      setSpeakText(res.answer)
    } catch (err) {
      console.error("Chat failed", err)
    }
  }

  const handleVoiceResult = ({ question, answer }) => {
    setActiveNotes(prev => prev + 
      `\n\n<div class="bg-gray-50 p-6 rounded-xl border-l-4 border-gray-400 my-6 italic">
        <p class="text-xs font-bold text-gray-500 uppercase mb-2">You asked via Voice</p>
        "${question}"
      </div>
      <div class="bg-primary-50 p-6 rounded-xl border-l-4 border-primary-500 my-6 shadow-sm">
        <p class="text-xs font-bold text-primary-600 uppercase mb-2">Sensei Assistant</p>
        ${answer}
      </div>`
    )
  }

  const handleEndSession = async (data) => {
    try {
      await api.saveSession(student.id, [data.topics], "Study session", data.duration)
      setSpeakText("Session saved! Great job today, Sharath. See you tomorrow!")
      fetchData()
    } catch (err) {
      console.error("Session failed", err)
    }
  }

  return (
    <div className="h-screen w-full flex bg-gray-950 overflow-hidden relative">
      <div className="fixed inset-0 bg-blue-500/5 blur-[120px] rounded-full -translate-x-1/2 -translate-y-1/2 scale-150"></div>
      
      {/* Left 70% - Notes Space */}
      <div className="w-[70%] h-full flex flex-col border-r border-gray-800 relative z-10">
        <A4Sheet 
          title={activeTitle} 
          notes={activeNotes} 
          onChat={handleChat} 
        />
      </div>

      {/* Right 30% - Sidebar */}
      <div className="w-[30%] h-full relative z-10">
        <Dashboard 
          studentName={student.name}
          greeting={greeting}
          documents={documents}
          sessions={sessions}
          onUpload={handleUpload}
          onGenerate={handleGenerate}
          onEndSession={handleEndSession}
        />
      </div>

      {/* Center Floating Orb */}
      <VoiceOrb 
        studentId={student.id} 
        onResult={handleVoiceResult}
        speakText={speakText}
      />
    </div>
  )
}
