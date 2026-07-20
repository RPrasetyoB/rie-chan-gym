export type ApiUser = {
  id: string
  email: string
  name: string
}

export type AuthTokens = {
  accessToken: string
  refreshToken: string
}

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1'
const AUTH_TOKEN_KEY = 'rie-chan-auth-tokens'
let refreshPromise: Promise<AuthTokens | null> | null = null

function isClient() {
  return typeof window !== 'undefined'
}

export function loadAuthTokens(): AuthTokens | null {
  if (!isClient()) return null

  try {
    const raw = window.localStorage.getItem(AUTH_TOKEN_KEY)
    return raw ? (JSON.parse(raw) as AuthTokens) : null
  } catch {
    return null
  }
}

export function saveAuthTokens(tokens: AuthTokens) {
  if (!isClient()) return
  window.localStorage.setItem(AUTH_TOKEN_KEY, JSON.stringify(tokens))
}

export function clearAuthTokens() {
  if (!isClient()) return
  window.localStorage.removeItem(AUTH_TOKEN_KEY)
}

function buildUrl(path: string) {
  const base = API_BASE_URL.replace(/\/$/, '')
  const suffix = path.startsWith('/') ? path : `/${path}`
  return `${base}${suffix}`
}

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') ?? ''
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text()

  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload && 'message' in payload
        ? String((payload as { message?: string }).message ?? 'Request failed')
        : typeof payload === 'string' && payload
          ? payload
          : 'Request failed'
    throw new Error(message)
  }

  return payload as T
}

async function refreshAuthTokens() {
  if (refreshPromise) {
    return refreshPromise
  }

  refreshPromise = (async () => {
    const tokens = loadAuthTokens()
    if (!tokens?.refreshToken) {
      return null
    }

    try {
      const response = await fetch(buildUrl('/auth/refresh'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      })

      if (!response.ok) {
        clearAuthTokens()
        return null
      }

      const payload = (await response.json()) as AuthTokens
      saveAuthTokens(payload)
      return payload
    } catch {
      clearAuthTokens()
      return null
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  options: { auth?: boolean; retryOnAuth?: boolean } = {},
): Promise<T> {
  const headers = new Headers(init.headers)
  const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData

  if (!isFormData && init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const tokens = options.auth === false ? null : loadAuthTokens()
  if (tokens?.accessToken) {
    headers.set('Authorization', `Bearer ${tokens.accessToken}`)
  }

  const response = await fetch(buildUrl(path), {
    ...init,
    headers,
    credentials: 'include',
  })

  if (response.status === 401 && options.auth !== false && options.retryOnAuth !== false) {
    const refreshed = await refreshAuthTokens()
    if (refreshed?.accessToken) {
      const retryHeaders = new Headers(init.headers)
      const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData

      if (!isFormData && init.body && !retryHeaders.has('Content-Type')) {
        retryHeaders.set('Content-Type', 'application/json')
      }

      retryHeaders.set('Authorization', `Bearer ${refreshed.accessToken}`)

      const retryResponse = await fetch(buildUrl(path), {
        ...init,
        headers: retryHeaders,
        credentials: 'include',
      })

      if (retryResponse.ok) {
        return parseResponse<T>(retryResponse)
      }
    }
  }

  return parseResponse<T>(response)
}

export function apiGet<T>(path: string, auth = true) {
  return apiRequest<T>(path, { method: 'GET' }, { auth })
}

export function apiPost<T>(path: string, body?: unknown, auth = true) {
  return apiRequest<T>(
    path,
    {
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    },
    { auth },
  )
}

export function apiPut<T>(path: string, body?: unknown, auth = true) {
  return apiRequest<T>(
    path,
    {
      method: 'PUT',
      body: body === undefined ? undefined : JSON.stringify(body),
    },
    { auth },
  )
}
