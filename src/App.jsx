import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import Cursor from './components/Cursor.jsx'
import Preloader from './components/Preloader.jsx'
import Nav from './components/Nav.jsx'
import CharacterGuide from './components/Scene.jsx'
import Hero from './components/Hero.jsx'
import Marquee from './components/Marquee.jsx'
import Work from './components/Work.jsx'
import About from './components/About.jsx'
import Journey from './components/Journey.jsx'
import Contact from './components/Contact.jsx'
import ProjectPage from './components/ProjectPage.jsx'
import useHashRoute from './useHashRoute.js'
import { PROFILE, PROJECTS } from './data.js'

const INTRO_KEY = 'ww-intro-seen'
const MIN_INTRO = 500
const MAX_INTRO = 1500

function seenIntro() {
  try {
    return sessionStorage.getItem(INTRO_KEY) === '1'
  } catch {
    return false
  }
}

function rememberIntro() {
  try {
    sessionStorage.setItem(INTRO_KEY, '1')
  } catch {
    /* private mode — the intro simply plays again */
  }
}

// The intro is skipped outright for reduced-motion users and for repeat visits
// in the same session. Otherwise it waits on real load signals, with a hard
// ceiling so a slow font or model never holds the page hostage.
function useIntro() {
  const [loading, setLoading] = useState(() => {
    if (typeof window === 'undefined') return false
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
    return !seenIntro()
  })

  useEffect(() => {
    if (!loading) {
      rememberIntro()
      return undefined
    }

    const start = performance.now()
    let settled = false
    let timer = 0

    const finish = () => {
      if (settled) return
      settled = true
      const wait = Math.max(0, MIN_INTRO - (performance.now() - start))
      timer = setTimeout(() => {
        rememberIntro()
        setLoading(false)
      }, wait)
    }

    const ceiling = setTimeout(finish, MAX_INTRO)
    const loaded =
      document.readyState === 'complete'
        ? Promise.resolve()
        : new Promise((resolve) => window.addEventListener('load', resolve, { once: true }))

    Promise.all([loaded, document.fonts?.ready ?? Promise.resolve()]).then(finish)

    return () => {
      clearTimeout(ceiling)
      clearTimeout(timer)
    }
  }, [loading])

  useEffect(() => {
    document.body.style.overflow = loading ? 'hidden' : ''
  }, [loading])

  return loading
}

const HOME_TITLE = `${PROFILE.name} — ${PROFILE.roleTitle}`

export default function App() {
  const loading = useIntro()
  const route = useHashRoute()
  const onProject = route.name === 'project'

  // A case study always opens at the top; coming back to the home page honours
  // whichever in-page anchor was requested (#work, #about, …).
  useEffect(() => {
    if (onProject) {
      window.scrollTo(0, 0)
      return
    }
    const id = window.location.hash.slice(1)
    if (!id || id.startsWith('/')) return
    document.getElementById(id)?.scrollIntoView()
  }, [onProject, route.slug])

  // Keeps the tab title (and anything sharing it) in step with the route.
  useEffect(() => {
    const project = onProject && PROJECTS.find((p) => p.slug === route.slug)
    document.title = project ? `${project.title} — ${PROFILE.name}` : HOME_TITLE
  }, [onProject, route.slug])

  return (
    <>
      <AnimatePresence>{loading && <Preloader />}</AnimatePresence>
      <a className="skip-link" href="#main">Skip to content</a>
      <Cursor />
      <div className="grain" aria-hidden="true" />
      {/* The character's whole story is keyed to the home page's sections, so
          it stays on the home page rather than misbehaving on a case study. */}
      {!onProject && <CharacterGuide />}
      <Nav />
      <main id="main">
        {onProject ? (
          <>
            <ProjectPage slug={route.slug} />
            <Contact />
          </>
        ) : (
          <>
            <Hero ready={!loading} />
            <Marquee />
            <Work />
            <About />
            <Journey />
            <Contact />
          </>
        )}
      </main>
    </>
  )
}
