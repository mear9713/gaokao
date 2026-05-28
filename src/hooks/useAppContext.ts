import { useContext } from 'react'
import { AppContext } from '@/context/AppContext'
import type { AppContextState } from '@/types'

export function useAppContext(): AppContextState {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext 必须在 AppProvider 内部使用')
  return ctx
}
