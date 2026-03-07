import React, { useState } from 'react'

export default function Dashboard({ studentName, greeting, documents, sessions, onUpload, onGenerate, onEndSession }) {
  const [sessionForm, setSessionForm] = useState({ topics: '', duration: 30 })
  const [showEndForm, setShowEndForm] = useState(false)

  const handleUpload = (e) => {
    const file = e.target.files[0]
    if (file) onUpload(file)
  }

  return (
    <div className="h-full flex flex-col p-8 space-y-8 overflow-y-auto border-l border-gray-800 bg-gray-900/50">
      
      {/* Welcome Section */}
      <section className="space-y-2">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          👋 Welcome back, {studentName}
        </h2>
        <div className="bg-gray-800/60 p-5 rounded-2xl border border-gray-700/50 italic text-gray-300">
          {greeting || "Loading Sensei's greeting..."}
        </div>
      </section>

      {/* Upload Section */}
      <section className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Resource Manager</p>
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-700 rounded-2xl cursor-pointer hover:bg-gray-800/80 transition-all hover:border-primary-500/50 group">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">📁</span>
            <p className="text-sm text-gray-400">Add Study Material (PDF)</p>
          </div>
          <input type="file" className="hidden" accept="application/pdf" onChange={handleUpload} />
        </label>
      </section>

      {/* Documents List */}
      <section className="space-y-4 flex-1">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500">My Study Vault</p>
        <div className="space-y-3">
          {documents.map((doc, i) => (
            <div key={doc.id} className="p-4 bg-gray-800/40 rounded-xl border border-gray-700 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xl">📄</span>
                <span className="font-medium text-gray-200 truncate flex-1">{doc.filename}</span>
              </div>
              <button 
                onClick={() => onGenerate(doc)}
                className="text-xs bg-primary-600/10 text-primary-400 font-bold py-2 rounded-lg border border-primary-400/20 hover:bg-primary-600/20 transition-all"
              >
                Generate Notes
              </button>
            </div>
          ))}
          {documents.length === 0 && <p className="text-sm text-gray-600 text-center py-4 italic">No documents yet.</p>}
        </div>
      </section>

      {/* Progress Section */}
      <section className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Global Progress</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800 p-4 rounded-xl text-center">
            <p className="text-xs text-gray-500">Sessions</p>
            <p className="text-xl font-bold">{sessions.length}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-xl text-center">
            <p className="text-xs text-gray-500">Streak</p>
            <p className="text-xl font-bold">1 🔥</p>
          </div>
        </div>
      </section>

      {/* End Session */}
      <section className="pt-4 border-t border-gray-800">
        {!showEndForm ? (
          <button 
            onClick={() => setShowEndForm(true)}
            className="w-full py-4 bg-red-600/10 text-red-400 font-bold rounded-xl border border-red-500/20 hover:bg-red-600/20 transition-all"
          >
            End Study Session
          </button>
        ) : (
          <div className="space-y-4 fade-in bg-gray-800/40 p-5 rounded-2xl border border-gray-700">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Topics Covered</label>
              <input 
                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm"
                value={sessionForm.topics}
                onChange={e => setSessionForm({...sessionForm, topics: e.target.value})}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Duration (mins)</label>
              <input 
                type="number"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm"
                value={sessionForm.duration}
                onChange={e => setSessionForm({...sessionForm, duration: e.target.value})}
              />
            </div>
            <button 
              onClick={() => { onEndSession(sessionForm); setShowEndForm(false); }}
              className="w-full py-3 bg-primary-600 text-white font-bold rounded-lg shadow-lg shadow-primary-600/20 active:scale-95 transition-all"
            >
              Save Session
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
