import {Button} from '@primer/react'
import {CheckCircleIcon, CheckIcon, CopyIcon, KeyIcon, PlusIcon, SyncIcon, TrashIcon} from '@primer/octicons-react'
import {useEffect, useMemo, useState} from 'react'
import type {FormEvent} from 'react'
import {ConfirmNameDialog} from '../components/ui/ConfirmNameDialog'
import {PageHeader} from '../components/ui/PageHeader'
import {StatusBadge} from '../components/ui/StatusBadge'
import {SurfaceCard} from '../components/ui/SurfaceCard'
import {ApiError, apiClient} from '../services/apiClient'
import type {WhatsAppQRResponse, WhatsAppSession} from '../services/backendContract'

function formatDate(value: string) {
  if (!value) {
    return 'Unknown'
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function errorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong.'
}

function statusVariant(status: WhatsAppSession['status']) {
  if (status === 'connected') {
    return 'success'
  }
  if (status === 'pairing') {
    return 'warning'
  }
  return 'neutral'
}

export function SessionsPage() {
  const [sessions, setSessions] = useState<WhatsAppSession[]>([])
  const [name, setName] = useState('')
  const [selectedSessionID, setSelectedSessionID] = useState('')
  const [qr, setQR] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<WhatsAppSession | null>(null)
  const [deleteName, setDeleteName] = useState('')
  const [copiedSessionID, setCopiedSessionID] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const sortedSessions = useMemo(
    () => [...sessions].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    [sessions],
  )
  const selectedSession = sessions.find((session) => session.id === selectedSessionID) ?? null

  async function loadSessions() {
    setIsLoading(true)
    setError('')

    try {
      const response = await apiClient.get<WhatsAppSession[]>('/v1/whatsapp/sessions')
      setSessions(response)
      if (!selectedSessionID && response.length > 0) {
        setSelectedSessionID(response[0].id)
      }
    } catch (loadError) {
      setError(errorMessage(loadError))
    } finally {
      setIsLoading(false)
    }
  }

  async function loadQR(sessionID: string) {
    if (!sessionID) {
      return
    }

    try {
      const response = await apiClient.get<WhatsAppQRResponse>(`/v1/whatsapp/sessions/${sessionID}/qr`)
      setQR(response.qr)
    } catch {
      setQR('')
    }
  }

  useEffect(() => {
    void loadSessions()
  }, [])

  useEffect(() => {
    if (!selectedSessionID) {
      setQR('')
      return
    }

    void loadQR(selectedSessionID)
    const timer = window.setInterval(() => {
      void loadQR(selectedSessionID)
      void loadSessions()
    }, 5000)

    return () => window.clearInterval(timer)
  }, [selectedSessionID])

  async function createSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!name.trim()) {
      setError('Session name is required.')
      return
    }

    setIsCreating(true)

    try {
      const createdSession = await apiClient.post<WhatsAppSession>('/v1/whatsapp/sessions', {
        name: name.trim(),
      })
      setSessions((currentSessions) => [createdSession, ...currentSessions])
      setSelectedSessionID(createdSession.id)
      setName('')
      setMessage('Session created. Scan the QR code with WhatsApp.')
      window.setTimeout(() => void loadQR(createdSession.id), 1200)
    } catch (createError) {
      setError(errorMessage(createError))
    } finally {
      setIsCreating(false)
    }
  }

  function openDeleteDialog(session: WhatsAppSession) {
    setDeleteTarget(session)
    setDeleteName('')
    setError('')
    setMessage('')
  }

  function closeDeleteDialog() {
    if (isDeleting) {
      return
    }

    setDeleteTarget(null)
    setDeleteName('')
  }

  async function deleteSession() {
    if (!deleteTarget || deleteName !== deleteTarget.name) {
      return
    }

    setIsDeleting(true)
    setError('')
    setMessage('')

    try {
      await apiClient.delete<void>(`/v1/whatsapp/sessions/${deleteTarget.id}`, {name: deleteName})
      setSessions((currentSessions) => currentSessions.filter((session) => session.id !== deleteTarget.id))
      if (selectedSessionID === deleteTarget.id) {
        setSelectedSessionID('')
        setQR('')
      }
      setDeleteTarget(null)
      setDeleteName('')
      setMessage('Session deleted.')
    } catch (deleteError) {
      setError(errorMessage(deleteError))
    } finally {
      setIsDeleting(false)
    }
  }

  async function copySessionID(sessionID: string) {
    await navigator.clipboard.writeText(sessionID)
    setCopiedSessionID(sessionID)
  }

  return (
    <>
      <PageHeader
        title="WhatsApp Sessions"
        description="Create and manage WhatsApp device sessions for the signed-in Firebase user."
        actions={
          <Button className="secondary-button" leadingVisual={SyncIcon} onClick={loadSessions} disabled={isLoading}>
            Refresh
          </Button>
        }
      />

      <div className="content-grid content-grid--two">
        <SurfaceCard title="Create session" description="Name the session, then scan the generated WhatsApp QR code.">
          <form className="api-key-form" onSubmit={createSession}>
            <label className="login-field">
              Name
              <input
                className="login-input"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Support inbox"
                autoComplete="off"
              />
            </label>
            <Button className="primary-button api-key-form__button" type="submit" leadingVisual={PlusIcon} disabled={isCreating}>
              {isCreating ? 'Creating' : 'Create session'}
            </Button>
          </form>
          {error && <div className="form-message form-message--error">{error}</div>}
          {message && <div className="form-message form-message--success">{message}</div>}
        </SurfaceCard>

        <SurfaceCard title="Pair device" description={selectedSession ? selectedSession.name : 'Select or create a session.'}>
          {selectedSession?.status === 'connected' ? (
            <div className="session-connected">
              <CheckCircleIcon size={24} />
              <div>
                <strong>Connected</strong>
                <span>{selectedSession.phoneNumber || selectedSession.jid || 'WhatsApp device is linked.'}</span>
              </div>
            </div>
          ) : qr ? (
            <div className="session-qr">
              <img src={qr} alt={`QR code for ${selectedSession?.name ?? 'WhatsApp session'}`} />
            </div>
          ) : (
            <div className="table-empty">Waiting for QR code...</div>
          )}
          {selectedSession && (
            <div className="session-meta">
              <div>
                <div className="session-meta__row">
                  <span>Session ID</span>
                  <strong>{selectedSession.id}</strong>
                  <Button
                    className="secondary-button session-copy-button"
                    type="button"
                    leadingVisual={copiedSessionID === selectedSession.id ? CheckIcon : CopyIcon}
                    aria-label="Copy session ID"
                    onClick={() => void copySessionID(selectedSession.id)}
                  />
                </div>
              </div>
            </div>
          )}
        </SurfaceCard>
      </div>

      <SurfaceCard title="Sessions" description="Firebase controls the session list; local storage keeps the WhatsApp device state.">
        {isLoading ? (
          <div className="table-empty">Loading sessions...</div>
        ) : sortedSessions.length === 0 ? (
          <div className="table-empty">
            <KeyIcon size={18} />
            <span>No WhatsApp sessions created yet.</span>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Status</th>
                <th>Phone</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedSessions.map((session) => (
                <tr key={session.id}>
                  <td>
                    <div className="session-table-id">
                      <code>{session.id}</code>
                      <Button
                        className="secondary-button session-copy-button"
                        type="button"
                        leadingVisual={copiedSessionID === session.id ? CheckIcon : CopyIcon}
                        aria-label={`Copy ${session.id}`}
                        onClick={() => void copySessionID(session.id)}
                      />
                    </div>
                  </td>
                  <td>{session.name}</td>
                  <td><StatusBadge variant={statusVariant(session.status)}>{session.status}</StatusBadge></td>
                  <td>{session.phoneNumber || '-'}</td>
                  <td>{formatDate(session.createdAt)}</td>
                  <td>
                    <div className="table-actions">
                      <Button className="secondary-button" type="button" onClick={() => setSelectedSessionID(session.id)}>
                        QR
                      </Button>
                      <Button
                        className="danger-ghost-button"
                        type="button"
                        leadingVisual={TrashIcon}
                        onClick={() => openDeleteDialog(session)}
                        aria-label={`Delete ${session.name}`}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SurfaceCard>

      <ConfirmNameDialog
        isOpen={deleteTarget !== null}
        title="Delete WhatsApp session"
        description="This removes the Firebase session record and deletes the local WhatsApp session files."
        name={deleteTarget?.name ?? ''}
        typedName={deleteName}
        confirmLabel="Delete session"
        isBusy={isDeleting}
        onTypedNameChange={setDeleteName}
        onCancel={closeDeleteDialog}
        onConfirm={deleteSession}
      />
    </>
  )
}
