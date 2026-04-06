import { useEffect, useState } from 'react'

const STORAGE_KEY = 'sidebar-state'
const HRM8_STORAGE_KEY = 'hrm8-sidebar-state'
const CONSULTANT_STORAGE_KEY = 'consultant-sidebar-state'
const CANDIDATE_STORAGE_KEY = 'candidate-sidebar-state'

export function useSidebarState(userType?: 'hrm8' | 'consultant' | 'candidate') {
  const storageKey = userType
    ? userType === 'hrm8'
      ? HRM8_STORAGE_KEY
      : userType === 'consultant'
        ? CONSULTANT_STORAGE_KEY
        : CANDIDATE_STORAGE_KEY
    : STORAGE_KEY

  const [open, setOpen] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      return stored ? JSON.parse(stored) : true
    } catch {
      return true
    }
  })

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(open))
  }, [open, storageKey])

  return { open, setOpen }
}
