import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Menu, GraduationCap, X, LogIn, LogOut, ShieldCheck,
  User, Database, ChevronDown, ServerCog,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toast'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const navLinks = [
  { to: '/', label: '填写信息', exact: true },
  { to: '/results', label: '推荐结果' },
  { to: '/chat', label: 'AI 咨询' },
  { to: '/report', label: '规划报告' },
]

function NavLinkItem({ to, label, exact, onClick }: { to: string; label: string; exact?: boolean; onClick?: () => void }) {
  return (
    <NavLink
      to={to}
      end={exact}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'text-sm font-medium transition-colors hover:text-primary',
          isActive ? 'text-primary font-semibold border-b-2 border-primary pb-0.5' : 'text-muted-foreground'
        )
      }
    >
      {label}
    </NavLink>
  )
}

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const navigate = useNavigate()
  const { user, isAuthenticated, isAdmin, logout } = useAuth()

  function handleLogout() {
    logout()
    setUserMenuOpen(false)
    setOpen(false)
    toast.info('已退出登录')
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2 font-bold text-foreground">
          <GraduationCap className="h-5 w-5 text-primary" />
          <span className="hidden sm:block">高考志愿 AI Agent</span>
          <span className="sm:hidden">志愿助手</span>
        </NavLink>

        {/* 桌面端导航 */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map(link => (
            <NavLinkItem key={link.to} {...link} />
          ))}
          {/* 管理员才显示 */}
          {isAdmin && (
            <>
              <NavLink
                to="/admin/kb"
                className={({ isActive }) =>
                  cn(
                    'text-sm font-medium transition-colors flex items-center gap-1.5',
                    isActive
                      ? 'text-purple-700 font-semibold border-b-2 border-purple-500 pb-0.5'
                      : 'text-purple-600 hover:text-purple-700'
                  )
                }
              >
                <Database className="h-3.5 w-3.5" />
                知识库管理
              </NavLink>
              <NavLink
                to="/admin/ai-api"
                className={({ isActive }) =>
                  cn(
                    'text-sm font-medium transition-colors flex items-center gap-1.5',
                    isActive
                      ? 'text-indigo-700 font-semibold border-b-2 border-indigo-500 pb-0.5'
                      : 'text-indigo-600 hover:text-indigo-700'
                  )
                }
              >
                <ServerCog className="h-3.5 w-3.5" />
                AI API 配置
              </NavLink>
            </>
          )}
        </nav>

        {/* 右侧：用户态 + 移动菜单 */}
        <div className="flex items-center gap-2">

          {/* 桌面端用户态 */}
          <div className="hidden md:block">
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(o => !o)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-muted/60 transition-colors"
                >
                  <div className={cn(
                    'h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold',
                    isAdmin
                      ? 'bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white'
                      : 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white'
                  )}>
                    {user.displayName.charAt(0)}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-medium leading-tight">{user.displayName}</p>
                    <Badge className={cn(
                      'text-[9px] px-1 py-0',
                      isAdmin ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-indigo-100 text-indigo-700 border-indigo-200'
                    )}>
                      {isAdmin ? '管理员' : '学生'}
                    </Badge>
                  </div>
                  <ChevronDown className={cn('h-3 w-3 text-muted-foreground transition-transform', userMenuOpen && 'rotate-180')} />
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-48 bg-background border border-border rounded-2xl shadow-xl z-50 animate-fade-in-up overflow-hidden">
                      <div className="px-4 py-3 border-b bg-muted/30">
                        <p className="text-sm font-semibold">{user.displayName}</p>
                        <p className="text-xs text-muted-foreground">@{user.username}</p>
                      </div>
                      <div className="py-1">
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => { setUserMenuOpen(false); navigate('/admin/kb') }}
                              className="w-full px-4 py-2 text-sm flex items-center gap-2 hover:bg-muted/60 transition-colors text-purple-700"
                            >
                              <Database className="h-3.5 w-3.5" />
                              知识库管理
                            </button>
                            <button
                              onClick={() => { setUserMenuOpen(false); navigate('/admin/ai-api') }}
                              className="w-full px-4 py-2 text-sm flex items-center gap-2 hover:bg-muted/60 transition-colors text-indigo-700"
                            >
                              <ServerCog className="h-3.5 w-3.5" />
                              AI API 配置
                            </button>
                          </>
                        )}
                        <button
                          onClick={handleLogout}
                          className="w-full px-4 py-2 text-sm flex items-center gap-2 hover:bg-red-50 hover:text-red-600 transition-colors text-muted-foreground"
                        >
                          <LogOut className="h-3.5 w-3.5" />
                          退出登录
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/login')}
                className="rounded-full gap-1.5"
              >
                <LogIn className="h-3.5 w-3.5" />
                登录
              </Button>
            )}
          </div>

          {/* 移动端菜单 */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">打开菜单</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  导航菜单
                </SheetTitle>
              </SheetHeader>

              {/* 移动端用户态 */}
              {isAuthenticated && user ? (
                <div className="mt-4 mx-1 p-3 rounded-xl bg-muted/40 border">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0',
                      isAdmin
                        ? 'bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white'
                        : 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white'
                    )}>
                      {user.displayName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{user.displayName}</p>
                      <Badge className={cn(
                        'text-[10px] mt-0.5',
                        isAdmin ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-indigo-100 text-indigo-700 border-indigo-200'
                      )}>
                        {isAdmin ? <ShieldCheck className="h-2.5 w-2.5 mr-0.5" /> : <User className="h-2.5 w-2.5 mr-0.5" />}
                        {isAdmin ? '管理员' : '学生'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setOpen(false); navigate('/login') }}
                  className="w-full mt-4 rounded-full gap-1.5"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  登录账号
                </Button>
              )}

              <nav className="flex flex-col gap-1 mt-4">
                {navLinks.map(link => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.exact}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/60'
                      )
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
                {isAdmin && (
                  <>
                    <NavLink
                      to="/admin/kb"
                      onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5',
                          isActive
                            ? 'bg-purple-50 text-purple-700'
                            : 'text-purple-600 hover:bg-purple-50'
                        )
                      }
                    >
                      <Database className="h-3.5 w-3.5" />
                      知识库管理
                    </NavLink>
                    <NavLink
                      to="/admin/ai-api"
                      onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5',
                          isActive
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'text-indigo-600 hover:bg-indigo-50'
                        )
                      }
                    >
                      <ServerCog className="h-3.5 w-3.5" />
                      AI API 配置
                    </NavLink>
                  </>
                )}
              </nav>

              {isAuthenticated && (
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="absolute bottom-4 left-4 right-4 rounded-full text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-3.5 w-3.5 mr-1" />
                  退出登录
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
