import {firebaseAuth} from './firebase'

interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
}

export class ApiError extends Error {
  readonly status: number
  readonly payload: unknown

  constructor(message: string, status: number, payload: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')

async function getAuthToken() {
  const user = firebaseAuth.currentUser

  if (!user) {
    throw new ApiError('User is not authenticated.', 401, null)
  }

  return user.getIdToken()
}

async function parseResponse(response: Response) {
  const contentType = response.headers.get('content-type')

  if (contentType?.includes('application/json')) {
    return response.json()
  }

  return response.text()
}

export async function apiRequest<TResponse>(path: string, options: ApiRequestOptions = {}) {
  const token = await getAuthToken()
  const headers = new Headers(options.headers)

  headers.set('Authorization', `Bearer ${token}`)

  if (options.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })

  const payload = await parseResponse(response)

  if (!response.ok) {
    const message = typeof payload === 'object' && payload !== null && 'message' in payload
      ? String(payload.message)
      : `Request failed with status ${response.status}`

    throw new ApiError(message, response.status, payload)
  }

  return payload as TResponse
}

export const apiClient = {
  get: <TResponse>(path: string) => apiRequest<TResponse>(path),
  post: <TResponse>(path: string, body?: unknown) => apiRequest<TResponse>(path, {method: 'POST', body}),
  put: <TResponse>(path: string, body?: unknown) => apiRequest<TResponse>(path, {method: 'PUT', body}),
  delete: <TResponse>(path: string, body?: unknown) => apiRequest<TResponse>(path, {method: 'DELETE', body}),
}
