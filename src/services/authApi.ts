/**
 * 认证接口适配层。
 *
 * 对接后端：
 *   - POST /api/v1/auth/login    → { ok, token, access_token, token_type }
 *   - GET  /api/v1/auth/me       → { username, displayName, role }
 *   - POST /api/v1/auth/register → { id, username, role }（role 固定 student）
 *
 * baseURL 已是 /api（见 http.ts），故路径用 /v1/...。
 */
import { http } from './http'
import type { UserRole } from '@/types'

export interface LoginResult {
  token: string
  username: string
  displayName: string
  role: UserRole
}

export async function loginApi(username: string, password: string): Promise<LoginResult> {
  const { data } = await http.post('/v1/auth/login', { username, password })
  const token: string | undefined = data.access_token ?? data.token
  if (!token) throw new Error('登录响应缺少 token')

  // 拿用户详情（手动带上刚获取的 token，不依赖拦截器——此刻 user 尚未入库）
  let resolvedName = username
  let displayName = username
  let role: UserRole = 'student'
  try {
    const me = await http.get('/v1/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
    resolvedName = me.data.username ?? username
    displayName = me.data.displayName ?? me.data.username ?? username
    role = (me.data.role as UserRole) ?? 'student'
  } catch {
    // /me 失败时用登录名兜底，不阻断登录
  }

  return { token, username: resolvedName, displayName, role }
}

export async function registerApi(username: string, password: string): Promise<void> {
  await http.post('/v1/auth/register', { username, password, role: 'student' })
}
