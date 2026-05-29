/**
 * Auth Context · 用户认证状态管理
 *
 * 当前为 Mock 实现（前端写死账号）。真实后端就绪时只需替换 login() 内部：
 *
 * ```typescript
 * const res = await fetch('/api/auth/login', {
 *   method: 'POST',
 *   body: JSON.stringify({ username, password })
 * })
 * const { token, user } = await res.json()
 * ```
 *
 * UI 层完全不需要改动。
 */
import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { AuthUser, AuthContextState, UserRole } from '@/types'

// ─── Mock 账号库（真实接入时由后端校验） ──────────────────
const MOCK_ACCOUNTS: Array<{
  username: string
  password: string
  displayName: string
  role: UserRole
}> = [
  { username: 'admin',   password: 'admin123', displayName: '管理员',   role: 'admin' },
  { username: 'student', password: '123456',   displayName: '同学小张', role: 'student' },
]

const STORAGE_KEY = 'gaokao_auth_user'

function loadUserFromStorage(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

function saveUserToStorage(user: AuthUser | null) {
  try {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // 忽略存储错误
  }
}

export const AuthContext = createContext<AuthContextState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => loadUserFromStorage())

  // 持久化
  useEffect(() => {
    saveUserToStorage(user)
  }, [user])

  const login = useCallback(
    async (username: string, password: string): Promise<{ ok: boolean; message?: string }> => {
      // 模拟 600ms 网络延迟（让 UI 有 loading 体验）
      await new Promise(r => setTimeout(r, 600))

      const account = MOCK_ACCOUNTS.find(
        a => a.username === username.trim() && a.password === password
      )

      if (!account) {
        return { ok: false, message: '账号或密码错误' }
      }

      const newUser: AuthUser = {
        username: account.username,
        displayName: account.displayName,
        role: account.role,
        token: `mock_token_${account.username}_${Date.now()}`,
        loggedInAt: Date.now(),
      }
      setUser(newUser)
      return { ok: true }
    },
    []
  )

  const logout = useCallback(() => {
    setUser(null)
  }, [])

  const value: AuthContextState = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isStudent: user?.role === 'student',
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
