import {Button, Text} from '@primer/react'
import {SyncIcon} from '@primer/octicons-react'
import {useEffect, useState} from 'react'
import type {FormEvent} from 'react'
import {PageHeader} from '../components/ui/PageHeader'
import {StatusBadge} from '../components/ui/StatusBadge'
import {SurfaceCard} from '../components/ui/SurfaceCard'
import {ApiError, apiClient} from '../services/apiClient'
import type {RateLimitConfig, RateLimitResponse} from '../services/backendContract'

const defaultRateLimits: RateLimitConfig = {
  messagePerMinute: 60,
  mediaPerMinute: 30,
  apiKeyPerMinute: 15,
  sessionPerMinute: 10,
  webhookPerMinute: 120,
  contactsPerMinute: 40,
  chatsPerMinute: 40,
  logsPerMinute: 120,
  sendDelayMs: 0,
}

const rateLimitFields = [
  {key: 'messagePerMinute', label: 'Messages sent / minute', description: 'Outbound text sends across all sessions.'},
  {key: 'mediaPerMinute', label: 'Media sent / minute', description: 'Outbound images, videos, audio, and documents.'},
] as const

function errorMessage(error: unknown) {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message
  }

  return 'Something went wrong.'
}

function formatLimit(value: number) {
  return value > 0 ? `${value} / minute` : 'Unlimited'
}

function formatDelay(value: number) {
  return value > 0 ? `${value} ms` : 'No delay'
}

export function AnalyticsPage() {
  const [config, setConfig] = useState<RateLimitConfig>(defaultRateLimits)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function loadRateLimits() {
    setIsLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await apiClient.get<RateLimitResponse>('/v1/rate-limits')
      setConfig(response.rateLimits)
    } catch (loadError) {
      setError(errorMessage(loadError))
    } finally {
      setIsLoading(false)
    }
  }

  async function saveRateLimits(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setError('')
    setMessage('')

    try {
      const response = await apiClient.put<RateLimitResponse>('/v1/rate-limits', {rateLimits: config})
      setConfig(response.rateLimits)
      setMessage(`Rate limits saved at ${new Date(response.updatedAt ?? Date.now()).toLocaleString()}.`)
    } catch (saveError) {
      setError(errorMessage(saveError))
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    void loadRateLimits()
  }, [])

  const summaryCards = [
    {label: 'Messages', value: formatLimit(config.messagePerMinute), detail: 'Text sends', status: 'success'},
    {label: 'Media', value: formatLimit(config.mediaPerMinute), detail: 'File uploads', status: 'info'},
    {label: 'Delay', value: formatDelay(config.sendDelayMs), detail: 'Between sends', status: 'neutral'},
  ] as const

  return (
    <>
      <PageHeader
        title="Rate Limits"
        description="Configure per-action ceilings and the delay inserted between outbound messages for your account."
        actions={
          <Button className="secondary-button" leadingVisual={SyncIcon} onClick={() => void loadRateLimits()} disabled={isLoading || isSaving}>
            Refresh
          </Button>
        }
      />

      {error ? <div className="form-message form-message--error">{error}</div> : null}
      {message ? <div className="form-message form-message--success">{message}</div> : null}

      <div className="metric-grid">
        {summaryCards.map((card) => (
          <SurfaceCard key={card.label} className="metric-card">
            <Text as="p" className="metric-card__label">
              {card.label}
            </Text>
            <Text as="p" className="metric-card__value">
              {isLoading ? '—' : card.value}
            </Text>
            <StatusBadge variant={card.status}>{card.detail}</StatusBadge>
          </SurfaceCard>
        ))}
      </div>

      <div className="content-grid content-grid--two">
        <SurfaceCard title="Configure limits" description="These values are stored in Firebase for the signed-in user.">
          <form className="rate-limit-form" onSubmit={saveRateLimits}>
            <div className="rate-limit-grid">
              {rateLimitFields.map((field) => {
                const value = config[field.key]

                return (
                  <label className="login-field" key={field.key}>
                    {field.label}
                    <input
                      className="login-input"
                      type="number"
                      min={0}
                      step={1}
                      value={value}
                      onChange={(event) =>
                        setConfig((current) => ({
                          ...current,
                          [field.key]: Number(event.target.value) || 0,
                        }))
                      }
                    />
                    <span className="rate-limit-field__hint">{field.description}</span>
                  </label>
                )
              })}
            </div>

            <label className="login-field rate-limit-delay">
              Delay between messages (ms)
              <input
                className="login-input"
                type="number"
                min={0}
                step={100}
                value={config.sendDelayMs}
                onChange={(event) =>
                  setConfig((current) => ({
                    ...current,
                    sendDelayMs: Number(event.target.value) || 0,
                  }))
                }
              />
              <span className="rate-limit-field__hint">
                This delay is enforced before the next outbound message or media send for the same user.
              </span>
            </label>

            <div className="rate-limit-actions">
              <Button className="primary-button" type="submit" disabled={isSaving || isLoading}>
                {isSaving ? 'Saving' : 'Save limits'}
              </Button>
              <Button
                className="secondary-button"
                type="button"
                onClick={() => setConfig(defaultRateLimits)}
                disabled={isSaving || isLoading}
              >
                Reset defaults
              </Button>
            </div>
          </form>
        </SurfaceCard>

        <SurfaceCard title="Current settings" description="Review the active limits before saving them.">
          <table className="data-table">
            <thead>
              <tr>
                <th>Control</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Messages</td>
                <td>{formatLimit(config.messagePerMinute)}</td>
              </tr>
              <tr>
                <td>Media</td>
                <td>{formatLimit(config.mediaPerMinute)}</td>
              </tr>
              <tr>
                <td>Delay between messages</td>
                <td>{formatDelay(config.sendDelayMs)}</td>
              </tr>
            </tbody>
          </table>
        </SurfaceCard>
      </div>
    </>
  )
}
