import { useEffect, useState } from 'react'
import axios from 'axios'

export default function ApiStatus() {
  const [status, setStatus] = useState('Checking API…')

  useEffect(() => {
    axios
      .get('http://localhost:5000/api/health')
      .then((response) => setStatus(response.data.message))
      .catch(() => setStatus('API is unreachable. Check that the backend is running.'))
  }, [])

  return (
    <main className="welcome-page">
      <h1>Backend connection</h1>
      <p>{status}</p>
    </main>
  )
}