import { useEffect, useState } from 'react'

export default function ToastViewport() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    const timers = new Map()

    function addToast(event) {
      const toast = {
        id: `${Date.now()}-${Math.random()}`,
        message: event.detail?.message || 'Done.',
        type: event.detail?.type || 'success',
      }

      setToasts((current) => [...current.slice(-2), toast])
      timers.set(toast.id, window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== toast.id))
        timers.delete(toast.id)
      }, 4200))
    }

    window.addEventListener('odyssey-toast', addToast)
    return () => {
      window.removeEventListener('odyssey-toast', addToast)
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [])

  function dismiss(id) {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }

  return (
    <div className="toast-viewport" aria-label="Notifications">
      {toasts.map((toast) => (
        <div
          className={`app-toast toast-${toast.type}`}
          key={toast.id}
          role={toast.type === 'error' ? 'alert' : 'status'}
        >
          <span>{toast.message}</span>
          <button type="button" onClick={() => dismiss(toast.id)} aria-label="Dismiss notification">×</button>
        </div>
      ))}
    </div>
  )
}
