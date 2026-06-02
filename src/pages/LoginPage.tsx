import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Sparkles, User, Lock, Eye, EyeOff, Loader2, ArrowRight, Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/toast'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

type Mode = 'login' | 'register'

// 联调测试账号（后端已注册），方便快速登录验证
const TEST_ACCOUNT = { username: 'lian_test', password: 'Test123456' }

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, register, isAuthenticated, user } = useAuth()

  // 登录后回到原来想去的页面（被 RequireAuth 拦截时记录了 from）
  const from = (location.state as { from?: string } | null)?.from || '/'

  const [mode, setMode] = useState<Mode>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // 已登录 → 跳转（管理员去后台，其余回原页）
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(user.role === 'admin' ? '/admin/kb' : from, { replace: true })
    }
  }, [isAuthenticated, user, from, navigate])

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    if (!username.trim() || !password.trim()) {
      setError('请填写完整的账号和密码')
      return
    }
    if (mode === 'register' && password.length < 8) {
      setError('密码至少 8 位')
      return
    }
    setSubmitting(true)
    setError('')

    const result = mode === 'login'
      ? await login(username, password)
      : await register(username, password)
    setSubmitting(false)

    if (result.ok) {
      toast.success(mode === 'login' ? '登录成功' : '注册成功', '正在跳转...')
      // 跳转交给上面的 useEffect（user 更新后触发）
    } else {
      setError(result.message ?? (mode === 'login' ? '登录失败' : '注册失败'))
      toast.error(mode === 'login' ? '登录失败' : '注册失败', result.message)
    }
  }

  function fillTestAccount() {
    setMode('login')
    setUsername(TEST_ACCOUNT.username)
    setPassword(TEST_ACCOUNT.password)
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
          <p className="text-sm text-muted-foreground mt-2">
            {mode === 'login' ? '登录账户继续' : '注册一个新账户'}
          </p>
        </div>

        {/* 登录卡 */}
        <div className="card-surface rounded-3xl p-6 md:p-8 shadow-xl shadow-indigo-100/40 animate-fade-in-up" style={{ animationDelay: '60ms' }}>
          {/* 登录 / 注册 切换 */}
          <div className="flex gap-1 p-1 mb-5 rounded-xl bg-muted">
            {(['login', 'register'] as Mode[]).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError('') }}
                className={cn(
                  'flex-1 py-2 rounded-lg text-sm font-medium transition-all',
                  mode === m ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {m === 'login' ? '登录' : '注册'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 账号 */}
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-xs text-muted-foreground">账号</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder={mode === 'register' ? '字母 / 数字 / 下划线，3-50 位' : '请输入账号'}
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
                  placeholder={mode === 'register' ? '至少 8 位' : '请输入密码'}
                  className="pl-9 pr-9 h-11"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={submitting}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
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

            {/* 提交按钮 */}
            <Button
              type="submit"
              disabled={submitting || !username || !password}
              className="w-full h-11 rounded-xl gap-1.5 text-base"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {mode === 'login' ? '正在登录...' : '正在注册...'}
                </>
              ) : (
                <>
                  {mode === 'login' ? '登录' : '注册并登录'}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* 联调测试账号 */}
          <div className="mt-6 pt-6 border-t border-border/50">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
              <Info className="h-3.5 w-3.5" />
              <span>联调测试账号（点击一键填入）</span>
            </div>
            <button
              type="button"
              onClick={fillTestAccount}
              disabled={submitting}
              className="w-full text-left p-3 rounded-xl border border-indigo-100 bg-indigo-50/40 hover:border-indigo-300 hover:bg-indigo-50 transition-all disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">学生测试账号</span>
                <span className="text-[10px] text-muted-foreground">点击填入 →</span>
              </div>
              <div className="text-[10px] text-muted-foreground font-mono mt-1">
                {TEST_ACCOUNT.username} · {TEST_ACCOUNT.password}
              </div>
            </button>
            <p className="text-[10px] text-muted-foreground/70 mt-3">
              注册仅支持学生角色；管理员账号需由后端创建。
            </p>
          </div>
        </div>

        {/* 底部 */}
        <div className="text-center mt-6 animate-fade-in-up" style={{ animationDelay: '120ms' }}>
          <p className="text-[10px] text-muted-foreground/70">
            🔒 登录信息由后端校验，Token 本地存储
          </p>
        </div>
      </div>
    </div>
  )
}
