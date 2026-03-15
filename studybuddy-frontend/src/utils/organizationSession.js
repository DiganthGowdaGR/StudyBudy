const ORGANIZATION_SESSION_KEY = 'studybuddy_organization_session'

function getLegacyOrganizationSession() {
  const orgId = localStorage.getItem('org_id') || localStorage.getItem('organizer_id')
  const orgName = localStorage.getItem('org_name')

  if (!orgId && !orgName) return null

  return {
    org_id: orgId || null,
    name: orgName || '',
  }
}

export function getOrganizationSession() {
  try {
    const raw = localStorage.getItem(ORGANIZATION_SESSION_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && parsed.org_id) return parsed
    }

    return getLegacyOrganizationSession()
  } catch {
    return getLegacyOrganizationSession()
  }
}

export function setOrganizationSession(session) {
  const safeSession = session || {}
  localStorage.setItem(ORGANIZATION_SESSION_KEY, JSON.stringify(safeSession))

  if (safeSession.org_id) {
    const orgId = String(safeSession.org_id)
    localStorage.setItem('org_id', orgId)
    localStorage.setItem('organizer_id', orgId)
  } else {
    localStorage.removeItem('org_id')
    localStorage.removeItem('organizer_id')
  }

  if (safeSession.name) {
    localStorage.setItem('org_name', String(safeSession.name))
  } else {
    localStorage.removeItem('org_name')
  }
}

export function clearOrganizationSession() {
  localStorage.removeItem(ORGANIZATION_SESSION_KEY)
  localStorage.removeItem('org_id')
  localStorage.removeItem('org_name')
  localStorage.removeItem('organizer_id')
}

export { ORGANIZATION_SESSION_KEY }
