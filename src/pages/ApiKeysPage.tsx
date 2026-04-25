import {Button} from '@primer/react'
import {CheckIcon, CopyIcon, KeyIcon, PlusIcon, SyncIcon, TrashIcon} from '@primer/octicons-react'
import {useEffect, useMemo, useState} from 'react'
import type {FormEvent} from 'react'
import {ConfirmNameDialog} from '../components/ui/ConfirmNameDialog'
import {PageHeader} from '../components/ui/PageHeader'
import {StatusBadge} from '../components/ui/StatusBadge'
import {SurfaceCard} from '../components/ui/SurfaceCard'
import {apiClient, ApiError} from '../services/apiClient'
import type {APIKey, APIKeyListResponse} from '../services/backendContract'

interface FormState {
  name: string
}

const emptyForm: FormState = {
  name: '',
}

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

export function ApiKeysPage() {
  const [keys, setKeys] = useState<APIKey[]>([])
  const [form, setForm] = useState<FormState>(emptyForm)
  const [isCreating, setIsCreating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [generatedKey, setGeneratedKey] = useState('')
  const [hasCopied, setHasCopied] = useState(false)
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<APIKey | null>(null)
  const [deleteName, setDeleteName] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const sortedKeys = useMemo(
    () => [...keys].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    [keys],
  )

  async function loadKeys() {
    setIsLoading(true)
    setError('')

    try {
      const response = await apiClient.get<APIKeyListResponse>('/v1/api-keys')
      setKeys(response.keys)
    } catch (loadError) {
      setError(errorMessage(loadError))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadKeys()
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')
    setGeneratedKey('')
    setHasCopied(false)

    if (!form.name.trim()) {
      setError('Name is required.')
      return
    }

    setIsCreating(true)

    try {
      const createdKey = await apiClient.post<APIKey>('/v1/api-keys', {
        name: form.name.trim(),
      })
      setKeys((currentKeys) => [createdKey, ...currentKeys])
      setForm(emptyForm)
      setGeneratedKey(createdKey.apiKey ?? '')
      setMessage('API key generated. Copy it now; it will only be shown once.')
    } catch (createError) {
      setError(errorMessage(createError))
    } finally {
      setIsCreating(false)
    }
  }

  async function copyGeneratedKey() {
    if (!generatedKey) {
      return
    }

    await navigator.clipboard.writeText(generatedKey)
    setHasCopied(true)
  }

  function openDeleteDialog(key: APIKey) {
    setError('')
    setMessage('')
    setDeleteTarget(key)
    setDeleteName('')
  }

  function closeDeleteDialog() {
    if (isDeleting) {
      return
    }

    setDeleteTarget(null)
    setDeleteName('')
  }

  async function deleteAPIKey() {
    if (!deleteTarget || deleteName !== deleteTarget.name) {
      return
    }

    setIsDeleting(true)
    setError('')
    setMessage('')

    try {
      await apiClient.delete<void>(`/v1/api-keys/${deleteTarget.id}`, {name: deleteName})
      setKeys((currentKeys) => currentKeys.filter((key) => key.id !== deleteTarget.id))
      setDeleteTarget(null)
      setDeleteName('')
      setMessage('API key deleted.')
    } catch (deleteError) {
      setError(errorMessage(deleteError))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <PageHeader
        title="API Keys"
        description="Create, rotate, and monitor scoped credentials for server-side integrations."
        actions={
          <Button className="secondary-button" leadingVisual={SyncIcon} onClick={loadKeys} disabled={isLoading}>
            Refresh
          </Button>
        }
      />

      <SurfaceCard title="Create key" description="Name the credential and the server will generate the API key.">
        <form className="api-key-form" onSubmit={handleSubmit}>
          <label className="login-field">
            Name
            <input
              className="login-input"
              value={form.name}
              onChange={(event) => setForm((current) => ({...current, name: event.target.value}))}
              placeholder="Production server"
              autoComplete="off"
            />
          </label>
          <Button className="primary-button api-key-form__button" type="submit" leadingVisual={PlusIcon} disabled={isCreating}>
            {isCreating ? 'Saving' : 'Create key'}
          </Button>
        </form>
        {error && <div className="form-message form-message--error">{error}</div>}
        {message && <div className="form-message form-message--success">{message}</div>}
        {generatedKey && (
          <div className="generated-key">
            <code>{generatedKey}</code>
            <Button
              className="secondary-button"
              type="button"
              leadingVisual={hasCopied ? CheckIcon : CopyIcon}
              onClick={copyGeneratedKey}
            >
              {hasCopied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        )}
      </SurfaceCard>

      <SurfaceCard title="Keys" description="Masked credentials saved for the signed-in Firebase user.">
        {isLoading ? (
          <div className="table-empty">Loading keys...</div>
        ) : sortedKeys.length === 0 ? (
          <div className="table-empty">
            <KeyIcon size={18} />
            <span>No API keys saved yet.</span>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Key</th>
                <th>Created</th>
                <th>Health</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedKeys.map((key) => (
                <tr key={key.id}>
                  <td>{key.name}</td>
                  <td><code>{key.maskedKey}</code></td>
                  <td>{formatDate(key.createdAt)}</td>
                  <td><StatusBadge variant="success">active</StatusBadge></td>
                  <td>
                    <Button
                      className="danger-ghost-button"
                      type="button"
                      leadingVisual={TrashIcon}
                      onClick={() => openDeleteDialog(key)}
                      aria-label={`Delete ${key.name}`}
                    >
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SurfaceCard>

      <ConfirmNameDialog
        isOpen={deleteTarget !== null}
        title="Delete API key"
        description="This permanently removes the saved credential for this Firebase user."
        name={deleteTarget?.name ?? ''}
        typedName={deleteName}
        confirmLabel="Delete key"
        isBusy={isDeleting}
        onTypedNameChange={setDeleteName}
        onCancel={closeDeleteDialog}
        onConfirm={deleteAPIKey}
      />
    </>
  )
}
