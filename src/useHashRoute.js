import { useEffect, useState } from 'react'

// Hash routing on purpose: GitHub Pages serves a single index.html, so a
// path-based route would 404 on refresh without a redirect hack. `#/work/<slug>`
// survives reload, deep links and the browser's back button with no dependency.
//
// In-page anchors (#work, #about, …) are deliberately NOT routes — anything
// that does not start with `#/` falls through to the home page and the browser's
// native anchor scrolling.
const PROJECT_ROUTE = /^#\/work\/([a-z0-9-]+)\/?$/i

export function parseHash(hash) {
  const match = PROJECT_ROUTE.exec(hash || '')
  return match ? { name: 'project', slug: match[1] } : { name: 'home' }
}

export default function useHashRoute() {
  const [route, setRoute] = useState(() =>
    typeof window === 'undefined' ? { name: 'home' } : parseHash(window.location.hash),
  )

  useEffect(() => {
    const sync = () => setRoute(parseHash(window.location.hash))
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  return route
}

// Resolves a repo-relative asset path against the Vite base URL so images keep
// working under the GitHub Pages sub-path.
export function asset(path) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`
}
