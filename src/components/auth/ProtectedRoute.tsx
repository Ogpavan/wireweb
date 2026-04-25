import {Navigate, Outlet, useLocation} from 'react-router-dom'
import {useAuth} from '../../app/AuthProvider'

export function ProtectedRoute() {
  const {isLoading, user} = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="auth-loading" role="status" aria-live="polite">
        Loading workspace...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{from: location}} />
  }

  return <Outlet />
}
