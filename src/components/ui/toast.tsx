/**
 * 轻量级 Toast 系统（无依赖，原生 Portal + 状态管理）
 *
 * 使用方式：
 *   import { toast } from '@/components/ui/toast'
 *   toast.success('已加入对比')
 *   toast.error('提交失败')
 */
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastVariant = 'success' | 'error' | 'info' | 'warning'

interface ToastItem {
  id: string
  variant: ToastVariant
  title: string
  description?: string
}

// ─── 全局状态（最简发布订阅）────────────────────────
let listeners: ((items: ToastItem[]) => void)[] = []
let items: ToastItem[] = []

function emit() {
  listeners.forEach(l => l([...items]))
}

function push(variant: ToastVariant, title: string, description?: string) {
  const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  items.push({ id, variant, title, description })
  emit()
  setTimeout(() => {
    items = items.filter(it => it.id !== id)
    emit()
  }, 3500)
}

export const toast = {
  success: (title: string, description?: string) => push('success', title, description),
  error:   (title: string, description?: string) => push('error',   title, description),
  info:    (title: string, description?: string) => push('info',    title, description),
  warning: (title: string, description?: string) => push('warning', title, description),
}

// ─── Toaster 组件（挂在 App 顶层）─────────────────
const VARIANT_STYLES: Record<ToastVariant, { icon: typeof CheckCircle2; color: string; bg: string }> = {
  success: { icon: CheckCircle2,   color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  error:   { icon: XCircle,        color: 'text-red-600',     bg: 'bg-red-50 border-red-200' },
  info:    { icon: Info,           color: 'text-blue-600',    bg: 'bg-blue-50 border-blue-200' },
  warning: { icon: AlertTriangle,  color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200' },
}

export function Toaster() {
  const [list, setList] = useState<ToastItem[]>([])

  useEffect(() => {
    listeners.push(setList)
    return () => { listeners = listeners.filter(l => l !== setList) }
  }, [])

  if (typeof window === 'undefined') return null

  return createPortal(
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {list.map(item => {
        const v = VARIANT_STYLES[item.variant]
        const Icon = v.icon
        return (
          <div
            key={item.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 min-w-[280px] max-w-md rounded-xl border px-4 py-3 shadow-lg backdrop-blur-md animate-fade-in-up',
              v.bg
            )}
          >
            <Icon className={cn('h-4 w-4 flex-shrink-0 mt-0.5', v.color)} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{item.title}</p>
              {item.description && (
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.description}</p>
              )}
            </div>
            <button
              onClick={() => { items = items.filter(it => it.id !== item.id); emit() }}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )
      })}
    </div>,
    document.body,
  )
}
