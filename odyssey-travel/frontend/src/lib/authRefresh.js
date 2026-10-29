import axios from 'axios'
import { API } from './api.js'

let refreshRequest

function clearLocalSession() {
  sessionStorage.removeItem('odysseyAccessToken')
  sessionStorage.removeItem('odysseyUser')
  window.dispatchEvent(new Event('odyssey-auth-change'))
}

export async function signOutSession() {
  try {
    await axios.post(`${API}/auth/logout`, {}, { withCredentials: true })
  } catch {
    // Clear the local session even if the API cannot be reached.
  } finally {
    clearLocalSession()
  }
}

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const requestUrl = originalRequest?.url || ''
    const isAuthRequest = /\/auth\/(login|signup|refresh|logout)(\?|$)/.test(requestUrl)

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retried || isAuthRequest) {
      return Promise.reject(error)
    }

    originalRequest._retried = true

    try {
      if (!refreshRequest) {
        refreshRequest = axios
          .post(`${API}/auth/refresh`, {}, { withCredentials: true })
          .then((response) => {
            sessionStorage.setItem('odysseyAccessToken', response.data.accessToken)
            if (response.data.user) {
              sessionStorage.setItem('odysseyUser', JSON.stringify(response.data.user))
            }
            window.dispatchEvent(new Event('odyssey-auth-change'))
            return response.data.accessToken
          })
          .finally(() => {
            refreshRequest = undefined
          })
      }

      const accessToken = await refreshRequest
      originalRequest.headers = originalRequest.headers || {}
      originalRequest.headers.Authorization = `Bearer ${accessToken}`
      return axios(originalRequest)
    } catch (refreshError) {
      clearLocalSession()
      if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
        window.location.assign('/login')
      }
      return Promise.reject(refreshError)
    }
  },
)

