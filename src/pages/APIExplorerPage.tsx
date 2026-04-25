import {Button, Label} from '@primer/react'
import {CopyIcon, SearchIcon, SyncIcon} from '@primer/octicons-react'
import {useMemo, useState} from 'react'
import {PageHeader} from '../components/ui/PageHeader'
import {SurfaceCard} from '../components/ui/SurfaceCard'

type ExplorerTab = 'request' | 'response' | 'code'

interface MethodSpec {
  title: string
  method: 'GET' | 'POST' | 'DELETE'
  endpoint: string
  summary: string
  headers: Array<{name: string; value: string}>
  params: Array<{name: string; type: string; required: boolean; description: string}>
  requestExample: string
  responseExample: string
  curl: string
  status: string
}

const methods: MethodSpec[] = [
  {
    title: 'Send Message',
    method: 'POST',
    endpoint: '/v1/messages',
    summary: 'Send a text message through a connected WhatsApp session.',
    headers: [
      {name: 'Authorization', value: 'Bearer <api-key>'},
      {name: 'Content-Type', value: 'application/json'},
    ],
    params: [
      {name: 'sessionId', type: 'string', required: true, description: 'Short session ID such as `ws_h7x2q`.'},
      {name: 'to', type: 'string', required: true, description: 'Destination contact or JID.'},
      {name: 'text', type: 'string', required: true, description: 'Message body.'},
    ],
    requestExample: JSON.stringify({sessionId: 'ws_h7x2q', to: '15551234567', text: 'Deployment complete'}, null, 2),
    responseExample: JSON.stringify({messageId: 'msg_8f2a91', status: 'queued'}, null, 2),
    curl: `curl -X POST https://api.example.com/v1/messages \\
  -H "Authorization: Bearer <api-key>" \\
  -H "Content-Type: application/json" \\
  -d '{"sessionId":"ws_h7x2q","to":"15551234567","text":"Deployment complete"}'`,
    status: '202 Accepted',
  },
  {
    title: 'Send Media',
    method: 'POST',
    endpoint: '/v1/media',
    summary: 'Send an image, video, or document through a session.',
    headers: [
      {name: 'Authorization', value: 'Bearer <api-key>'},
      {name: 'Content-Type', value: 'application/json'},
    ],
    params: [
      {name: 'sessionId', type: 'string', required: true, description: 'Short session ID.'},
      {name: 'to', type: 'string', required: true, description: 'Destination contact.'},
      {name: 'file', type: 'file', required: true, description: 'Media file uploaded as multipart/form-data.'},
      {name: 'mediaType', type: 'string', required: false, description: 'image, video, audio, or document. Inferred from MIME type when omitted.'},
      {name: 'caption', type: 'string', required: false, description: 'Caption for images, videos, and documents.'},
      {name: 'fileName', type: 'string', required: false, description: 'Document filename override.'},
    ],
    requestExample: JSON.stringify(
      {
        sessionId: 'ws_h7x2q',
        to: '15551234567',
        mediaType: 'document',
        caption: 'Invoice attached',
        fileName: 'invoice.pdf',
      },
      null,
      2,
    ),
    responseExample: JSON.stringify({messageId: 'msg_9c3d42', status: 'sent'}, null, 2),
    curl: `curl -X POST https://api.example.com/v1/media \\
  -H "Authorization: Bearer <api-key>" \\
  -F "sessionId=ws_h7x2q" \\
  -F "to=15551234567" \\
  -F "mediaType=document" \\
  -F "caption=Invoice attached" \\
  -F "fileName=invoice.pdf" \\
  -F "file=@./invoice.pdf"`,
    status: '202 Accepted',
  },
  {
    title: 'Get Contacts',
    method: 'GET',
    endpoint: '/v1/contacts',
    summary: 'List contacts available to the account.',
    headers: [{name: 'Authorization', value: 'Bearer <api-key>'}],
    params: [
      {name: 'sessionId', type: 'string', required: true, description: 'Short session ID.'},
      {name: 'limit', type: 'number', required: false, description: 'Optional result limit.'},
    ],
    requestExample: JSON.stringify({sessionId: 'ws_h7x2q', limit: 20}, null, 2),
    responseExample: JSON.stringify({contacts: [{jid: '15551234567@s.whatsapp.net', phone: '15551234567', fullName: 'Ava'}]}, null, 2),
    curl: `curl "https://api.example.com/v1/contacts?sessionId=ws_h7x2q&limit=20" \\
  -H "Authorization: Bearer <api-key>"`,
    status: '200 OK',
  },
  {
    title: 'List Chats',
    method: 'GET',
    endpoint: '/v1/chats',
    summary: 'Enumerate recent chats for the connected session.',
    headers: [{name: 'Authorization', value: 'Bearer <api-key>'}],
    params: [
      {name: 'sessionId', type: 'string', required: true, description: 'Short session ID.'},
      {name: 'limit', type: 'number', required: false, description: 'Optional result limit.'},
    ],
    requestExample: JSON.stringify({sessionId: 'ws_h7x2q', limit: 20}, null, 2),
    responseExample: JSON.stringify({chats: [{jid: '15551234567@s.whatsapp.net', phone: '15551234567', name: 'Ava', pinned: false, archived: false}]}, null, 2),
    curl: `curl "https://api.example.com/v1/chats?sessionId=ws_h7x2q&limit=20" \\
  -H "Authorization: Bearer <api-key>"`,
    status: '200 OK',
  },
  {
    title: 'Session Status',
    method: 'GET',
    endpoint: '/v1/whatsapp/sessions/{sessionId}',
    summary: 'Check whether a session is disconnected, pairing, or connected.',
    headers: [{name: 'Authorization', value: 'Bearer <api-key>'}],
    params: [{name: 'sessionId', type: 'string', required: true, description: 'Short session ID.'}],
    requestExample: JSON.stringify({sessionId: 'ws_h7x2q'}, null, 2),
    responseExample: JSON.stringify({id: 'ws_h7x2q', status: 'connected', phoneNumber: '15551234567'}, null, 2),
    curl: `curl https://api.example.com/v1/whatsapp/sessions/ws_h7x2q \\
  -H "Authorization: Bearer <api-key>"`,
    status: '200 OK',
  },
  {
    title: 'Configure Incoming Webhook',
    method: 'POST',
    endpoint: '/v1/webhooks/incoming',
    summary: 'Save the endpoint that receives inbound WhatsApp message.received events.',
    headers: [
      {name: 'Authorization', value: 'Bearer <firebase-id-token>'},
      {name: 'Content-Type', value: 'application/json'},
    ],
    params: [{name: 'url', type: 'string', required: true, description: 'Your HTTPS endpoint for inbound message events.'}],
    requestExample: JSON.stringify({url: 'https://example.com/webhooks/whatsapp'}, null, 2),
    responseExample: JSON.stringify({url: 'https://example.com/webhooks/whatsapp'}, null, 2),
    curl: `curl -X POST https://api.example.com/v1/webhooks/incoming \\
  -H "Authorization: Bearer <firebase-id-token>" \\
  -H "Content-Type: application/json" \\
  -d '{"url":"https://example.com/webhooks/whatsapp"}'`,
    status: '200 OK',
  },
  {
    title: 'Other methods',
    method: 'POST',
    endpoint: '/v1/typing',
    summary: 'Placeholder for additional methods you can open later.',
    headers: [{name: 'Authorization', value: 'Bearer <api-key>'}],
    params: [{name: 'sessionId', type: 'string', required: true, description: 'Short session ID.'}],
    requestExample: JSON.stringify({sessionId: 'ws_h7x2q'}, null, 2),
    responseExample: JSON.stringify({status: 'idle'}, null, 2),
    curl: `curl -X POST https://api.example.com/v1/typing \\
  -H "Authorization: Bearer <api-key>" \\
  -H "Content-Type: application/json" \\
  -d '{"sessionId":"ws_h7x2q"}'`,
    status: '200 OK',
  },
]

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')

