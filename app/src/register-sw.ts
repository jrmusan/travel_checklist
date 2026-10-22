/** Register the app-shell service worker (production only). Scope is `/`. */
export function registerServiceWorker() {
  if (!import.meta.env.PROD) return
  if (!('serviceWorker' in navigator)) return

  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
      // Registration can fail in private mode or non-secure contexts; the app still works online.
    })
  })
}
