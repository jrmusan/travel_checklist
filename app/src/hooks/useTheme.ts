import { useEffect, useState } from 'react'

const STORAGE_KEY = 'camplist-theme'
const LEGACY_KEY = 'travel-checklist-theme'

export const THEMES = ['forest', 'sunset', 'night'] as const
export type ThemeName = (typeof THEMES)[number]

/** Status-bar color per theme; matches each theme's --panel token. */
const THEME_COLOR: Record<ThemeName, string> = {
  forest: '#1f3326',
  sunset: '#3d2a2c',
  night: '#0d1612',
}

function isTheme(value: unknown): value is ThemeName {
  return typeof value === 'string' && (THEMES as readonly string[]).includes(value)
}

function getInitialTheme(): ThemeName {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (isTheme(saved)) return saved
    if (localStorage.getItem(LEGACY_KEY) === 'dark') return 'night'
  } catch {
    // localStorage can be unavailable (private mode, blocked storage)
  }
  return 'forest'
}

export function useTheme() {
  const [theme, setTheme] = useState<ThemeName>(getInitialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme])
    try {
      localStorage.setItem(STORAGE_KEY, theme)
      localStorage.removeItem(LEGACY_KEY)
    } catch {
      // ignore
    }
  }, [theme])

  return { theme, setTheme }
}
