import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'

function normalizeEnrollmentRow(row) {
  const subject = row?.subject || {}
  const teacher = row?.teacher || {}
  const organization = row?.organization || {}

  return {
    enrollmentId: String(row?.enrollment_id || row?.id || ''),
    status: String(row?.status || 'pending').toLowerCase(),
    requestedAt: row?.requested_at || '',
    subjectId: String(subject?.id || ''),
    subjectName: String(subject?.name || 'Subject'),
    subjectCode: String(subject?.subject_code || ''),
    teacherName: String(teacher?.full_name || 'Unassigned'),
    orgName: String(organization?.name || ''),
  }
}

function statusBadge(status) {
  if (status === 'approved')
    return <span className="rounded-full border border-emerald-700 bg-emerald-900/30 px-2 py-0.5 text-xs text-emerald-300">Approved</span>
  if (status === 'rejected')
    return <span className="rounded-full border border-rose-700 bg-rose-900/20 px-2 py-0.5 text-xs text-rose-300">Rejected</span>
  return <span className="rounded-full border border-amber-700 bg-amber-900/25 px-2 py-0.5 text-xs text-amber-300">Pending</span>
}

export default function OrganizationsView({ studentName }) {
  const navigate = useNavigate()
  const studentId = localStorage.getItem('student_id')

  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [subjectCode, setSubjectCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')

  const loadSubjects = useCallback(async () => {
    if (!studentId) return
    setLoading(true)
    try {
      const res = await api.getStudentSubjects(studentId)
      const rows = Array.isArray(res?.subjects) ? res.subjects : []
      setSubjects(rows.map(normalizeEnrollmentRow).filter((r) => r.subjectId))
    } catch {
      setSubjects([])
    } finally {
      setLoading(false)
    }
  }, [studentId])

  useEffect(() => { loadSubjects() }, [loadSubjects])

  const handleJoin = async (e) => {
    e.preventDefault()
    if (!subjectCode.trim()) { setError('Subject code is required.'); return }
    if (!studentId) return

    setJoining(true)
    setError('')
    setFeedback('')
    try {
      const res = await api.joinSubject(subjectCode.trim().toUpperCase(), studentId)
      const name = res?.subject?.name || 'Class'
      setFeedback(`Request sent for ${name}.`)
      setSubjectCode('')
      await loadSubjects()
    } catch (err) {
      setError(err.message || 'Failed to join class.')
    } finally {
      setJoining(false)
    }
  }

  const approvedCount = useMemo(() => subjects.filter((r) => r.status === 'approved').length, [subjects])

  return (
    <div className="h-full overflow-y-auto bg-[#080B14] p-6 pb-24 text-[#94A3B8]">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="sb-card flex flex-wrap items-start justify-between gap-4 bg-gradient-to-br from-[rgba(99,102,241,0.08)] to-transparent">
          <div className="space-y-2">
            <span className="sb-badge" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366F1', borderColor: 'rgba(99,102,241,0.22)' }}>MY CLASSES</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white">Welcome, {studentName || 'Student'}</h2>
            <p className="text-sm text-[#4B5563]">Join with subject codes and access enrolled classes.</p>
          </div>
          <button type="button" onClick={loadSubjects} className="sb-btn-secondary text-sm px-4 py-2">Refresh</button>
        </div>

        <div className="grid gap-5 xl:grid-cols-3">
          <section className="sb-card space-y-4 xl:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="sb-eyebrow">Join a Class</p>
                <p className="text-xs text-[#4B5563]">Use the subject code from your teacher.</p>
              </div>
              <span className="sb-badge" style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981', borderColor: 'rgba(16,185,129,0.25)' }}>{approvedCount} approved</span>
            </div>

            <form onSubmit={handleJoin} className="space-y-3">
              <input
                type="text"
                value={subjectCode}
                onChange={(e) => setSubjectCode(e.target.value.toUpperCase())}
                placeholder="e.g. MATH-2048"
                style={{ textTransform: 'uppercase' }}
                className="sb-input w-full font-mono tracking-[0.15em]"
              />

              {error && <p className="text-xs text-red-400">{error}</p>}
              {feedback && <p className="text-xs text-emerald-300">{feedback}</p>}

              <button type="submit" disabled={joining} className="sb-btn-primary w-full text-sm py-2.5 disabled:opacity-60">
                {joining ? 'Requesting…' : 'Request to Join'}
              </button>
            </form>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-[#1C2333] bg-[#0F1324] p-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#4B5563]">Approved</p>
                <p className="mt-2 text-2xl font-bold text-white">{approvedCount}</p>
              </div>
              <div className="rounded-xl border border-[#1C2333] bg-[#0F1324] p-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#4B5563]">Total</p>
                <p className="mt-2 text-2xl font-bold text-white">{subjects.length}</p>
              </div>
            </div>
          </section>

          <section className="sb-card xl:col-span-2 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="sb-eyebrow">Enrolled Classes</p>
                <p className="text-xs text-[#4B5563]">Review status and jump into class spaces.</p>
              </div>
              <p className="text-xs text-[#4B5563]">{approvedCount} approved</p>
            </div>

            <div className="space-y-3">
              {loading ? (
                <div className="flex min-h-[200px] items-center justify-center">
                  <div className="sb-spinner" />
                </div>
              ) : subjects.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#1C2333] bg-[#0D1117] px-5 py-10 text-center">
                  <p className="text-4xl" aria-hidden="true">🏫</p>
                  <p className="mt-3 text-lg font-semibold text-white">No classes yet</p>
                  <p className="text-sm text-[#4B5563] mt-2">Enter a subject code from your teacher to join your first class</p>
                  <p className="text-sm text-[#4B5563] mt-1">→ Use the Join a Class panel on the left</p>
                </div>
              ) : (
                subjects.map((item) => (
                  <article
                    key={item.enrollmentId || item.subjectId}
                    className="rounded-xl border border-[#1C2333] bg-[#0F1324] p-4 transition-all hover:border-[#6366F1]/70 hover:-translate-y-0.5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h4 className="text-base font-semibold text-white">{item.subjectName}</h4>
                        <p className="text-xs text-[#6366F1] mt-0.5">{item.subjectCode}</p>
                        <div className="mt-2 space-y-0.5 text-xs text-[#4B5563]">
                          <p>Teacher: {item.teacherName}</p>
                          {item.orgName && <p>Organization: {item.orgName}</p>}
                        </div>
                      </div>
                      {statusBadge(item.status)}
                    </div>

                    {item.status === 'approved' && (
                      <button
                        type="button"
                        onClick={() => navigate(`/app/organizations/${item.subjectId}`)}
                        className="mt-4 sb-btn-secondary text-xs px-3 py-2"
                      >
                        Open Class
                      </button>
                    )}
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
