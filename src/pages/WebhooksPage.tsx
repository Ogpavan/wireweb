import {Button} from '@primer/react'
import {SyncIcon} from '@primer/octicons-react'
import {useEffect, useState} from 'react'
import type {FormEvent} from 'react'
import {PageHeader} from '../components/ui/PageHeader'
import {SurfaceCard} from '../components/ui/SurfaceCard'
import {ApiError, apiClient} from '../services/apiClient'

interface WebhookConfigResponse {
  url: string
}

function errorMessage(error: unknown) {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message
  }

  return 'Something went wrong.'
}

export function WebhooksPage() {
  const [url, setURL] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function loadWebhook() {
    setIsLoading(true)
    setError('')

    try {
      const response = await apiClient.get<WebhookConfigResponse>('/v1/webhooks/incoming')
      setURL(response.url)
    } catch (loadError) {
      setError(errorMessage(loadError))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadWebhook()
  }, [])

  async function saveWebhook(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setError('')
    setMessage('')

    try {
      const response = await apiClient.post<WebhookConfigResponse>('/v1/webhooks/incoming', {url: url.trim()})
      setURL(response.url)
      setMessage(response.url ? 'Incoming webhook URL saved.' : 'Incoming webhook disabled.')
    } catch (saveError) {
      setError(errorMessage(saveError))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Webhooks"
        description="Receive inbound WhatsApp messages by forwarding message.received events to your endpoint."
        actions={
          <Button className="secondary-button" leadingVisual={SyncIcon} onClick={loadWebhook} disabled={isLoading}>
            Refresh
          </Button>
        }
      />

      <SurfaceCard title="Incoming messages" description="The server POSTs a JSON payload here when a connected WhatsApp session receives a text message.">
        <form className="login-form" onSubmit={saveWebhook}>
          <label className="login-field">
            Webhook URL
            <input
              className="login-input"
              value={url}
              onChange={(event) => setURL(event.target.value)}
              placeholder="https://example.com/webhooks/whatsapp"
              disabled={isLoading}
            />
          </label>
          <Button className="primary-button api-send-button" type="submit" disabled={isSaving || isLoading}>
            {isSaving ? 'Saving' : 'Save webhook'}
          </Button>
        </form>
        {error && <div className="form-message form-message--error">{error}</div>}
        {message && <div className="form-message form-message--success">{message}</div>}
      </SurfaceCard>

      <SurfaceCard title="Payload shape" description="Your endpoint should accept POST requests with application/json.">
        <pre className="code-sample">
          <code>{JSON.stringify({
            event: 'message.received',
            sessionId: 'ws_h7x2q',
            messageId: '3EB0...',
            chat: '15551234567@s.whatsapp.net',
            sender: '15551234567@s.whatsapp.net',
            from: '15551234567',
            text: 'hello',
            type: 'text',
            pushName: 'Ava',
            isGroup: false,
            timestamp: new Date('2026-04-24T06:30:00.000Z').toISOString(),
          }, null, 2)}</code>
        </pre>
      </SurfaceCard>
    </>
  )
}
