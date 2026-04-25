export interface BackendHealth {
  status: 'ok'
  service: string
}

export interface APIKey {
  id: string
  name: string
  apiKey?: string
  maskedKey: string
  createdAt: string
  updatedAt: string
}

export interface APIKeyListResponse {
  keys: APIKey[]
}

export interface WhatsAppSession {
  id: string
  uid: string
  name: string
  phoneNumber?: string
  status: 'disconnected' | 'pairing' | 'connected'
  jid?: string
  storePath: string
  createdAt: string
  updatedAt: string
  lastConnectedAt?: string
}

export interface WhatsAppQRResponse {
  qr: string
}

export interface UserLog {
  id: string
  event: string
  metadata: Record<string, unknown>
  createdAt: string
}

export interface UserLogListResponse {
  logs: UserLog[]
  page: number
  pageSize: number
  hasMore: boolean
}

export interface DashboardTrendPoint {
  date: string
  messagesSent: number
  incoming: number
  webhookFailed: number
}

export interface DashboardCountItem {
  label: string
  count: number
}

export interface DashboardSessionItem {
  sessionId: string
  name: string
  status: string
  count: number
}

export interface DashboardSummaryResponse {
  totalEvents: number
  messagesSent: number
  incomingMessages: number
  webhookDelivered: number
  webhookFailed: number
  connectedSessions: number
  pairingSessions: number
  disconnectedSessions: number
  apiKeys: number
  dailyActivity: DashboardTrendPoint[]
  endpointUsage: DashboardCountItem[]
  sessionActivity: DashboardSessionItem[]
  recentActivity: UserLog[]
}

export interface RateLimitConfig {
  messagePerMinute: number
  mediaPerMinute: number
  apiKeyPerMinute: number
  sessionPerMinute: number
  webhookPerMinute: number
  contactsPerMinute: number
  chatsPerMinute: number
  logsPerMinute: number
  sendDelayMs: number
}

export interface RateLimitResponse {
  rateLimits: RateLimitConfig
  updatedAt?: string
}
