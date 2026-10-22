export type View = 'home' | 'checklist' | 'categories' | 'trips' | 'settings'

export const VIEWS: readonly View[] = ['home', 'checklist', 'categories', 'trips', 'settings']

export function isView(value: unknown): value is View {
  return typeof value === 'string' && (VIEWS as readonly string[]).includes(value)
}
