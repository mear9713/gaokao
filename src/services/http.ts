/**
 * HTTP 请求层 — 基于 axios。
 *
 * - baseURL 取自 VITE_API_BASE_URL（开发默认 '/api'，走 Vite 代理）
 * - 自动注入 Authorization: Bearer <token>（从 localStorage 的登录信息读取）
 * - 统一错误处理：把后端 {message} / {detail} / Pydantic 422 抽成 Error.message
 *
 * 注意：SSE（智能问答流式）不走 axios，见 services/agentApi.ts，
 * 但同样复用这里的 API_BASE_URL 和 getStoredToken。
 */
import axios from 'axios'
import type { AxiosError } from 'axios'

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api'

/** 与 AuthContext 中的 localStorage key 保持一致 */
export const AUTH_STORAGE_KEY = 'gaokao_auth_user'

/** 从本地存储读取当前登录用户的 token */
export function getStoredToken(): string | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { token?: string }
    return parsed?.token ?? null
  } catch {
    return null
  }
}

export interface ApiError extends Error {
  status?: number
  detail?: unknown
}

export const http = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

// 请求拦截器：注入 Bearer Token
http.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/** 是否是「登录请求」本身——登录失败应让 LoginPage 自己渲染错误，不走全局登出逻辑 */
function isLoginRequest(url: string | undefined): boolean {
  if (!url) return false
  return /\/v1\/auth\/login\b/.test(url)
}

/** 401 时统一登出：清 token + 跳登录页。用 window.location 避免在非组件上下文里依赖 react-router。 */
function handleUnauthorized() {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY)
  } catch {
    /* 忽略存储错误 */
  }
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    // 用 replace 避免在浏览器历史里留下 401 页
    window.location.replace('/login')
  }
}

// 响应拦截器：统一错误信息 + 401 自动登出
http.interceptors.response.use(
  (res) => res,
  (error: AxiosError<Record<string, unknown>>) => {
    const status = error.response?.status
    const data = error.response?.data
    let message = error.message || '网络请求失败'

    // 401（且非登录请求自身）→ token 失效/过期，统一登出
    if (status === 401 && !isLoginRequest(error.config?.url)) {
      handleUnauthorized()
    }

    if (data) {
      if (typeof data.message === 'string') {
        message = data.message
      } else if (typeof data.detail === 'string') {
        message = data.detail
      } else if (Array.isArray(data.detail)) {
        // FastAPI / Pydantic 422 校验错误
        message = (data.detail as Array<{ loc?: string[]; msg?: string }>)
          .map((d) => `${d.loc?.slice(1).join('.') ?? ''} ${d.msg ?? ''}`.trim())
          .join('；')
      }
    }

    const apiError: ApiError = Object.assign(new Error(message), {
      status,
      detail: data,
    })
    return Promise.reject(apiError)
  },
)
