import { useMemo, useSyncExternalStore } from 'react'
import type { ThemeMode } from '../types'
import type { ThemeColors } from '../utils/theme'
import { getTheme } from '../utils/theme'

const darkModeQuery =
  typeof window !== 'undefined'
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null

function subscribeSystemTheme(cb: () => void) {
  darkModeQuery?.addEventListener('change', cb)
  return () => darkModeQuery?.removeEventListener('change', cb)
}

function getSystemIsDark() {
  return darkModeQuery?.matches ?? false
}

export function useTheme(themeProp: ThemeMode = 'auto'): ThemeColors {
  const systemIsDark = useSyncExternalStore(
    subscribeSystemTheme,
    getSystemIsDark,
    () => false,
  )
  const resolvedMode =
    themeProp === 'auto' ? (systemIsDark ? 'dark' : 'light') : themeProp
  return useMemo(() => getTheme(resolvedMode), [resolvedMode])
}
