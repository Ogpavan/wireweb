import {CheckIcon, CopyIcon} from '@primer/octicons-react'
import {Button} from '@primer/react'
import {updateProfile} from 'firebase/auth'
import {useEffect, useState, type FormEvent} from 'react'
import {useAuth} from '../app/AuthProvider'
import {PageHeader} from '../components/ui/PageHeader'
import {SurfaceCard} from '../components/ui/SurfaceCard'

function formatDate(value: string | null | undefined) {
  if (!value) {
    return 'Unknown'
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function SettingsPage() {
  const {user} = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [copiedField, setCopiedField] = useState<'email' | 'uid' | null>(null)

  useEffect(() => {
    setDisplayName(user?.displayName ?? '')
  }, [user?.displayName])

  async function copyValue(field: 'email' | 'uid', value: string) {
    await navigator.clipboard.writeText(value)
    setCopiedField(field)
    window.setTimeout(() => setCopiedField((current) => (current === field ? null : current)), 1200)
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!user) {
      setError('You are not signed in.')
      return
    }

    setIsSavingProfile(true)

    try {
      await updateProfile(user, {displayName: displayName.trim() || null})
      setMessage('Profile saved.')
    } catch (saveError) {
      const msg = saveError instanceof Error ? saveError.message : 'Unable to save profile.'
      setError(msg)
    } finally {
      setIsSavingProfile(false)
    }
  }

  return (
    <>
      <PageHeader title="Settings" description="Manage your profile and basic console preferences." />

      {error ? <div className="form-message form-message--error">{error}</div> : null}
      {message ? <div className="form-message form-message--success">{message}</div> : null}

      <div className="content-grid content-grid--two">
        <SurfaceCard title="Profile" description="Update your user profile details for this console.">
          <form className="api-key-form" onSubmit={saveProfile}>
            <label className="login-field">
              Display name
              <input
                className="login-input"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Your name"
                autoComplete="name"
              />
            </label>

            <label className="login-field">
              Email
              <input className="login-input" value={user?.email ?? ''} disabled />
            </label>

            <Button className="primary-button api-key-form__button" type="submit" disabled={isSavingProfile}>
              {isSavingProfile ? 'Saving' : 'Save profile'}
            </Button>
          </form>

          <div className="session-meta">
            <div>
              <div className="session-meta__row">
                <span>User ID</span>
                <strong>{user?.uid ?? 'Unknown'}</strong>
                <Button
                  className="secondary-button session-copy-button"
                  type="button"
                  leadingVisual={copiedField === 'uid' ? CheckIcon : CopyIcon}
                  aria-label="Copy user ID"
                  onClick={() => void copyValue('uid', user?.uid ?? '')}
                  disabled={!user?.uid}
                />
              </div>
              <div className="session-meta__row">
                <span>Email</span>
                <strong>{user?.email ?? 'Unknown'}</strong>
                <Button
                  className="secondary-button session-copy-button"
                  type="button"
                  leadingVisual={copiedField === 'email' ? CheckIcon : CopyIcon}
                  aria-label="Copy email"
                  onClick={() => void copyValue('email', user?.email ?? '')}
                  disabled={!user?.email}
                />
              </div>
              <div className="session-meta__row">
                <span>Last sign-in</span>
                <strong>{formatDate(user?.metadata.lastSignInTime)}</strong>
                <span />
              </div>
              <div className="session-meta__row">
                <span>Created</span>
                <strong>{formatDate(user?.metadata.creationTime)}</strong>
                <span />
              </div>
            </div>
          </div>
        </SurfaceCard>
      </div>
    </>
  )
}
