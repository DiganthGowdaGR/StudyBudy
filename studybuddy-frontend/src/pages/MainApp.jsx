import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

const TAB_ITEMS = [
  { id: 'home', label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1' },
  { id: 'organizations', label: 'My Classes', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { id: 'workspace', label: 'Workspace', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { id: 'library', label: 'Library', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { id: 'flashcards', label: 'Flashcards', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01m-.01 4h.01' },
  { id: 'schedule', label: 'Schedule', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
]

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
  return {
    id: String(row.id),
    title: row.title || 'Untitled Event',
    subject: row.subject || 'General',
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
  const studentId = localStorage.getItem('student_id')
  const storageSuffix = studentId || 'guest'
  const activeWorkspaceStorageKey = `studybuddy_active_workspace_${storageSuffix}`

  const [student] = useState({
    id: studentId,
    name: localStorage.getItem('student_name'),
  })
  const studentName = student.name || 'Student'

  const [activeTab, setActiveTab] = useState('home')
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
    if (!student.id) return

    setFaceDetectionError('')

    const stream = await startFaceDetection(student.id, handleEmotionDetected, captureVideoRef)
    cameraStreamRef.current = stream
    setFaceDetectionOn(true)
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

  const handleScheduleCreatedFromVoice = (event) => {
    if (!event) return
    const mapped = mapScheduleEventFromApi(event)
    setCustomEvents((prev) => [...prev, mapped].sort(sortScheduleEvents))
  }

  return (
    <div className="flex h-screen bg-[#090b14] text-white overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-56 flex-shrink-0 border-r border-[#1e1e2e] bg-[#0d0f1a] flex flex-col">
        <div className="p-4 border-b border-[#1e1e2e]">
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-md bg-indigo-600 border border-indigo-500 grid place-items-center">
              <span className="h-2 w-2 rounded-sm bg-white" />
            </span>
            <p className="text-white font-semibold">StudyBuddy</p>
          </div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-indigo-400 mt-2">Student Portal</p>
          <p className="text-sm text-white font-semibold mt-0.5 truncate">{studentName}</p>
        </div>

        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {TAB_ITEMS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                activeTab === tab.id
                  ? 'bg-indigo-600/20 text-indigo-300'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
              </svg>
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-[#1e1e2e] space-y-2">
          {isWorkspaceTab && (
            <button
              type="button"
              onClick={handleToggleFaceDetection}
              title={currentEmotion ? `Current emotion: ${currentEmotion}` : 'Focus Mode'}
              data-last-reacted-emotion={lastReactedEmotion || ''}
              className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors ${
                faceDetectionOn
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 flex-shrink-0" aria-hidden="true">
                <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h8A2.5 2.5 0 0 1 17 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-8A2.5 2.5 0 0 1 4 16.5v-9Z" stroke="currentColor" strokeWidth="1.5" />
                <path d="m17 9 3-1.7v9.4L17 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="flex-1 text-left">Focus Mode</span>
              <span className={faceDetectionOn ? 'h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,0.95)]' : 'h-2 w-2 rounded-full bg-slate-600'} />
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full rounded-lg border border-[#343b5a] bg-[#161b32] px-3 py-2 text-xs text-slate-300 hover:border-indigo-400 transition-colors"
          >
            Portal Selection
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-lg bg-rose-600/80 px-3 py-2 text-xs text-white hover:bg-rose-500 transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {faceDetectionError && (
          <div className="absolute top-3 right-4 z-40 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-200">
            {faceDetectionError}
          </div>
        )}

        <div className="flex-1 overflow-hidden">
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
              onOpenWorkspace={() => setActiveTab('workspace')}
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
        </div>

        {isWorkspaceTab && faceDetectionOn && (
          <FaceDetectionPip
            videoRef={previewVideoRef}
            currentEmotion={currentEmotion}
            onClose={handleStopFaceDetection}
          />
        )}

        <video ref={captureVideoRef} className="hidden" muted />

        <VoiceOrb
          studentId={student.id}
          onResult={handleVoiceResult}
          speakText={speakText}
          onScheduleCreated={handleScheduleCreatedFromVoice}
        />
      </div>
    </div>
  )
}
