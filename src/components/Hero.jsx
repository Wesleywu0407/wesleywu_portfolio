import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import Scene from './Scene.jsx'

const NAME = 'WESLEY WU'

export default function Hero({ ready }) {
  const reduce = useReducedMotion()
  const heroRef = useRef(null)
  const [inView, setInView] = useState(true)

  useEffect(() => {
    const el = heroRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: '0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <section className="hero" id="top" aria-label="Intro" ref={heroRef}>
      <motion.div
        className="hero-eyebrow"
        initial={{ opacity: 0, y: 16 }}
        animate={ready ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className="label">Portfolio — 2026</span>
        <span className="role">full-stack &amp; AI developer</span>
      </motion.div>

      <motion.div
        className="hero-side"
        initial={{ opacity: 0, y: 16 }}
        animate={ready ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, delay: 0.62, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className="line-item"><strong>Currently</strong></span>
        <span className="line-item">Data &amp; research intern @ HDRE</span>
        <span className="line-item" style={{ marginTop: 10 }}><strong>Studying</strong></span>
        <span className="line-item">MIT — Univ. of Queensland</span>
        <span className="line-item" style={{ marginTop: 10 }}><strong>Based in</strong></span>
        <span className="line-item">Brisbane, Australia</span>
      </motion.div>

      <div className="hero-canvas">
        <Scene active={inView} />
      </div>

      <h1 className="hero-name" aria-label="Wesley Wu">
        {NAME.split('').map((ch, i) =>
          ch === ' ' ? (
            <span key={i}>&nbsp;</span>
          ) : (
            <span key={i} style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom' }} aria-hidden="true">
              <motion.span
                className="char"
                initial={reduce ? {} : { y: '105%' }}
                animate={ready ? { y: 0 } : {}}
                transition={{
                  duration: 0.9,
                  delay: 0.15 + i * 0.045,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {ch}
              </motion.span>
            </span>
          ),
        )}
      </h1>

      <motion.div
        className="hero-bottom"
        initial={{ opacity: 0 }}
        animate={ready ? { opacity: 1 } : {}}
        transition={{ duration: 0.8, delay: 1.1 }}
      >
        <span className="scroll-hint">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 5v14M6 13l6 6 6-6" />
          </svg>
          Scroll
        </span>
        <span className="label">Mingjuan (Wesley) Wu</span>
        <span className="scroll-hint">Move your cursor — he follows</span>
      </motion.div>
    </section>
  )
}