function prettyJSON(value: string) {
  try {
    return JSON.stringify(JSON.parse(value), null, 2)
  } catch {
    return value
  }
}

function updateSessionIDInBody(body: string, nextSessionID: string) {
  try {
    const parsedBody = JSON.parse(body) as Record<string, unknown>
    return JSON.stringify({...parsedBody, sessionId: nextSessionID}, null, 2)
  } catch {
    return body
  }
}

export function APIExplorerPage() {
  const [selectedMethodIndex, setSelectedMethodIndex] = useState(0)
  const [activeTab, setActiveTab] = useState<ExplorerTab>('request')
  const [apiToken, setApiToken] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [requestBody, setRequestBody] = useState(prettyJSON(methods[0].requestExample))
  const [statusCode, setStatusCode] = useState(methods[0].status)
  const [responseBody, setResponseBody] = useState(prettyJSON(methods[0].responseExample))
  const [copied, setCopied] = useState<'curl' | 'response' | 'body' | ''>('')
  const [requestNote, setRequestNote] = useState('')
  const [isSending, setIsSending] = useState(false)

  const method = methods[selectedMethodIndex]
  const isMediaMethod = method.endpoint === '/v1/media'
  const curlSnippet = useMemo(() => method.curl.replaceAll('https://api.example.com', apiBaseUrl), [method.curl])

  function selectMethod(index: number) {
    const nextMethod = methods[index]
    setSelectedMethodIndex(index)
    setActiveTab('request')
    setRequestBody(prettyJSON(nextMethod.requestExample))
    setStatusCode(nextMethod.status)
    setResponseBody(prettyJSON(nextMethod.responseExample))
    setRequestNote('')
    setCopied('')
    setMediaFile(null)
  }

  async function copyText(text: string, kind: 'curl' | 'response' | 'body') {
    await navigator.clipboard.writeText(text)
    setCopied(kind)
  }

  function updateSessionID(nextSessionID: string) {
    setSessionId(nextSessionID)
    setRequestBody((currentBody) => updateSessionIDInBody(currentBody, nextSessionID))
  }

  async function sendRequest() {
    setRequestNote('')
    setIsSending(true)

    try {
      const parsedBody = JSON.parse(requestBody) as Record<string, string>
      const effectiveSessionId = sessionId.trim() || parsedBody.sessionId

      let response: Response
      if (isMediaMethod) {
        if (!mediaFile) {
          throw new Error('Select a media file before sending.')
        }

        const formData = new FormData()
        formData.set('sessionId', effectiveSessionId)
        formData.set('to', parsedBody.to ?? '')
        formData.set('mediaType', parsedBody.mediaType ?? '')
        formData.set('caption', parsedBody.caption ?? '')
        formData.set('fileName', parsedBody.fileName || mediaFile.name)
        formData.set('file', mediaFile)

        response = await fetch(`${apiBaseUrl}${method.endpoint}`, {
          method: method.method,
          headers: {
            Authorization: `Bearer ${apiToken.trim()}`,
          },
          body: formData,
        })
      } else {
        const payload = {
          ...parsedBody,
          sessionId: effectiveSessionId,
        }
        const endpoint = method.endpoint.replace('{sessionId}', encodeURIComponent(String(effectiveSessionId)))
        const requestURL = new URL(`${apiBaseUrl}${endpoint}`)

        if (method.method === 'GET') {
          Object.entries(payload).forEach(([key, value]) => {
            if (key !== 'sessionId' && value !== undefined && value !== null && value !== '') {
              requestURL.searchParams.set(key, String(value))
            }
          })
        }

        response = await fetch(requestURL.toString(), {
          method: method.method,
          headers: {
            Authorization: `Bearer ${apiToken.trim()}`,
            ...(method.method === 'GET' ? {} : {'Content-Type': 'application/json'}),
          },
          body: method.method === 'GET' ? undefined : JSON.stringify(payload),
        })
      }
      const contentType = response.headers.get('content-type')
      const payloadText = contentType?.includes('application/json')
        ? JSON.stringify(await response.json(), null, 2)
        : await response.text()

      setStatusCode(`${response.status} ${response.statusText}`.trim())
      setResponseBody(payloadText)
      setRequestNote(response.ok ? 'Request sent.' : 'Request failed. Check the response tab for details.')
      setActiveTab('response')
    } catch (error) {
      setStatusCode('400 Bad Request')
      setResponseBody(JSON.stringify({message: error instanceof Error ? error.message : 'Invalid request'}, null, 2))
      setRequestNote('Request failed before it reached the API.')
      setActiveTab('response')
    } finally {
      setIsSending(false)
    }
  }

  const requestSections = useMemo(
    () => [
      {label: 'Request', value: 'request' as const},
      {label: 'Response', value: 'response' as const},
      {label: 'Code', value: 'code' as const},
    ],
    [],
  )

  return (
    <>
      <PageHeader
        title="API Explorer"
        actions={
          <Button className="secondary-button" leadingVisual={SyncIcon} onClick={() => selectMethod(selectedMethodIndex)}>
            Reset
          </Button>
        }
      />

      <div className="api-explorer">
        <SurfaceCard title="Methods" description="Pick a method. The selected request drives the detail panel.">
          <div className="api-method-list" role="list">
            {methods.map((item, index) => (
              <button
                key={item.title}
                type="button"
                className={`api-method${index === selectedMethodIndex ? ' api-method--active' : ''}`}
                onClick={() => selectMethod(index)}
              >
                <div className="api-method__top">
                  <Label>{item.method}</Label>
                  <span>{item.title}</span>
                </div>
                <div className="api-method__endpoint">{item.endpoint}</div>
                <div className="api-method__summary">{item.summary}</div>
              </button>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard
          title={`${method.method} ${method.endpoint}`}
          description={method.summary}
          actions={
            <div className="api-tabs" role="tablist" aria-label="Request panels">
              {requestSections.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  className={`api-tab${activeTab === tab.value ? ' api-tab--active' : ''}`}
                  onClick={() => setActiveTab(tab.value)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          }
        >
          {activeTab === 'request' && (
            <div className="api-request">
              <div className="api-meta-grid">
                <div>
                  <span>Method</span>
                  <strong>{method.method}</strong>
                </div>
                <div>
                  <span>Endpoint</span>
                  <strong>{method.endpoint}</strong>
                </div>
              </div>
              <div className="api-live-fields">
                <label className="login-field">
                  API token
                  <input
                    className="login-input"
                    type="password"
                    value={apiToken}
                    onChange={(event) => setApiToken(event.target.value)}
                    placeholder="Paste API key"
                  />
                </label>
                <label className="login-field">
                  Session ID
                  <input
                    className="login-input"
                    value={sessionId}
                    onChange={(event) => updateSessionID(event.target.value)}
                    placeholder="ws_h7x2q"
                  />
                </label>
              </div>
              <div className="api-section">
                <div className="api-section__title">Params</div>
                <div className="api-table-wrap">
                  <table className="api-detail-table">
                    <thead>
                      <tr>
                        <th scope="col">Name</th>
                        <th scope="col">Type</th>
                        <th scope="col">Required</th>
                        <th scope="col">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {method.params.map((param) => (
                        <tr key={param.name}>
                          <td>
                            <strong>{param.name}</strong>
                          </td>
                          <td>{param.type}</td>
                          <td>{param.required ? 'Yes' : 'No'}</td>
                          <td>{param.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="api-section">
                <div className="api-section__title">Headers</div>
                <div className="api-table-wrap">
                  <table className="api-detail-table">
                    <thead>
                      <tr>
                        <th scope="col">Name</th>
                        <th scope="col">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {method.headers.map((header) => (
                        <tr key={header.name}>
                          <td>
                            <strong>{header.name}</strong>
                          </td>
                          <td>{header.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <label className="login-field">
                {isMediaMethod ? 'Form fields' : 'Body'}
                <textarea
                  className="api-editor"
                  value={requestBody}
                  onChange={(event) => setRequestBody(event.target.value)}
                  rows={10}
                />
              </label>
              {isMediaMethod && (
                <label className="login-field">
                  File
                  <input
                    className="login-input"
                    type="file"
                    onChange={(event) => setMediaFile(event.target.files?.[0] ?? null)}
                  />
                </label>
              )}
              {requestNote && <div className="form-message form-message--success">{requestNote}</div>}
              <Button className="primary-button api-send-button" type="button" onClick={() => void sendRequest()} disabled={isSending}>
                {isSending ? 'Sending...' : 'Send'}
              </Button>
            </div>
          )}

          {activeTab === 'response' && (
            <div className="api-response-panel">
              <div className="api-status">
                <span>Status code</span>
                <strong>{statusCode}</strong>
              </div>
              <div className="api-code-box">
                <Button className="secondary-button api-code-copy" type="button" leadingVisual={CopyIcon} onClick={() => void copyText(responseBody, 'response')}>
                  {copied === 'response' ? 'Copied' : 'Copy response'}
                </Button>
                <pre className="code-sample api-response-preview"><code>{responseBody}</code></pre>
              </div>
              <div className="api-copy-row">
                <Button className="secondary-button" type="button" leadingVisual={SearchIcon} onClick={() => setActiveTab('request')}>
                  Back to request
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'code' && (
            <div className="api-code-panel">
              <div className="api-right-block">
                <div className="api-right-block__title">cURL snippet</div>
                <div className="api-code-box">
                  <Button className="secondary-button api-code-copy" type="button" leadingVisual={CopyIcon} onClick={() => void copyText(curlSnippet, 'curl')}>
                    {copied === 'curl' ? 'Copied' : 'Copy cURL'}
                  </Button>
                  <pre className="code-sample api-right-code"><code>{curlSnippet}</code></pre>
                </div>
              </div>
              <div className="api-right-block">
                <div className="api-right-block__title">Request body</div>
                <div className="api-code-box">
                  <Button className="secondary-button api-code-copy" type="button" leadingVisual={CopyIcon} onClick={() => void copyText(prettyJSON(requestBody), 'body')}>
                    {copied === 'body' ? 'Copied' : 'Copy body'}
                  </Button>
                  <pre className="code-sample api-right-code"><code>{prettyJSON(requestBody)}</code></pre>
                </div>
              </div>
            </div>
          )}
        </SurfaceCard>
      </div>
    </>
  )
}
