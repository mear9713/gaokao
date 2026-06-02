import { createContext, useState } from 'react'
import type { ReactNode } from 'react'
import type { AppContextState, StudentInfo } from '@/types'

const STORAGE_KEY = 'gaokao_student_info'
const REC_ID_KEY = 'gaokao_recommendation_id'

export const AppContext = createContext<AppContextState | null>(null)

function readStoredInfo(): StudentInfo | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as StudentInfo) : null
  } catch {
    return null
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [studentInfo, setStudentInfoState] = useState<StudentInfo | null>(readStoredInfo)
  const [selectedSchools, setSelectedSchools] = useState<string[]>([])
  const [recommendationId, setRecommendationIdState] = useState<string | null>(
    () => localStorage.getItem(REC_ID_KEY),
  )

  function setStudentInfo(info: StudentInfo) {
    setStudentInfoState(info)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(info))
  }

  /** 保存/清除最近一次推荐任务 ID（供结果页轮询、聊天页追问使用） */
  function setRecommendationId(id: string | null) {
    setRecommendationIdState(id)
    if (id) localStorage.setItem(REC_ID_KEY, id)
    else localStorage.removeItem(REC_ID_KEY)
  }

  function toggleSelectedSchool(id: string) {
    setSelectedSchools(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  function clearSelectedSchools() {
    setSelectedSchools([])
  }

  return (
    <AppContext.Provider
      value={{
        studentInfo,
        selectedSchools,
        recommendationId,
        setStudentInfo,
        setRecommendationId,
        toggleSelectedSchool,
        clearSelectedSchools,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}
