import {AlertIcon, MarkGithubIcon} from '@primer/octicons-react'
import {Button, Heading, Text} from '@primer/react'
import {FormEvent, useState} from 'react'
import {Navigate, useLocation, useNavigate, type Location} from 'react-router-dom'
import {useAuth} from '../app/AuthProvider'

interface LoginLocationState {
  from?: Location
}

function getLoginErrorMessage(error: unknown) {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : ''

  if (code.includes('auth/invalid-credential') || code.includes('auth/wrong-password')) {
    return 'The email or password is incorrect.'
  }

  if (code.includes('auth/user-not-found')) {
    return 'No Firebase user exists for that email.'
  }

  if (code.includes('auth/too-many-requests')) {
    return 'Too many failed attempts. Try again later.'
  }

  return 'Unable to sign in. Check the account and try again.'
}

export function LoginPage() {
  const {isLoading, login, user} = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const state = location.state as LoginLocationState | null
  const destination = state?.from?.pathname ?? '/'

  if (!isLoading && user) {
    return <Navigate to={destination} replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await login(email.trim(), password)
      navigate(destination, {replace: true})
    } catch (loginError) {
      setError(getLoginErrorMessage(loginError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel" aria-labelledby="login-title">
        <div className="login-panel__brand">
          <div className="login-panel__mark" aria-hidden="true">
            <MarkGithubIcon size={22} />
          </div>
          <div>
            <Text as="p" className="login-panel__eyebrow">
              Wire Console
            </Text>
            <Heading as="h1" id="login-title" className="login-panel__title">
              Sign in to API Platform
            </Heading>
          </div>
        </div>

        <Text as="p" className="login-panel__description">
          Use a Firebase Email/Password user created in the Firebase console.
        </Text>

        {error && (
          <div className="login-error" role="alert">
            <AlertIcon aria-hidden="true" size={16} />
            <span>{error}</span>
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-field">
            <span>Email</span>
            <input
              autoComplete="email"
              autoFocus
              className="login-input"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@example.com"
              required
              type="email"
              value={email}
            />
          </label>

          <label className="login-field">
            <span>Password</span>
            <input
              autoComplete="current-password"
              className="login-input"
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
              required
              type="password"
              value={password}
            />
          </label>

          <Button className="primary-button login-button" disabled={isSubmitting || isLoading} type="submit">
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </section>
    </main>
  )
}
