import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * 顶部路由切换进度条
 * 路由变化时从左推到右，渐变 indigo→purple→fuchsia
 * 用 useLocation 监听，无需引入第三方库（nprogress 等）
 */
export function RouteProgress() {
  const location = useLocation()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(true)
    setProgress(15)

    const t1 = setTimeout(() => setProgress(40), 80)
    const t2 = setTimeout(() => setProgress(75), 180)
    const t3 = setTimeout(() => setProgress(100), 380)
    const t4 = setTimeout(() => setVisible(false), 620)
    const t5 = setTimeout(() => setProgress(0), 820)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
      clearTimeout(t5)
    }
  }, [location.pathname])

  return (
    <div
      className="fixed top-0 left-0 right-0 h-[2.5px] z-[200] pointer-events-none"
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 200ms ease-out',
      }}
    >
      <div
        className="h-full"
        style={{
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)',
          boxShadow: '0 0 8px rgba(139, 92, 246, 0.5)',
          transition: 'width 350ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      />
    </div>
  )
}
