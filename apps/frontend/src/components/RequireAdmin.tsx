import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { loadAuthSession } from '@/lib/appState'

export default function RequireAdmin() {
  const location = useLocation()
  const session = loadAuthSession()

  if (session?.role && session.role !== 'admin') {
    return <Navigate to="/not-found" replace state={{ from: location }} />
  }

  return <Outlet />
}
