import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function StudentIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-10 w-10 text-indigo-500" aria-hidden="true">
      <path d="m3 9 9-5 9 5-9 5-9-5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M7 11v4.2c0 .8 2 2.8 5 2.8s5-2 5-2.8V11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M21 9v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function TeacherIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-10 w-10 text-emerald-500" aria-hidden="true">
      <path d="M3 20h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M6 20v-9h12v9" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="m4 11 8-6 8 6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M10 14h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function OrganizationIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-10 w-10 text-slate-300" aria-hidden="true">
      <path d="M5 20V6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5V20" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 20h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9 8h1M14 8h1M9 12h1M14 12h1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10.5 20v-3h3v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function PortalCard({ title, description, buttonLabel, onClick, icon, accentClass, hoverGlow }) {
  return (
    <article className={`group relative flex w-[320px] flex-col rounded-2xl border border-[#1C2333] bg-[#0D1117] p-8 shadow-[0_24px_60px_rgba(0,0,0,0.45)] transition-all duration-200 hover:-translate-y-1 ${hoverGlow}`}>
      <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border ${accentClass}`}> 
        {icon}
      </div>
      <h3 className="mt-6 text-center text-2xl font-bold text-white">{title}</h3>
      <p className="mt-3 text-center text-sm leading-6 text-[#94A3B8]">{description}</p>
      <button
        type="button"
        onClick={onClick}
        className="mt-8 w-full rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(99,102,241,0.18)] transition-all duration-200 hover:shadow-[0_0_30px_rgba(99,102,241,0.25)] hover:-translate-y-0.5"
      >
        {buttonLabel}
      </button>
    </article>
  )
}

export default function PortalSelect() {
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'StudyBuddy — Login'
  }, [])

  return (
    <div className="portal-scene relative min-h-screen overflow-hidden bg-[#080B14] px-6 py-10">
      <div className="portal-blob" />
      <div className="portal-grid" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(99,102,241,0.12),transparent_50%),radial-gradient(circle_at_80%_10%,rgba(16,185,129,0.08),transparent_45%)]" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl flex-col items-center justify-center text-center space-y-10">
        <div className="space-y-3">
          <div className="mx-auto flex items-center justify-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] shadow-[0_0_20px_rgba(99,102,241,0.2)]">
              <span className="h-5 w-5 rounded-lg bg-white/90" />
            </span>
            <div className="text-left">
              <p className="text-xl font-bold text-white">StudyBuddy</p>
              <p className="text-sm text-[#4B5563]">Your AI-powered study companion</p>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-[38px] md:text-[52px] font-extrabold text-white leading-[1.1]">
              Your AI tutor that{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #6366F1, #A78BFA)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                never sleeps
              </span>
              .
            </h1>
            <p className="text-[18px] text-[#4B5563] mt-4">Upload your notes. Ask anything. Get smarter every day.</p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
              <div className="flex -space-x-2">
                <span className="h-7 w-7 rounded-full border border-[#0b1020] bg-[#6366F1] text-[10px] font-semibold text-white grid place-items-center">RT</span>
                <span className="h-7 w-7 rounded-full border border-[#0b1020] bg-[#10B981] text-[10px] font-semibold text-white grid place-items-center">AK</span>
                <span className="h-7 w-7 rounded-full border border-[#0b1020] bg-[#F59E0B] text-[10px] font-semibold text-white grid place-items-center">SB</span>
              </div>
              <p className="text-[13px] text-[#374151]">Trusted by students at RIT and beyond</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <PortalCard
            title="Student"
            description="Your personal AI tutor. Upload PDFs, ask questions by voice, take exams and track your progress daily."
            buttonLabel="Login as Student"
            onClick={() => navigate('/student/login')}
            icon={<StudentIcon />}
            accentClass="border-[#6366F1]/40 bg-[#6366F1]/10 text-[#6366F1]"
            hoverGlow="hover:border-[#6366F1] hover:shadow-[0_0_40px_rgba(99,102,241,0.1)]"
          />

          <PortalCard
            title="Teacher"
            description="Create exams, grade submissions, post announcements and watch your students grow."
            buttonLabel="Login as Teacher"
            onClick={() => navigate('/teacher/login')}
            icon={<TeacherIcon />}
            accentClass="border-[#8B5CF6]/40 bg-[#8B5CF6]/10 text-[#8B5CF6]"
            hoverGlow="hover:border-[#8B5CF6] hover:shadow-[0_0_40px_rgba(139,92,246,0.1)]"
          />

          <PortalCard
            title="Organization"
            description="Set up your institution, register teachers, manage subjects and authorize students at scale."
            buttonLabel="Login as Organization"
            onClick={() => navigate('/organization/login')}
            icon={<OrganizationIcon />}
            accentClass="border-[#10B981]/40 bg-[#10B981]/10 text-[#10B981]"
            hoverGlow="hover:border-[#10B981] hover:shadow-[0_0_40px_rgba(16,185,129,0.1)]"
          />
        </div>
      </div>
    </div>
  )
}
