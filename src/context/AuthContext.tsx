import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { AppUser } from '@/types'
import { DEMO_USERS } from '@/data/users'
import { dataStore } from '@/lib/db'

const SESSION_KEY = 'cpac_session_user_v1'

interface AuthContextValue {
  user: AppUser | null
  login: (username: string, password: string) => { ok: boolean; message?: string }
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadSession(): AppUser | null {
  const raw = sessionStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AppUser
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(() => loadSession())

  const login = useCallback((username: string, password: string) => {
    const match = DEMO_USERS.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password,
    )
    if (!match) {
      return { ok: false, message: 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง' }
    }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(match))
    setUser(match)
    void dataStore.logActivity({
      userName: match.displayName,
      userRole: match.role,
      action: 'เข้าสู่ระบบ',
      detail: `${match.displayName} เข้าสู่ระบบสำเร็จในฐานะ ${match.role === 'admin' ? 'แอดมิน' : 'เจ้าหน้าที่'}`,
    })
    return { ok: true }
  }, [])

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY)
    setUser(null)
  }, [])

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
