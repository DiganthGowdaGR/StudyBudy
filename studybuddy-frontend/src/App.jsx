import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import PortalSelect from './pages/PortalSelect'
import Landing from './pages/Landing'
import StudentLayout from './components/StudentLayout'
import TeacherLogin from './pages/TeacherLogin'
import TeacherSubjects from './pages/TeacherSubjects'
import OrgView, { OrganizationAdminView } from './pages/OrgView'
import OrganizationLogin from './pages/OrganizationLogin'
import TeacherHome from './pages/TeacherHome'
import MCQExamRoom from './pages/MCQExamRoom'
import WrittenExamRoom from './pages/WrittenExamRoom'
import AuthCallback from './pages/AuthCallback'
import { getTeacherSession } from './utils/teacherSession'
import { getOrganizationSession } from './utils/organizationSession'

function RouteGuardScreen() {
  return <div style={{ height: '100vh', background: '#080B14' }} />
}

function StudentProtectedRoute({ children }) {
  const [checked, setChecked] = useState(false)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    const studentId = localStorage.getItem('student_id')
    setAuthorized(Boolean(studentId))
    setChecked(true)
  }, [])

  if (!checked) return <RouteGuardScreen />
  return authorized ? children : <Navigate to="/student/login" replace />
}

function StudentPublicRoute({ children }) {
  const id = localStorage.getItem('student_id')
  return id ? <Navigate to="/app" replace /> : children
}

function StudentOrgProtectedRoute({ children }) {
  const [checked, setChecked] = useState(false)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    const studentId = localStorage.getItem('student_id')
    setAuthorized(Boolean(studentId))
    setChecked(true)
  }, [])

  if (!checked) return <RouteGuardScreen />
  return authorized ? children : <Navigate to="/" replace />
}

function TeacherProtectedRoute({ children }) {
  const [checked, setChecked] = useState(false)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    const session = getTeacherSession()
    const teacherId = session?.teacher_id || localStorage.getItem('teacher_id')
    setAuthorized(Boolean(teacherId))
    setChecked(true)
  }, [])

  if (!checked) return <RouteGuardScreen />
  return authorized ? children : <Navigate to="/teacher/login" replace />
}

function TeacherPublicRoute({ children }) {
  const session = getTeacherSession()
  if (!session?.teacher_id) return children

  const subjects = Array.isArray(session.subjects) ? session.subjects : []
  if (subjects.length > 1 && !session.active_subject_id) {
    return <Navigate to="/teacher/subjects" replace />
  }

  return <Navigate to="/teacher/home" replace />
}

function OrganizationProtectedRoute({ children }) {
  const [checked, setChecked] = useState(false)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    const session = getOrganizationSession()
    const orgId = session?.org_id
      || localStorage.getItem('org_id')
      || localStorage.getItem('org_name')
      || localStorage.getItem('organizer_id')

    setAuthorized(Boolean(orgId))
    setChecked(true)
  }, [])

  if (!checked) return <RouteGuardScreen />
  return authorized ? children : <Navigate to="/organization/login" replace />
}

function OrganizationPublicRoute({ children }) {
  const session = getOrganizationSession()
  return session?.org_id ? <Navigate to="/organization/home" replace /> : children
}

export default function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PortalSelect />} />
        <Route path="/student/login" element={<StudentPublicRoute><Landing /></StudentPublicRoute>} />
        {/* OAuth callback route finalizes student session after provider redirect. */}
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/app" element={<StudentProtectedRoute><StudentLayout /></StudentProtectedRoute>} />
        <Route path="/app/organizations" element={<StudentProtectedRoute><StudentLayout /></StudentProtectedRoute>} />
        <Route path="/app/library" element={<StudentProtectedRoute><StudentLayout /></StudentProtectedRoute>} />
        <Route path="/app/flashcards" element={<StudentProtectedRoute><StudentLayout /></StudentProtectedRoute>} />
        <Route path="/app/schedule" element={<StudentProtectedRoute><StudentLayout /></StudentProtectedRoute>} />
        <Route path="/app/workspace" element={<StudentProtectedRoute><StudentLayout /></StudentProtectedRoute>} />
        <Route path="/app/organizations/:subjectId" element={<StudentOrgProtectedRoute><OrgView /></StudentOrgProtectedRoute>} />
        <Route path="/app/exam/:examId/mcq" element={<StudentOrgProtectedRoute><MCQExamRoom /></StudentOrgProtectedRoute>} />
        <Route path="/app/exam/:examId/written" element={<StudentOrgProtectedRoute><WrittenExamRoom /></StudentOrgProtectedRoute>} />
        <Route path="/teacher/login" element={<TeacherPublicRoute><TeacherLogin /></TeacherPublicRoute>} />
        <Route path="/teacher/subjects" element={<TeacherProtectedRoute><TeacherSubjects /></TeacherProtectedRoute>} />
        <Route path="/teacher/home" element={<TeacherProtectedRoute><TeacherHome /></TeacherProtectedRoute>} />
        <Route path="/organization/login" element={<OrganizationPublicRoute><OrganizationLogin /></OrganizationPublicRoute>} />
        <Route path="/organization/home" element={<OrganizationProtectedRoute><OrganizationAdminView /></OrganizationProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
