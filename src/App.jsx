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

export default function App() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1700)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    document.body.style.overflow = loading ? 'hidden' : ''
  }, [loading])

  return (
    <>
      <AnimatePresence>{loading && <Preloader />}</AnimatePresence>
      <Cursor />
      <div className="grain" aria-hidden="true" />
      <CharacterGuide />
      <Nav />
      <main>
        <Hero ready={!loading} />
        <Marquee />
        <Work />
        <About />
        <Journey />
        <Contact />
      </main>
    </>
  )
}
