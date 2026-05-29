import { Navigate, useLocation } from 'react-router-dom'
import { ShieldX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import type { UserRole } from '@/types'

/**
 * 路由级权限守卫
 * - 未登录：跳 /login，记录回跳路径
 * - 已登录但角色不符：显示无权限页
 */
export function RequireAuth({
  children,
  role,
}: {
  children: React.ReactNode
  role?: UserRole | UserRole[]
}) {
  const location = useLocation()
  const { user, isAuthenticated } = useAuth()

  // 未登录 → 跳登录
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  // 角色不符 → 无权限页
  if (role) {
    const required = Array.isArray(role) ? role : [role]
    if (!required.includes(user.role)) {
      return <Forbidden requiredRole={required} currentRole={user.role} />
    }
  }

  return <>{children}</>
}

function Forbidden({ requiredRole, currentRole }: { requiredRole: UserRole[]; currentRole: UserRole }) {
  const roleLabel: Record<UserRole, string> = {
    guest: '游客',
    student: '学生',
    admin: '管理员',
  }
  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center">
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500 mb-6">
        <ShieldX className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight mb-2">无权限访问</h1>
      <p className="text-sm text-muted-foreground mb-1">
        该页面需要 <span className="font-semibold text-foreground">{requiredRole.map(r => roleLabel[r]).join(' / ')}</span> 权限
      </p>
      <p className="text-xs text-muted-foreground mb-8">
        当前身份：{roleLabel[currentRole]}
      </p>
      <div className="flex gap-2 justify-center">
        <Button variant="outline" onClick={() => window.history.back()} className="rounded-full">
          返回上一页
        </Button>
        <Button onClick={() => window.location.href = '/'} className="rounded-full">
          回到首页
        </Button>
      </div>
    </div>
  )
}
