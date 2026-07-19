import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { loadAuthSession } from '@/lib/appState'
import { loadAuthTokens } from '@/lib/api'

export default function RequireAuth() {
  const location = useLocation()
  const authSession = loadAuthSession()
  const authTokens = loadAuthTokens()
  const isAuthenticated = Boolean(authSession || authTokens?.accessToken)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
