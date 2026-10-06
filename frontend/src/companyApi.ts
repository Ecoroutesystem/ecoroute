const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:5001'

export function companyFetch(path: string, init?: RequestInit) {
  const headers = new Headers(init?.headers)
  const savedSession = sessionStorage.getItem('authSession')
  let persistedToken = ''
  if (savedSession) {
    try {
      const session = JSON.parse(savedSession) as { role?: string; token?: string }
      if (session.role === 'company') persistedToken = session.token ?? ''
    } catch {
      sessionStorage.removeItem('authSession')
    }
  }
  const token = sessionStorage.getItem('companyToken') ?? persistedToken
  if (token) headers.set('Authorization', `Bearer ${token}`)
  return fetch(`${apiBase}${path}`, { ...init, headers })
}
