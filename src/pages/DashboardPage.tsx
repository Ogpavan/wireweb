import {Button, Text} from '@primer/react'
import {SyncIcon} from '@primer/octicons-react'
import {useEffect, useState} from 'react'
import {PageHeader} from '../components/ui/PageHeader'
import {StatusBadge} from '../components/ui/StatusBadge'
import {SurfaceCard} from '../components/ui/SurfaceCard'
import {ApiError, apiClient} from '../services/apiClient'
import type {DashboardSummaryResponse} from '../services/backendContract'

function errorMessage(error: unknown) {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message
  }

  return 'Something went wrong.'
}

function formatCount(value: number) {
  return new Intl.NumberFormat(undefined).format(value)
}

function formatDay(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${value}T00:00:00`))
}

function statusVariant(status: string) {
  if (status === 'success') {
    return 'success'
  }
  if (status === 'warning') {
    return 'warning'
  }
  if (status === 'danger') {
    return 'danger'
  }
  return 'info'
}

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadSummary() {
    setIsLoading(true)
    setError('')

    try {
      const response = await apiClient.get<DashboardSummaryResponse>('/v1/dashboard/summary')
      setSummary(response)
    } catch (loadError) {
      setError(errorMessage(loadError))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadSummary()
  }, [])

  const metrics = [
    {label: 'Total events', value: summary ? summary.totalEvents : 0, status: 'info', detail: 'All logged workspace activity'},
    {label: 'Messages sent', value: summary ? summary.messagesSent : 0, status: 'success', detail: 'API send requests'},
    {label: 'Incoming messages', value: summary ? summary.incomingMessages : 0, status: 'success', detail: 'Webhook deliveries'},
    {label: 'Connected sessions', value: summary ? summary.connectedSessions : 0, status: 'success', detail: 'Live WhatsApp clients'},
    {label: 'Webhook failures', value: summary ? summary.webhookFailed : 0, status: 'danger', detail: 'Delivery issues'},
    {label: 'API keys', value: summary ? summary.apiKeys : 0, status: 'neutral', detail: 'Available keys'},
  ] as const

  const maxTrendTotal = Math.max(
    1,
    ...(summary?.dailyActivity ?? []).map((day) => day.messagesSent + day.incoming),
  )
  const maxEndpointCount = Math.max(1, ...(summary?.endpointUsage ?? []).map((item) => item.count))

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Live WhatsApp activity, delivery health, and workspace usage for the signed-in user."
        actions={
          <Button className="secondary-button" leadingVisual={SyncIcon} onClick={() => void loadSummary()} disabled={isLoading}>
            Refresh
          </Button>
        }
      />

      {error ? <div className="form-message form-message--error">{error}</div> : null}

      <div className="metric-grid">
        {metrics.map((card) => (
          <SurfaceCard key={card.label} className="metric-card">
            <Text as="p" className="metric-card__label">
              {card.label}
            </Text>
            <Text as="p" className="metric-card__value">
              {isLoading && !summary ? '—' : formatCount(card.value)}
            </Text>
            <StatusBadge variant={card.status}>{card.detail}</StatusBadge>
          </SurfaceCard>
        ))}
      </div>

      <div className="content-grid content-grid--two">
        <SurfaceCard title="Message activity" description="Seven-day sent and incoming volume derived from Firebase logs.">
          {isLoading && !summary ? (
            <div className="table-empty">Loading message activity...</div>
          ) : (summary?.dailyActivity.length ?? 0) === 0 ? (
            <div className="table-empty">No message activity yet.</div>
          ) : (
            <div className="usage-stack">
              {summary?.dailyActivity.map((day) => {
                const total = day.messagesSent + day.incoming
                const width = `${Math.max(6, (total / maxTrendTotal) * 100)}%`

                return (
                  <div className="dashboard-trend-row" key={day.date}>
                    <div className="dashboard-trend-row__label">
                      <strong>{formatDay(day.date)}</strong>
                      <span>Sent {formatCount(day.messagesSent)} · Incoming {formatCount(day.incoming)}</span>
                    </div>
                    <strong>{formatCount(total)}</strong>
                    <div className="usage-bar">
                      <span style={{width}} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </SurfaceCard>

        <SurfaceCard title="Session health" description="Current WhatsApp session status and activity by session.">
          {summary ? (
            <>
              <div className="dashboard-session-summary">
                <div className="dashboard-session-summary__item">
                  <strong>{formatCount(summary.connectedSessions)}</strong>
                  <span>Connected</span>
                </div>
                <div className="dashboard-session-summary__item">
                  <strong>{formatCount(summary.pairingSessions)}</strong>
                  <span>Pairing</span>
                </div>
                <div className="dashboard-session-summary__item">
                  <strong>{formatCount(summary.disconnectedSessions)}</strong>
                  <span>Disconnected</span>
                </div>
              </div>

              {summary.sessionActivity.length === 0 ? (
                <div className="table-empty">No session activity yet.</div>
              ) : (
                <table className="data-table dashboard-session-table">
                  <thead>
                    <tr>
                      <th>Session</th>
                      <th>Status</th>
                      <th>Events</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.sessionActivity.slice(0, 5).map((item) => (
                      <tr key={item.sessionId}>
                        <td>
                          <strong>{item.name || item.sessionId}</strong>
                          <div className="dashboard-session-table__subtle">
                            <code>{item.sessionId}</code>
                          </div>
                        </td>
                        <td>
                          <StatusBadge variant={statusVariant(item.status)}>{item.status || 'unknown'}</StatusBadge>
                        </td>
                        <td>{formatCount(item.count)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          ) : (
            <div className="table-empty">Loading session health...</div>
          )}
        </SurfaceCard>
      </div>

      <div className="content-grid content-grid--two">
        <SurfaceCard title="API usage" description="Request mix across message, media, contacts, and chat endpoints.">
          {isLoading && !summary ? (
            <div className="table-empty">Loading API usage...</div>
          ) : (summary?.endpointUsage.length ?? 0) === 0 ? (
            <div className="table-empty">No API usage yet.</div>
          ) : (
            <div className="usage-stack">
              {summary?.endpointUsage.map((item) => {
                const width = `${Math.max(6, (item.count / maxEndpointCount) * 100)}%`

                return (
                  <div className="usage-row" key={item.label}>
                    <span>{item.label}</span>
                    <strong>{formatCount(item.count)}</strong>
                    <div className="usage-bar">
                      <span style={{width}} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </SurfaceCard>
      </div>
    </>
  )
}
