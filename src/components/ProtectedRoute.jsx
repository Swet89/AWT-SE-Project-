import { Navigate } from 'react-router-dom'

export default function ProtectedRoute({ children }) {
  const accessToken = sessionStorage.getItem('odysseyAccessToken')

  if (!accessToken) {
    return <Navigate to="/login" replace />
  }

  return children
}