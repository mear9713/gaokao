/**
 * Auth Context · 用户认证状态管理
 *
 * 真实后端认证：登录调用 POST /api/v1/auth/login 获取 JWT，
 * 再调用 GET /api/v1/auth/me 拿用户信息；token 与用户信息存 localStorage。
 * UI 层通过 useAuth() 消费，签名保持 { ok, message } 不变。
 */
import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { AuthUser, AuthContextState } from '@/types'
import { loginApi, registerApi } from '@/services/authApi'

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
      try {
        const r = await loginApi(username.trim(), password)
        setUser({
          username: r.username,
          displayName: r.displayName,
          role: r.role,
          token: r.token,
          loggedInAt: Date.now(),
        })
        return { ok: true }
      } catch (err) {
        return { ok: false, message: (err as Error).message || '账号或密码错误' }
      }
    },
    [],
  )

  const register = useCallback(
    async (username: string, password: string): Promise<{ ok: boolean; message?: string }> => {
      try {
        await registerApi(username.trim(), password)
        // 注册成功后自动登录
        return await login(username, password)
      } catch (err) {
        return { ok: false, message: (err as Error).message || '注册失败' }
      }
    },
    [login],
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
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
