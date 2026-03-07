import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'

export default function Landing() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleStart = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.registerStudent(name, email)
      localStorage.setItem('student_id', res.student_id)
      localStorage.setItem('student_name', res.name)
      navigate('/app')
    } catch (err) {
      setError('Registration failed. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-3xl p-10 shadow-2xl border border-gray-700 fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-600/20">
            <span className="text-3xl font-bold text-white">SB</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">StudyBuddy</h1>
          <p className="text-gray-400">Your AI-powered study companion</p>
        </div>

        <form onSubmit={handleStart} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition-colors"
              placeholder="e.g. Sharath"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition-colors"
              placeholder="sharath@example.com"
            />
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-500 text-white font-bold py-4 rounded-xl transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-primary-600/30"
          >
            {loading ? 'Setting up...' : 'Start Learning'}
          </button>
        </form>
      </div>
    </div>
  )
}
