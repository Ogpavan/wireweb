import {Button} from '@primer/react'
import {SyncIcon} from '@primer/octicons-react'
import {useEffect, useState} from 'react'
import type {FormEvent} from 'react'
import {PageHeader} from '../components/ui/PageHeader'
import {StatusBadge} from '../components/ui/StatusBadge'
import {SurfaceCard} from '../components/ui/SurfaceCard'
import {ApiError, apiClient} from '../services/apiClient'
import type {UserLog, UserLogListResponse} from '../services/backendContract'

function errorMessage(error: unknown) {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message
  }

  return 'Something went wrong.'
}

function formatDate(value: string) {
  if (!value) {
    return 'Unknown'
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(new Date(value))
}

function statusForEvent(event: string) {
  if (event.includes('failed') || event.includes('deleted') || event.includes('disconnected')) {
    return 'danger'
  }
  if (event.includes('skipped')) {
    return 'warning'
  }
  if (event.includes('delivered') || event.includes('sent') || event.includes('connected') || event.includes('created')) {
    return 'success'
  }
  return 'info'
}

function metadataSummary(metadata: Record<string, unknown>) {
  const entries = Object.entries(metadata)
  if (entries.length === 0) {
    return '-'
  }

  return entries
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(', ')
}

export function LogsPage() {
  const [logs, setLogs] = useState<UserLog[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadLogs(nextPage = page, nextPageSize = pageSize, nextStartDate = startDate, nextEndDate = endDate) {
    setIsLoading(true)
    setError('')

    try {
      const query = new URLSearchParams()
      query.set('page', String(nextPage))
      query.set('pageSize', String(nextPageSize))
      if (nextStartDate) {
        query.set('startDate', nextStartDate)
      }
      if (nextEndDate) {
        query.set('endDate', nextEndDate)
      }

      const response = await apiClient.get<UserLogListResponse>(`/v1/logs?${query.toString()}`)
      setLogs(response.logs)
      setPage(response.page)
      setPageSize(response.pageSize)
      setHasMore(response.hasMore)
    } catch (loadError) {
      setError(errorMessage(loadError))
    } finally {
      setIsLoading(false)
    }
  }

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void loadLogs(1, pageSize, startDate, endDate)
  }

  useEffect(() => {
    void loadLogs(1, pageSize, startDate, endDate)
  }, [])

  return (
    <>
      <PageHeader
        title="Logs"
        description="User-scoped API, WhatsApp session, message, and webhook events stored in Firebase."
        actions={
          <Button className="secondary-button" leadingVisual={SyncIcon} onClick={() => void loadLogs()} disabled={isLoading}>
            Refresh
          </Button>
        }
      />
      <SurfaceCard title="Event log" description="Recent events for the signed-in Firebase user.">
        <form className="logs-filters" onSubmit={applyFilters}>
          <label className="login-field">
            Start date
            <input className="login-input" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          </label>
          <label className="login-field">
            End date
            <input className="login-input" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          </label>
          <label className="login-field">
            Page size
            <input
              className="login-input"
              type="number"
              min={1}
              max={100}
              value={pageSize}
              onChange={(event) => setPageSize(Number(event.target.value) || 25)}
            />
          </label>
          <Button className="primary-button api-send-button" type="submit" disabled={isLoading}>
            Apply filters
          </Button>
        </form>
        {error ? (
          <div className="form-message form-message--error">{error}</div>
        ) : isLoading ? (
          <div className="table-empty">Loading logs...</div>
        ) : logs.length === 0 ? (
          <div className="table-empty">No logs yet.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Event</th>
                <th>Details</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{formatDate(log.createdAt)}</td>
                  <td><code>{log.event}</code></td>
                  <td>{metadataSummary(log.metadata)}</td>
                  <td><StatusBadge variant={statusForEvent(log.event)}>{statusForEvent(log.event)}</StatusBadge></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="logs-pagination">
          <Button className="secondary-button" type="button" onClick={() => void loadLogs(page - 1)} disabled={isLoading || page <= 1}>
            Previous
          </Button>
          <span className="logs-pagination__meta">Page {page}</span>
          <Button className="secondary-button" type="button" onClick={() => void loadLogs(page + 1)} disabled={isLoading || !hasMore}>
            Next
          </Button>
        </div>
      </SurfaceCard>
    </>
  )
}
