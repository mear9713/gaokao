import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Menu, GraduationCap, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
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
        </nav>

        {/* 移动端菜单 */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">打开菜单</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                导航菜单
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-4 mt-6">
              {navLinks.map(link => (
                <NavLinkItem
                  key={link.to}
                  {...link}
                  onClick={() => setOpen(false)}
                />
              ))}
            </nav>
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
    </header>
  )
}
