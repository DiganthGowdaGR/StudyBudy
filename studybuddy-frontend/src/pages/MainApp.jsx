import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import HomeView from '../components/HomeView'
import WorkspaceView from '../components/WorkspaceView'
import LibraryView from '../components/LibraryView'
import FlashcardsView from '../components/FlashcardsView'
import ScheduleView from '../components/ScheduleView'
import OrganizationsView from '../components/OrganizationsView'
import VoiceOrb from '../components/VoiceOrb'
import FaceDetectionPip from '../components/FaceDetectionPip'
import { startFaceDetection, stopFaceDetection } from '../utils/faceDetection'
import { getEmotionResponse } from '../utils/emotionReactions'
import { api } from '../services/api'

function SidebarHomeIcon({ className = 'h-[18px] w-[18px]' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="m3 12 2-2 7-7 7 7 2 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SidebarClassesIcon({ className = 'h-[18px] w-[18px]' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="m3 9 9-5 9 5-9 5-9-5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M7 11v4.2c0 .8 2 2.8 5 2.8s5-2 5-2.8V11" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M21 9v5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

function SidebarLibraryIcon({ className = 'h-[18px] w-[18px]' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M6.5 4h10A1.5 1.5 0 0 1 18 5.5v13A1.5 1.5 0 0 1 16.5 20h-10A1.5 1.5 0 0 1 5 18.5v-13A1.5 1.5 0 0 1 6.5 4Z" stroke="currentColor" strokeWidth="1.7" />
      <path d="M9 8h6M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

function SidebarFlashcardsIcon({ className = 'h-[18px] w-[18px]' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="4" y="7" width="13" height="10" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M9 5h9a2 2 0 0 1 2 2v8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M8 11h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

function SidebarScheduleIcon({ className = 'h-[18px] w-[18px]' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 3v4M16 3v4M4 9h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M8.5 13h.01M12 13h.01M15.5 13h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function SidebarSenseiIcon({ className = 'h-[18px] w-[18px]' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="9" y="4" width="6" height="10" rx="3" stroke="currentColor" strokeWidth="1.7" />
      <path d="M6 11a6 6 0 0 0 12 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M12 17v3M9 20h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

function SidebarLogoutIcon({ className = 'h-[18px] w-[18px]' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M10 5.5V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="m14 12-9 0M8 9l-3 3 3 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function TopBarBellIcon({ className = 'h-[18px] w-[18px]' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M6.5 9.5a5.5 5.5 0 1 1 11 0v4.3l1.5 2.2H5l1.5-2.2V9.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M10 18a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

function SidebarBrandIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M6 6.5A2.5 2.5 0 0 1 8.5 4h8A1.5 1.5 0 0 1 18 5.5V18a1.5 1.5 0 0 1-1.5 1.5h-8A2.5 2.5 0 0 0 6 22V6.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M6 7.5A2.5 2.5 0 0 1 8.5 5H18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M10 9h4M10 12h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

function SidebarMenuIcon({ className = 'h-4.5 w-4.5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

const TAB_ITEMS = [
  { id: 'home', label: 'Home', Icon: SidebarHomeIcon, path: '/app' },
  { id: 'organizations', label: 'My Classes', Icon: SidebarClassesIcon, path: '/app/organizations' },
  { id: 'library', label: 'Library', Icon: SidebarLibraryIcon, path: '/app/library' },
  { id: 'flashcards', label: 'Flashcards', Icon: SidebarFlashcardsIcon, path: '/app/flashcards' },
  { id: 'schedule', label: 'Schedule', Icon: SidebarScheduleIcon, path: '/app/schedule' },
]

const TAB_TITLES = {
  home: 'Home',
  organizations: 'My Classes',
  library: 'Library',
  flashcards: 'Flashcards',
  schedule: 'Schedule',
  workspace: 'Talk to Sensei',
}

function getTabFromPath(pathname) {
  const path = String(pathname || '')
  if (path === '/app/organizations') return 'organizations'
  if (path === '/app/library') return 'library'
  if (path === '/app/flashcards') return 'flashcards'
  if (path === '/app/schedule') return 'schedule'
  if (path === '/app/workspace') return 'workspace'
  return 'home'
}

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function calculateStreak(history) {
  let streak = 0
  const cursor = new Date()

  while (true) {
    const key = cursor.toISOString().slice(0, 10)
    if ((history[key] || 0) > 0) {
      streak += 1
      cursor.setDate(cursor.getDate() - 1)
      continue
    }
    break
  }

  return streak
}

function mapFlashcardFromApi(row) {
  return {
    id: String(row.id),
    subject: row.subject || 'General',
    question: row.question || '',
    answer: row.answer || '',
    mastered: Boolean(row.mastered),
    createdAt: row.created_at || new Date().toISOString(),
  }
}

function normalizeTime(value, fallback) {
  if (!value) return fallback
  const text = String(value)
  return text.length >= 5 ? text.slice(0, 5) : fallback
}

function mapScheduleEventFromApi(row) {
  const safeSubject = row.subject || 'General'
  const safeTitle = row.title || `${safeSubject} Study Session`

  return {
    id: String(row.id),
    title: safeTitle,
    subject: safeSubject,
    date: String(row.date || ''),
    startTime: normalizeTime(row.start_time, '09:00'),
    endTime: normalizeTime(row.end_time, '10:00'),
    priority: row.priority || 'normal',
  }
}

function sortScheduleEvents(a, b) {
  if (a.date !== b.date) return a.date.localeCompare(b.date)
  return a.startTime.localeCompare(b.startTime)
}

export default function MainApp() {
  const navigate = useNavigate()
  const location = useLocation()
  const studentId = localStorage.getItem('student_id')
  const storageSuffix = studentId || 'guest'
  const activeWorkspaceStorageKey = `studybuddy_active_workspace_${storageSuffix}`

  const [student] = useState({
    id: studentId,
    name: localStorage.getItem('student_name'),
  })
  const studentName = student.name || 'Student'

  const [activeTab, setActiveTab] = useState(() => getTabFromPath(location.pathname))
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [greeting, setGreeting] = useState('')
  const [documents, setDocuments] = useState([])

  const [sessions, setSessions] = useState([])
  const [speakText, setSpeakText] = useState('')
  const captureVideoRef = useRef(null)
  const previewVideoRef = useRef(null)
  const cameraStreamRef = useRef(null)
  const lastReactedEmotionRef = useRef(null)

  const [workspaces, setWorkspaces] = useState([])
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(() =>
    localStorage.getItem(activeWorkspaceStorageKey) || ''
  )
  const [workspaceStates, setWorkspaceStates] = useState({})
  const [workspaceResources, setWorkspaceResources] = useState({})

  const [flashcards, setFlashcards] = useState([])
  const [flashStats, setFlashStats] = useState({ history: {} })
  const [customEvents, setCustomEvents] = useState([])
  const [talkHistory, setTalkHistory] = useState([])
  const [faceDetectionOn, setFaceDetectionOn] = useState(false)
  const [currentEmotion, setCurrentEmotion] = useState('neutral')
  const [lastReactedEmotion, setLastReactedEmotion] = useState(null)
  const [faceDetectionError, setFaceDetectionError] = useState('')
  const isWorkspaceTab = activeTab === 'workspace'

  const activeWorkspace = useMemo(
    () => workspaces.find((workspace) => String(workspace.id) === String(activeWorkspaceId)) || workspaces[0] || null,
    [workspaces, activeWorkspaceId]
  )

  const activeWorkspaceState = useMemo(() => {
    if (!activeWorkspace?.id) return {}
    return workspaceStates[activeWorkspace.id] || {}
  }, [workspaceStates, activeWorkspace])

  const activeWorkspaceDocumentIds = useMemo(() => {
    if (!activeWorkspace?.id) return []
    const ids = workspaceResources[activeWorkspace.id]
    return Array.isArray(ids) ? ids.map((id) => String(id)) : []
  }, [workspaceResources, activeWorkspace])

  const hasAnyWorkspaceLinks = useMemo(
    () => Object.values(workspaceResources).some((ids) => Array.isArray(ids) && ids.length > 0),
    [workspaceResources]
  )

  const workspaceDocuments = useMemo(() => {
    if (activeWorkspaceDocumentIds.length === 0) {
      // Legacy fallback: show global resources until workspace links exist.
      if (!hasAnyWorkspaceLinks) return documents
      return []
    }
    return documents.filter((doc) => activeWorkspaceDocumentIds.includes(String(doc.id)))
  }, [documents, activeWorkspaceDocumentIds, hasAnyWorkspaceLinks])

  const activeTitle = activeWorkspaceState.activeTitle || `${activeWorkspace?.name || 'Workspace'} Notes`
  const activeNotes = activeWorkspaceState.activeNotes || ''
  const chatMessages = Array.isArray(activeWorkspaceState.chatMessages)
    ? activeWorkspaceState.chatMessages
    : []

  const reviewStats = useMemo(() => {
    const history = flashStats.history || {}
    const todayReviews = history[todayKey()] || 0
    const streakDays = calculateStreak(history)
    return { todayReviews, streakDays, history }
  }, [flashStats])

  useEffect(() => {
    setActiveTab(getTabFromPath(location.pathname))
    setMobileSidebarOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!activeWorkspaceId) return
    localStorage.setItem(activeWorkspaceStorageKey, String(activeWorkspaceId))
  }, [activeWorkspaceStorageKey, activeWorkspaceId])

  const syncWorkspaceStates = useCallback((nextWorkspaces, greetingText) => {
    setWorkspaceStates((prev) => {
      const next = {}

      nextWorkspaces.forEach((workspace) => {
        const id = String(workspace.id)
        const existing = prev[id] || {}
        next[id] = {
          activeTitle: existing.activeTitle || `${workspace.name} Notes`,
          activeNotes: existing.activeNotes || '',
          chatMessages: Array.isArray(existing.chatMessages)
            ? existing.chatMessages
            : greetingText
              ? [{ id: `greeting-${id}`, role: 'assistant', content: greetingText }]
              : [],
        }
      })

      return next
    })
  }, [])

  const fetchData = useCallback(async () => {
    const [
      memoryResult,
      documentsResult,
      workspacesResult,
      workspaceLinksResult,
      flashcardsResult,
      flashStatsResult,
      scheduleResult,
      talksResult,
    ] = await Promise.allSettled([
      api.getMemory(student.id),
      api.getDocuments(student.id),
      api.getWorkspaces(student.id),
      api.getWorkspaceDocumentLinks(student.id),
      api.getFlashcards(student.id),
      api.getFlashcardReviewStats(student.id),
      api.getScheduleEvents(student.id),
      api.getTalks(student.id, 100),
    ])

    let greetingText = ''

    if (memoryResult.status === 'fulfilled') {
      const mem = memoryResult.value
      greetingText = mem.greeting || ''
      setGreeting(greetingText)
      setSessions(mem.recent_sessions || [])
      setSpeakText(greetingText || '')
    } else {
      console.error('Memory fetch failed', memoryResult.reason)
    }

    if (documentsResult.status === 'fulfilled') {
      const docs = Array.isArray(documentsResult.value) ? documentsResult.value : []
      setDocuments(docs)
    } else {
      console.error('Documents fetch failed', documentsResult.reason)
    }

    if (workspacesResult.status === 'fulfilled') {
      const rows = Array.isArray(workspacesResult.value?.workspaces)
        ? workspacesResult.value.workspaces
        : []

      const normalized = rows.map((workspace) => ({
        ...workspace,
        id: String(workspace.id),
      }))

      setWorkspaces(normalized)
      syncWorkspaceStates(normalized, greetingText)

      setActiveWorkspaceId((prev) => {
        if (normalized.length === 0) return ''
        if (normalized.some((workspace) => String(workspace.id) === String(prev))) {
          return String(prev)
        }
        return String(normalized[0].id)
      })
    } else {
      console.error('Workspaces fetch failed', workspacesResult.reason)
    }

    if (workspaceLinksResult.status === 'fulfilled') {
      const links = Array.isArray(workspaceLinksResult.value?.links)
        ? workspaceLinksResult.value.links
        : []

      const mapping = {}
      links.forEach((link) => {
        const workspaceId = String(link.workspace_id)
        const documentId = String(link.document_id)
        if (!mapping[workspaceId]) mapping[workspaceId] = []
        if (!mapping[workspaceId].includes(documentId)) {
          mapping[workspaceId].push(documentId)
        }
      })

      setWorkspaceResources(mapping)
    } else {
      console.error('Workspace resource links fetch failed', workspaceLinksResult.reason)
    }

    if (flashcardsResult.status === 'fulfilled') {
      const rows = Array.isArray(flashcardsResult.value?.flashcards)
        ? flashcardsResult.value.flashcards
        : []
      setFlashcards(rows.map(mapFlashcardFromApi))
    } else {
      console.error('Flashcards fetch failed', flashcardsResult.reason)
    }

    if (flashStatsResult.status === 'fulfilled') {
      setFlashStats({ history: flashStatsResult.value?.history || {} })
    } else {
      console.error('Flashcard review stats fetch failed', flashStatsResult.reason)
    }

    if (scheduleResult.status === 'fulfilled') {
      const rows = Array.isArray(scheduleResult.value?.events)
        ? scheduleResult.value.events
        : []
      setCustomEvents(rows.map(mapScheduleEventFromApi).sort(sortScheduleEvents))
    } else {
      console.error('Schedule events fetch failed', scheduleResult.reason)
    }

    if (talksResult.status === 'fulfilled') {
      const rows = Array.isArray(talksResult.value?.talks)
        ? talksResult.value.talks
        : []
      setTalkHistory(rows)
    } else {
      console.error('Talk history fetch failed', talksResult.reason)
    }


  }, [student.id, syncWorkspaceStates])

  useEffect(() => {
    if (!student.id) return

    const timerId = window.setTimeout(() => {
      fetchData()
    }, 0)

    return () => {
      window.clearTimeout(timerId)
    }
  }, [student.id, fetchData])

  useEffect(() => {
    return () => {
      stopFaceDetection(cameraStreamRef.current, captureVideoRef)
      cameraStreamRef.current = null
    }
  }, [])

  useEffect(() => {
    const previewVideo = previewVideoRef.current
    if (!previewVideo) return

    if (faceDetectionOn && cameraStreamRef.current) {
      previewVideo.srcObject = cameraStreamRef.current
      previewVideo.play().catch(() => {})
      return
    }

    previewVideo.srcObject = null
  }, [faceDetectionOn])

  const updateActiveWorkspaceState = useCallback((updater) => {
    if (!activeWorkspace?.id) return

    setWorkspaceStates((prev) => {
      const current = prev[activeWorkspace.id] || {
        activeTitle: `${activeWorkspace.name} Notes`,
        activeNotes: '',
        chatMessages: [],
      }

      const nextState = typeof updater === 'function' ? updater(current) : updater
      return {
        ...prev,
        [activeWorkspace.id]: {
          ...current,
          ...nextState,
        },
      }
    })
  }, [activeWorkspace])

  const handleUpload = async (file, options = {}) => {
    const { assignToActiveWorkspace = false } = options

    try {
      const result = await api.uploadPDF(file, student.id)
      const uploadedDocId = String(result.document_id || `doc-${Date.now()}`)

      setDocuments((prev) => {
        const uploadedDoc = {
          id: uploadedDocId,
          filename: result.filename || file.name,
          summary: result.summary || '',
          upload_time: new Date().toISOString(),
        }

        const alreadyExists = prev.some((doc) => String(doc.id) === uploadedDocId)
        if (alreadyExists) return prev
        return [uploadedDoc, ...prev]
      })

      if (assignToActiveWorkspace && activeWorkspace?.id) {
        await api.assignDocumentToWorkspace(student.id, activeWorkspace.id, uploadedDocId)

        setWorkspaceResources((prev) => {
          const current = Array.isArray(prev[activeWorkspace.id]) ? prev[activeWorkspace.id] : []
          if (current.some((id) => String(id) === uploadedDocId)) return prev
          return {
            ...prev,
            [activeWorkspace.id]: [...current, uploadedDocId],
          }
        })
      }

      await fetchData()
      setSpeakText('Document uploaded successfully! You can now generate notes.')
      return result
    } catch (err) {
      console.error('Upload failed', err)
      throw err
    }
  }

  const handleGenerate = async (doc) => {
    updateActiveWorkspaceState({
      activeTitle: doc.filename,
      activeNotes: 'Generating notes, please wait...',
    })

    try {
      const res = await api.generateNotes(student.id, doc.id, doc.filename)
      updateActiveWorkspaceState({
        activeTitle: doc.filename,
        activeNotes: res.notes,
      })

      setSpeakText(`Your notes for ${doc.filename} are ready!`)
      setActiveTab('workspace')
      navigate('/app/workspace')
      return res
    } catch (err) {
      console.error('Notes failed', err)
      updateActiveWorkspaceState({ activeNotes: 'Error generating notes.' })
      throw err
    }
  }

  const handleSearchNotes = async (query, searchType) => {
    const normalizedQuery = String(query || '').trim()
    if (!normalizedQuery) return null

    const searchLabel = searchType === 'research' ? 'Fast Research' : 'Web Search'

    try {
      const res = await api.generateNotes(student.id, null, null, {
        query: normalizedQuery,
        search_type: searchType,
      })

      const sectionBody = String(res?.notes || 'No results were returned for this search.')
      const searchSection = [`### ${searchLabel}: ${normalizedQuery}`, '', sectionBody].join('\n')

      updateActiveWorkspaceState((current) => {
        const previousNotes = String(current.activeNotes || '').trim()
        return {
          activeNotes: previousNotes
            ? `${previousNotes}\n\n---\n\n${searchSection}`
            : searchSection,
        }
      })

      setSpeakText(`Search results for ${normalizedQuery} are ready!`)
      return res
    } catch (err) {
      console.error('Search failed', err)
      updateActiveWorkspaceState({ activeNotes: 'Error fetching search results.' })
      throw err
    }
  }

  const handleDeleteDocument = async (doc) => {
    if (!doc?.id) return

    await api.deleteDocument(student.id, doc.id)

    setDocuments((prev) => prev.filter((item) => String(item.id) !== String(doc.id)))
    setWorkspaceResources((prev) => {
      const next = Object.fromEntries(
        Object.entries(prev).map(([workspaceId, ids]) => [
          workspaceId,
          Array.isArray(ids)
            ? ids.filter((id) => String(id) !== String(doc.id))
            : [],
        ])
      )
      return next
    })

    if (activeTitle === doc.filename) {
      updateActiveWorkspaceState({
        activeTitle: `${activeWorkspace?.name || 'Workspace'} Notes`,
        activeNotes: '',
      })
    }

    setSpeakText(`Removed ${doc.filename} from your resources.`)
    await fetchData()
  }

  const handleChat = async (question) => {
    const trimmedQuestion = question.trim()
    if (!trimmedQuestion) return null

    const studentMessage = {
      id: `student-${Date.now()}`,
      role: 'student',
      content: trimmedQuestion,
    }

    updateActiveWorkspaceState((current) => ({
      chatMessages: [...(current.chatMessages || []), studentMessage],
    }))

    try {
      const res = await api.chatQuery(student.id, trimmedQuestion, 'text')

      updateActiveWorkspaceState((current) => ({
        chatMessages: [
          ...(current.chatMessages || []),
          {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: res.answer,
          },
        ],
      }))

      if (res.chat_id) {
        setTalkHistory((prev) => [
          {
            id: String(res.chat_id),
            question: trimmedQuestion,
            answer: res.answer,
            source: 'text',
            created_at: new Date().toISOString(),
          },
          ...prev.filter((talk) => String(talk.id) !== String(res.chat_id)),
        ].slice(0, 100))
      }

      setSpeakText(res.answer)
      return res
    } catch (err) {
      console.error('Chat failed', err)
      throw err
    }
  }

  const handleVoiceResult = ({ question, answer, chatId }) => {
    updateActiveWorkspaceState((current) => ({
      chatMessages: [
        ...(current.chatMessages || []),
        { id: `voice-student-${Date.now()}`, role: 'student', content: question },
        { id: `voice-assistant-${Date.now()}-a`, role: 'assistant', content: answer },
      ],
    }))

    if (chatId) {
      setTalkHistory((prev) => [
        {
          id: String(chatId),
          question,
          answer,
          source: 'voice',
          created_at: new Date().toISOString(),
        },
        ...prev.filter((talk) => String(talk.id) !== String(chatId)),
      ].slice(0, 100))
    }
  }

  const handleVoiceScheduleCreated = useCallback((eventRow) => {
    if (!eventRow) return

    const mapped = mapScheduleEventFromApi(eventRow)
    setCustomEvents((prev) => {
      const withoutDuplicate = prev.filter((event) => String(event.id) !== String(mapped.id))
      return [...withoutDuplicate, mapped].sort(sortScheduleEvents)
    })
  }, [])

  const handleDeleteTalk = async (talkId) => {
    if (!talkId) return
    await api.deleteTalk(student.id, talkId)
    setTalkHistory((prev) => prev.filter((talk) => String(talk.id) !== String(talkId)))
  }

  const handleClearTalks = async () => {
    await api.clearTalks(student.id)
    setTalkHistory([])
  }

  const handleOpenWorkspace = (workspaceId) => {
    setActiveWorkspaceId(String(workspaceId))
    setActiveTab('workspace')
    navigate('/app/workspace')
  }

  const handleCreateWorkspace = async (workspaceName) => {
    const normalized = workspaceName.trim()
    if (!normalized) {
      throw new Error('Workspace name is required.')
    }

    const duplicate = workspaces.some(
      (workspace) => String(workspace.name || '').toLowerCase() === normalized.toLowerCase()
    )
    if (duplicate) {
      throw new Error('Workspace already exists.')
    }

    const response = await api.createWorkspace(student.id, normalized)
    const created = {
      ...response.workspace,
      id: String(response.workspace.id),
    }

    setWorkspaces((prev) => [created, ...prev])
    setWorkspaceStates((prev) => ({
      ...prev,
      [created.id]: {
        activeTitle: `${created.name} Notes`,
        activeNotes: '',
        chatMessages: greeting
          ? [
              {
                id: `greeting-${created.id}-${Date.now()}`,
                role: 'assistant',
                content: greeting,
              },
            ]
          : [],
      },
    }))
    setWorkspaceResources((prev) => ({
      ...prev,
      [created.id]: [],
    }))

    setActiveWorkspaceId(created.id)
    setActiveTab('workspace')
    navigate('/app/workspace')
  }

  const handleDeleteWorkspace = async (workspaceId) => {
    if (workspaces.length <= 1) {
      throw new Error('At least one workspace must remain.')
    }

    await api.deleteWorkspace(student.id, workspaceId)

    const remaining = workspaces.filter((workspace) => String(workspace.id) !== String(workspaceId))
    if (remaining.length === workspaces.length) return

    setWorkspaces(remaining)
    setWorkspaceStates((prev) => {
      const next = { ...prev }
      delete next[String(workspaceId)]
      return next
    })
    setWorkspaceResources((prev) => {
      const next = { ...prev }
      delete next[String(workspaceId)]
      return next
    })

    if (String(workspaceId) === String(activeWorkspaceId)) {
      setActiveWorkspaceId(String(remaining[0].id))
      setActiveTab('workspace')
      navigate('/app/workspace')
    }
  }

  const handleCreateFlashcard = async ({ subject, question, answer }) => {
    const response = await api.createFlashcard(student.id, { subject, question, answer })
    const created = mapFlashcardFromApi(response.flashcard)

    setFlashcards((prev) => {
      const withoutDuplicate = prev.filter((card) => String(card.id) !== String(created.id))
      return [created, ...withoutDuplicate]
    })
  }

  const handleGenerateFlashcardAnswer = async ({ subject, question }) => {
    const response = await api.generateFlashcardAnswer(student.id, { subject, question })
    return response.answer || ''
  }

  const handleDeleteFlashcard = async (cardId) => {
    await api.deleteFlashcard(student.id, cardId)
    setFlashcards((prev) => prev.filter((card) => String(card.id) !== String(cardId)))
  }

  const handleToggleMastered = async (cardId) => {
    const current = flashcards.find((card) => String(card.id) === String(cardId))
    if (!current) return

    const response = await api.updateFlashcard(student.id, cardId, { mastered: !current.mastered })
    const updated = mapFlashcardFromApi(response.flashcard)

    setFlashcards((prev) =>
      prev.map((card) => (String(card.id) === String(cardId) ? updated : card))
    )
  }

  const handleMarkReviewed = async () => {
    try {
      const response = await api.incrementFlashcardReviewStats(student.id)
      setFlashStats({ history: response.history || {} })
    } catch (err) {
      console.error('Review stats update failed', err)
    }
  }

  const handleCreateScheduleEvent = async (event) => {
    const response = await api.createScheduleEvent(student.id, event)
    const created = mapScheduleEventFromApi(response.event)

    setCustomEvents((prev) => [...prev, created].sort(sortScheduleEvents))
  }

  const handleDeleteScheduleEvent = async (eventId) => {
    await api.deleteScheduleEvent(student.id, eventId)
    setCustomEvents((prev) => prev.filter((event) => String(event.id) !== String(eventId)))
  }



  const handleEmotionDetected = useCallback((emotion, confidence) => {
    const normalizedEmotion = String(emotion || 'no_face').toLowerCase()
    const numericConfidence = Number(confidence || 0)

    setCurrentEmotion(normalizedEmotion)
    setFaceDetectionError('')

    if (!isWorkspaceTab) return

    if (normalizedEmotion === 'neutral') return
    if (normalizedEmotion === lastReactedEmotionRef.current) return
    if (normalizedEmotion !== 'no_face' && numericConfidence < 45) return

    const response = getEmotionResponse(normalizedEmotion, studentName)
    if (!response) return

    // Clear first so repeated reactions still trigger VoiceOrb effect.
    setSpeakText('')
    window.setTimeout(() => setSpeakText(response), 0)

    lastReactedEmotionRef.current = normalizedEmotion
    setLastReactedEmotion(normalizedEmotion)
  }, [studentName, isWorkspaceTab])

  const handleStartFaceDetection = useCallback(async () => {
    if (!student.id) {
      throw new Error('Student session not found. Please log in again to enable Focus Mode.')
    }

    setFaceDetectionError('')

    const stream = await startFaceDetection(student.id, handleEmotionDetected, captureVideoRef)
    cameraStreamRef.current = stream
    setFaceDetectionOn(true)

    // Attach stream after PiP mounts to avoid a blank preview on first toggle.
    window.requestAnimationFrame(() => {
      const previewVideo = previewVideoRef.current
      if (!previewVideo) return

      previewVideo.srcObject = stream
      previewVideo.play().catch(() => {})
    })

    setCurrentEmotion('neutral')
    lastReactedEmotionRef.current = null
    setLastReactedEmotion(null)
  }, [student.id, handleEmotionDetected])

  const handleStopFaceDetection = useCallback(() => {
    stopFaceDetection(cameraStreamRef.current, captureVideoRef)
    cameraStreamRef.current = null
    if (previewVideoRef.current) {
      previewVideoRef.current.srcObject = null
    }
    setFaceDetectionOn(false)
    setCurrentEmotion('neutral')
    setLastReactedEmotion(null)
    setFaceDetectionError('')
    lastReactedEmotionRef.current = null
  }, [])

  useEffect(() => {
    if (isWorkspaceTab) return

    setSpeakText('')
    if (faceDetectionOn) {
      handleStopFaceDetection()
    }
  }, [isWorkspaceTab, faceDetectionOn, handleStopFaceDetection])

  const handleToggleFaceDetection = async () => {
    if (faceDetectionOn) {
      handleStopFaceDetection()
      return
    }

    try {
      await handleStartFaceDetection()
    } catch (err) {
      console.error('Unable to start face detection', err)
      setFaceDetectionError(err.message || 'Unable to access camera right now.')
    }
  }

  const handleLogout = () => {
    handleStopFaceDetection()
    localStorage.removeItem('student_id')
    localStorage.removeItem('student_name')
    navigate('/')
  }

  const handleNavigateTab = useCallback((tabId) => {
    const target = TAB_ITEMS.find((tab) => tab.id === tabId)
    if (!target) return

    setActiveTab(tabId)
    navigate(target.path)
    setMobileSidebarOpen(false)
  }, [navigate])

  const handleSenseiNavigation = useCallback(() => {
    setActiveTab('workspace')
    navigate('/app/workspace')
    setMobileSidebarOpen(false)
  }, [navigate])

  const studentInitial = String(studentName || 'S').charAt(0).toUpperCase()
  const pageTitle = TAB_TITLES[activeTab] || 'Home'
  const hasUnreadNotifications = pendingClassesCount(sessions, reviewStats)

  useEffect(() => {
    const titleMap = {
      home: 'StudyBuddy — Home',
      workspace: 'StudyBuddy — Home',
      organizations: 'StudyBuddy — My Classes',
      library: 'StudyBuddy — Library',
      schedule: 'StudyBuddy — Schedule',
      flashcards: 'StudyBuddy — Flashcards',
    }

    document.title = titleMap[activeTab] || 'StudyBuddy — Home'
  }, [activeTab])

  function pendingClassesCount(sessionRows, stats) {
    const recentSessionCount = Array.isArray(sessionRows) ? sessionRows.length : 0
    const reviewsToday = Number(stats?.todayReviews || 0)
    return recentSessionCount > 0 || reviewsToday > 0
  }

  return (
    <div className="min-h-screen w-full bg-[#080B14] text-[#94A3B8] overflow-hidden">
      {mobileSidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-[220px] border-r border-[#1C2333] bg-[#080B14] flex flex-col transition-transform duration-200 ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className="px-4 pt-5 pb-4">
          <div className="flex items-center gap-2.5">
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                boxShadow: '0 0 12px rgba(99,102,241,0.3)'
              }}
            >
              <SidebarBrandIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[15px] font-bold text-white leading-none">StudyBuddy</p>
              <p className="text-[10px] text-[#4B5563] leading-none mt-0.5">AI Study Companion</p>
            </div>
          </div>
          <div className="my-4 border-b border-[#1C2333]" />
        </div>

        <div className="mx-3 mb-4 rounded-xl border border-[rgba(99,102,241,0.15)] bg-[rgba(99,102,241,0.08)] p-3">
          <div className="flex items-center gap-2.5">
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '999px',
                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                display: 'grid',
                placeItems: 'center',
                fontSize: '13px',
                fontWeight: 700,
                color: 'white'
              }}
            >
              {studentInitial}
            </div>
            <div>
              <p className="text-[13px] font-semibold text-white leading-none">{studentName}</p>
              <span className="inline-flex mt-1 rounded-full bg-[rgba(99,102,241,0.1)] px-2 py-0.5 text-[10px] text-[#6366F1]">Student</span>
            </div>
          </div>
        </div>

        <p className="px-4 mb-2 text-[10px] font-semibold tracking-[0.1em] uppercase text-[#374151]">WORKSPACE</p>

        <nav className="space-y-0.5">
          {TAB_ITEMS.map((tab) => {
            const isActive = activeTab === tab.id
            const Icon = tab.Icon

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleNavigateTab(tab.id)}
                className={`w-[calc(100%-16px)] text-left flex items-center gap-2.5 rounded-[10px] py-[9px] pr-4 text-[13px] transition-all ${isActive ? 'bg-[rgba(99,102,241,0.12)] border-l-2 border-[#6366F1] ml-[6px] pl-[14px] text-white font-semibold' : 'ml-2 pl-4 text-[#4B5563] hover:bg-white/5 hover:text-white font-medium'}`}
              >
                <span className={`${isActive ? 'text-[#6366F1]' : 'text-[#4B5563]'}`}>
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>

        <p className="px-4 mt-4 mb-2 text-[10px] font-semibold tracking-[0.1em] uppercase text-[#374151]">SENSEI</p>
        <div>
          <button
            type="button"
            onClick={handleSenseiNavigation}
            className={`w-[calc(100%-16px)] text-left flex items-center gap-2.5 rounded-[10px] py-[9px] pr-4 text-[13px] transition-all ${activeTab === 'workspace' ? 'bg-[rgba(99,102,241,0.12)] border-l-2 border-[#6366F1] ml-[6px] pl-[14px] text-white font-semibold' : 'ml-2 pl-4 text-[#4B5563] hover:bg-white/5 hover:text-white font-medium'}`}
          >
            <span className={`${activeTab === 'workspace' ? 'text-[#6366F1]' : 'text-[#4B5563]'}`}>
              <SidebarSenseiIcon className="h-[18px] w-[18px]" />
            </span>
            <span>Talk to Sensei</span>
          </button>
        </div>

        <div className="mt-auto border-t border-[#1C2333] p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 rounded-[10px] px-3 py-[9px] text-[13px] text-[#EF4444] hover:bg-[rgba(239,68,68,0.08)] transition-all"
          >
            <span>
              <SidebarLogoutIcon className="h-[18px] w-[18px]" />
            </span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <header className="fixed top-0 left-0 md:left-[220px] right-0 h-[52px] bg-[rgba(8,11,20,0.85)] backdrop-blur-xl border-b border-[#1C2333] z-30 flex items-center justify-between px-4 md:px-7">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="md:hidden rounded-lg border border-[#1C2333] bg-[#11172A] p-2 text-slate-300"
            aria-label="Open navigation"
          >
            <SidebarMenuIcon />
          </button>
          <p className="text-[15px] font-semibold text-white">{pageTitle}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="relative text-[#4B5563] hover:text-white transition-colors"
            aria-label="Notifications"
          >
            <TopBarBellIcon className="h-[18px] w-[18px]" />
            {hasUnreadNotifications && (
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#EF4444]" />
            )}
          </button>

          <div className="rounded-full border border-[rgba(99,102,241,0.15)] bg-[rgba(99,102,241,0.1)] px-3.5 py-1 text-xs font-semibold text-[#6366F1]">
            {studentName}
          </div>
        </div>
      </header>

      {faceDetectionError && (
        <div className="fixed top-[60px] right-6 z-40 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-200">
          {faceDetectionError}
        </div>
      )}

      <div className="mt-[52px] w-full min-h-[calc(100vh-52px)] bg-[#080B14] md:ml-[220px] md:w-[calc(100%-220px)]">
        <main className="h-[calc(100vh-52px)] w-full overflow-hidden">
          {activeTab === 'home' && (
            <HomeView
              studentName={student.name}
              sessions={sessions}
              customEvents={customEvents}
              documents={documents}
              reviewStats={reviewStats}
              workspaces={workspaces}
              activeWorkspaceId={activeWorkspace?.id}
              onOpenWorkspace={handleOpenWorkspace}
              onCreateWorkspace={handleCreateWorkspace}
              onDeleteWorkspace={handleDeleteWorkspace}
            />
          )}

          {activeTab === 'organizations' && (
            <OrganizationsView
              studentName={studentName}
            />
          )}

          {activeTab === 'workspace' && (
            <WorkspaceView
              workspaceName={activeWorkspace?.name}
              activeTitle={activeTitle}
              activeNotes={activeNotes}
              onChat={handleChat}
              chatMessages={chatMessages}
              greeting={greeting}
              documents={workspaceDocuments}
              onGenerate={handleGenerate}
              onSearchNotes={handleSearchNotes}
              onUpload={handleUpload}
              onDeleteDocument={handleDeleteDocument}
              talkHistory={talkHistory}
              onDeleteTalk={handleDeleteTalk}
              onClearTalks={handleClearTalks}
            />
          )}

          {activeTab === 'library' && (
            <LibraryView
              documents={documents}
              onUpload={handleUpload}
              onGenerate={handleGenerate}
              onOpenWorkspace={handleSenseiNavigation}
              onDeleteDocument={handleDeleteDocument}
            />
          )}

          {activeTab === 'flashcards' && (
            <FlashcardsView
              flashcards={flashcards}
              reviewStats={reviewStats}
              onCreateCard={handleCreateFlashcard}
              onGenerateAnswer={handleGenerateFlashcardAnswer}
              onToggleMastered={handleToggleMastered}
              onMarkReviewed={handleMarkReviewed}
              onDeleteCard={handleDeleteFlashcard}
            />
          )}

          {activeTab === 'schedule' && (
            <ScheduleView
              sessions={sessions}
              customEvents={customEvents}
              onCreateEvent={handleCreateScheduleEvent}
              onDeleteEvent={handleDeleteScheduleEvent}
            />
          )}
        </main>
      </div>

      {isWorkspaceTab && faceDetectionOn && (
        <FaceDetectionPip
          videoRef={previewVideoRef}
          currentEmotion={currentEmotion}
          onClose={handleStopFaceDetection}
        />
      )}

      <video ref={captureVideoRef} className="hidden" muted />

      {isWorkspaceTab && (
        <VoiceOrb
          studentId={student.id}
          onResult={handleVoiceResult}
          speakText={speakText}
          onScheduleCreated={handleVoiceScheduleCreated}
        />
      )}
    </div>
  )
}
