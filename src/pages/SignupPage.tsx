import {AlertIcon, MarkGithubIcon} from '@primer/octicons-react'
import {Button, Heading, Text} from '@primer/react'
import {FormEvent, useState} from 'react'
import {Link, Navigate, useNavigate} from 'react-router-dom'
import {ApiError} from '../services/apiClient'
import {useAuth} from '../app/AuthProvider'

function getSignupErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 409) {
      return 'An account with this email already exists.'
    }
    if (error.status === 400) {
      return error.message || 'Please check your signup details.'
    }
  }

  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : ''
  if (code.includes('auth/email-already-in-use')) {
    return 'An account with this email already exists.'
  }

  return 'Unable to create account. Try again.'
}

export function SignupPage() {
  const {isLoading, signup, user} = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isLoading && user) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setIsSubmitting(true)
    try {
      await signup(fullName.trim(), email.trim(), password)
      navigate('/', {replace: true})
    } catch (signupError) {
      setError(getSignupErrorMessage(signupError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel" aria-labelledby="signup-title">
        <div className="login-panel__brand">
          <div className="login-panel__mark" aria-hidden="true">
            <MarkGithubIcon size={22} />
          </div>
          <div>
            <Text as="p" className="login-panel__eyebrow">
              Wire Console
            </Text>
            <Heading as="h1" id="signup-title" className="login-panel__title">
              Create your account
            </Heading>
          </div>
        </div>

        {error && (
          <div className="login-error" role="alert">
            <AlertIcon aria-hidden="true" size={16} />
            <span>{error}</span>
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-field">
            <span>Full name</span>
            <input
              autoComplete="name"
              autoFocus
              className="login-input"
              name="fullName"
              onChange={(event) => setFullName(event.target.value)}
              required
              type="text"
              value={fullName}
            />
          </label>

          <label className="login-field">
            <span>Email</span>
            <input
              autoComplete="email"
              className="login-input"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>

          <label className="login-field">
            <span>Password</span>
            <input
              autoComplete="new-password"
              className="login-input"
              minLength={6}
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>

          <label className="login-field">
            <span>Confirm password</span>
            <input
              autoComplete="new-password"
              className="login-input"
              minLength={6}
              name="confirmPassword"
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              type="password"
              value={confirmPassword}
            />
          </label>

          <Button className="primary-button login-button" disabled={isSubmitting || isLoading} type="submit">
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </Button>
        </form>

        <Text as="p" className="login-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </Text>
      </section>
    </main>
  )
}
