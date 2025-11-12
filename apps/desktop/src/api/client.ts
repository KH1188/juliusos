/**
 * API client for JuliusOS backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const AGENT_BASE_URL = import.meta.env.VITE_AGENT_URL || 'http://localhost:8001'

async function fetchJSON(url: string, options?: RequestInit) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response.json()
}

// Tasks
export const getTasks = (status?: string) =>
  fetchJSON(`${API_BASE_URL}/tasks${status ? `?status=${status}` : ''}`)

export const createTask = (data: any) =>
  fetchJSON(`${API_BASE_URL}/tasks`, {
    method: 'POST',
    body: JSON.stringify(data),
  })

export const updateTaskStatus = (id: number, status: string) =>
  fetchJSON(`${API_BASE_URL}/tasks/${id}/status?status=${status}`, {
    method: 'PATCH',
  })

// Events
export const getEvents = (start?: string, end?: string) =>
  fetchJSON(
    `${API_BASE_URL}/calendars/events?${new URLSearchParams({ start: start || '', end: end || '' })}`
  )

// Habits
export const getHabits = () => fetchJSON(`${API_BASE_URL}/habits`)

export const logHabit = (habitId: number, data: any) =>
  fetchJSON(`${API_BASE_URL}/habits/${habitId}/log`, {
    method: 'POST',
    body: JSON.stringify(data),
  })

// Meals
export const getMeals = (start?: string, end?: string) =>
  fetchJSON(
    `${API_BASE_URL}/meals?${new URLSearchParams({ start: start || '', end: end || '' })}`
  )

export const createMeal = (data: any) =>
  fetchJSON(`${API_BASE_URL}/meals`, {
    method: 'POST',
    body: JSON.stringify(data),
  })

// Sleep
export const getSleepLogs = (start?: string, end?: string) =>
  fetchJSON(
    `${API_BASE_URL}/sleep?${new URLSearchParams({ start: start || '', end: end || '' })}`
  )

// Bible
export const getBiblePlans = () => fetchJSON(`${API_BASE_URL}/bible/plans`)

export const getBibleReadings = (planId?: number) =>
  fetchJSON(`${API_BASE_URL}/bible/readings${planId ? `?plan_id=${planId}` : ''}`)

export const createBibleReflection = (data: any) =>
  fetchJSON(`${API_BASE_URL}/bible/reflections`, {
    method: 'POST',
    body: JSON.stringify(data),
  })

// Settings
export const getSettings = () => fetchJSON(`${API_BASE_URL}/settings`)

export const updateSettings = (data: any) =>
  fetchJSON(`${API_BASE_URL}/settings`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })

// Agent endpoints
export const getDailyDigest = () =>
  fetchJSON(`${AGENT_BASE_URL}/digest/daily`, {
    method: 'POST',
    body: JSON.stringify({ user_id: 1 }),
  })

export const getWeeklyReview = () =>
  fetchJSON(`${AGENT_BASE_URL}/review/weekly`, {
    method: 'POST',
    body: JSON.stringify({ user_id: 1 }),
  })

export const runRecipe = (recipeName: string, params: any = {}) =>
  fetchJSON(`${AGENT_BASE_URL}/recipes/${recipeName}`, {
    method: 'POST',
    body: JSON.stringify({ user_id: 1, params }),
  })

// Next Best Step
export const getNextBestStep = () =>
  fetchJSON(`${API_BASE_URL}/agent/next-best-step`, {
    method: 'POST',
    body: JSON.stringify({ user_id: 1 }),
  })

// Skin & Hygiene
export const getSkinProducts = () => fetchJSON(`${API_BASE_URL}/skin/products`)

export const createSkinProduct = (data: any) =>
  fetchJSON(`${API_BASE_URL}/skin/products`, {
    method: 'POST',
    body: JSON.stringify(data),
  })

export const getSkinRoutines = () => fetchJSON(`${API_BASE_URL}/skin/routines`)

export const getSkinLogs = (start?: string, end?: string) =>
  fetchJSON(
    `${API_BASE_URL}/skin/logs?${new URLSearchParams({ start: start || '', end: end || '' })}`
  )

export const createSkinLog = (data: any) =>
  fetchJSON(`${API_BASE_URL}/skin/logs`, {
    method: 'POST',
    body: JSON.stringify(data),
  })

// Profile & Memory
export const getUserProfile = () => fetchJSON(`${API_BASE_URL}/profile`)

export const updateUserProfile = (data: any) =>
  fetchJSON(`${API_BASE_URL}/profile`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })

export const getMemoryEvents = () => fetchJSON(`${API_BASE_URL}/profile/memory`)

export const createMemoryEvent = (data: any) =>
  fetchJSON(`${API_BASE_URL}/profile/memory`, {
    method: 'POST',
    body: JSON.stringify(data),
  })

// Relationships & Contacts
export const getContacts = () => fetchJSON(`${API_BASE_URL}/contacts`)

export const createContact = (data: any) =>
  fetchJSON(`${API_BASE_URL}/contacts`, {
    method: 'POST',
    body: JSON.stringify(data),
  })

export const getNurtureCycles = () =>
  fetchJSON(`${API_BASE_URL}/relationships/nurture-cycles`)

export const createNurtureCycle = (data: any) =>
  fetchJSON(`${API_BASE_URL}/relationships/nurture-cycles`, {
    method: 'POST',
    body: JSON.stringify(data),
  })

// Chat/Assistant
export const sendChatMessage = async (message: string) => {
  return runRecipe('chat_assistant', { message })
}
