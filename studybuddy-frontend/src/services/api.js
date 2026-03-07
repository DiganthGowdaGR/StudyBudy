const BASE_URL = "http://localhost:8001"

export const api = {
  registerStudent: async (name, email) => {
    const res = await fetch(`${BASE_URL}/api/student/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    })
    if (!res.ok) throw new Error("Registration failed")
    return res.json()
  },

  getMemory: async (student_id) => {
    const res = await fetch(`${BASE_URL}/api/memory/${student_id}`)
    if (!res.ok) throw new Error("Failed to fetch memory")
    return res.json()
  },

  uploadPDF: async (file, student_id) => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("student_id", student_id)
    const res = await fetch(`${BASE_URL}/api/upload`, {
      method: "POST",
      body: formData,
    })
    if (!res.ok) throw new Error("Upload failed")
    return res.json()
  },

  getDocuments: async (student_id) => {
    const res = await fetch(`${BASE_URL}/api/documents/${student_id}`)
    if (!res.ok) throw new Error("Failed to fetch documents")
    return res.json()
  },

  generateNotes: async (student_id, document_id, filename) => {
    const res = await fetch(`${BASE_URL}/api/notes/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_id, document_id, filename }),
    })
    if (!res.ok) throw new Error("Notes generation failed")
    return res.json()
  },

  chatQuery: async (student_id, question) => {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_id, question }),
    })
    if (!res.ok) throw new Error("Chat query failed")
    return res.json()
  },

  speechToText: async (audioBlob) => {
    const formData = new FormData()
    formData.append("file", audioBlob, "audio.webm")
    const res = await fetch(`${BASE_URL}/api/voice/stt`, {
      method: "POST",
      body: formData,
    })
    if (!res.ok) throw new Error("STT failed")
    return res.json()
  },

  textToSpeech: async (text) => {
    const res = await fetch(`${BASE_URL}/api/voice/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    })
    if (!res.ok) throw new Error("TTS failed")
    const blob = await res.blob()
    return URL.createObjectURL(blob)
  },

  saveSession: async (student_id, topics_covered, goals, duration_mins) => {
    const res = await fetch(`${BASE_URL}/api/memory/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_id, topics_covered, goals, duration_mins }),
    })
    if (!res.ok) throw new Error("Session save failed")
    return res.json()
  }
}
