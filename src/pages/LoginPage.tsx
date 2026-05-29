import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Sparkles, User, Lock, Eye, EyeOff, Loader2, ArrowRight,
  ShieldCheck, GraduationCap, Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/toast'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

interface QuickAccount {
  username: string
  password: string
  displayName: string
  role: '管理员' | '学生'
  description: string
}

const QUICK_ACCOUNTS: QuickAccount[] = [
  {
    username: 'admin',
    password: 'admin123',
    displayName: '管理员',
    role: '管理员',
    description: '可访问知识库管理后台、查看运营数据',
  },
  {
    username: 'student',
    password: '123456',
    displayName: '同学小张',
    role: '学生',
    description: '可使用全部志愿填报功能',
  },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated, user } = useAuth()

  // 登录后回到原来想去的页面（被 RequireAuth 拦截时记录了 from）
  const from = (location.state as { from?: string } | null)?.from || '/'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // 已登录直接跳走
  if (isAuthenticated && user) {
    setTimeout(() => navigate(user.role === 'admin' ? '/admin/kb' : from, { replace: true }), 0)
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    if (!username.trim() || !password.trim()) {
      setError('请填写完整的账号和密码')
      return
    }
    setSubmitting(true)
    setError('')

    const result = await login(username, password)
    setSubmitting(false)

    if (result.ok) {
      const account = QUICK_ACCOUNTS.find(a => a.username === username)
      toast.success(`欢迎回来，${account?.displayName ?? username}`, '正在跳转...')
      setTimeout(() => {
        navigate(account?.role === '管理员' ? '/admin/kb' : from, { replace: true })
      }, 500)
    } else {
      setError(result.message ?? '登录失败')
      toast.error('登录失败', result.message)
    }
  }

  function fillAccount(acc: QuickAccount) {
    setUsername(acc.username)
    setPassword(acc.password)
    setError('')
  }

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 py-8">
      <div
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 800px 500px at 50% 30%, rgba(99, 102, 241, 0.12), transparent 60%)',
        }}
      />

      <div className="w-full max-w-md">
        {/* 顶部 logo */}
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-200 mb-4">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            欢迎使用 AI 志愿系统
          </h1>
          <p className="text-sm text-muted-foreground mt-2">登录账户继续</p>
        </div>

        {/* 登录卡 */}
        <div className="card-surface rounded-3xl p-6 md:p-8 shadow-xl shadow-indigo-100/40 animate-fade-in-up" style={{ animationDelay: '60ms' }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 账号 */}
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-xs text-muted-foreground">账号</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder="请输入账号"
                  className="pl-9 h-11"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  disabled={submitting}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* 密码 */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs text-muted-foreground">密码</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="请输入密码"
                  className="pl-9 pr-9 h-11"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={submitting}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* 错误 */}
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-xl animate-fade-in-up">
                ⚠️ {error}
              </div>
            )}

            {/* 登录按钮 */}
            <Button
              type="submit"
              disabled={submitting || !username || !password}
              className="w-full h-11 rounded-xl gap-1.5 text-base"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  正在登录...
                </>
              ) : (
                <>
                  登录
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* 快速登录区 */}
          <div className="mt-6 pt-6 border-t border-border/50">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
              <Info className="h-3.5 w-3.5" />
              <span>演示账号（点击一键填入）</span>
            </div>
            <div className="space-y-2">
              {QUICK_ACCOUNTS.map(acc => {
                const isAdmin = acc.role === '管理员'
                return (
                  <button
                    key={acc.username}
                    type="button"
                    onClick={() => fillAccount(acc)}
                    disabled={submitting}
                    className={cn(
                      'w-full text-left p-3 rounded-xl border transition-all hover:shadow-sm group',
                      isAdmin
                        ? 'border-purple-100 bg-purple-50/40 hover:border-purple-300 hover:bg-purple-50'
                        : 'border-indigo-100 bg-indigo-50/40 hover:border-indigo-300 hover:bg-indigo-50',
                      'disabled:opacity-50'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={cn(
                        'h-7 w-7 rounded-lg flex items-center justify-center',
                        isAdmin ? 'bg-purple-100 text-purple-600' : 'bg-indigo-100 text-indigo-600'
                      )}>
                        {isAdmin ? <ShieldCheck className="h-3.5 w-3.5" /> : <GraduationCap className="h-3.5 w-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">
                          {acc.displayName}
                          <span className={cn(
                            'ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full',
                            isAdmin ? 'bg-purple-200 text-purple-700' : 'bg-indigo-200 text-indigo-700'
                          )}>
                            {acc.role}
                          </span>
                        </p>
                      </div>
                      <span className="text-[10px] text-muted-foreground group-hover:text-foreground">点击填入 →</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1.5">{acc.description}</p>
                    <div className="text-[10px] text-muted-foreground font-mono">
                      {acc.username} · {acc.password}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* 底部 */}
        <div className="text-center mt-6 space-y-1 animate-fade-in-up" style={{ animationDelay: '120ms' }}>
          <p className="text-[10px] text-muted-foreground/70">
            🔒 当前为前端演示版，账号信息仅本地存储
          </p>
        </div>
      </div>
    </div>
  )
}
