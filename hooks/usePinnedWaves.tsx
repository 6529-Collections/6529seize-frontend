import { useState, useEffect, useCallback } from 'react'

export const MAX_PINNED_WAVES = 10
const STORAGE_KEY = 'pinnedWave'

export function usePinnedWaves() {
  const [pinnedIds, setPinnedIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    }
    return []
  })

  const addId = useCallback((id: string) => {
    setPinnedIds(prev => {
      const newIds = [id, ...prev.filter(pinnedId => pinnedId !== id)]
      return newIds.slice(0, MAX_PINNED_WAVES)
    })
  }, [])

  const removeId = useCallback((id: string) => {
    setPinnedIds(prev => prev.filter(pinnedId => pinnedId !== id))
  }, [])

  const getAllIds = useCallback(() => pinnedIds, [pinnedIds])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pinnedIds))
  }, [pinnedIds])

  return { pinnedIds, addId, removeId, getAllIds }
}
