import { createContext, useState } from 'react'
import type { ReactNode } from 'react'
import type { AppContextState, StudentInfo } from '@/types'

const STORAGE_KEY = 'gaokao_student_info'

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

  function setStudentInfo(info: StudentInfo) {
    setStudentInfoState(info)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(info))
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
      value={{ studentInfo, selectedSchools, setStudentInfo, toggleSelectedSchool, clearSelectedSchools }}
    >
      {children}
    </AppContext.Provider>
  )
}
