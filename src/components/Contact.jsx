import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Reveal from './Reveal.jsx'
import { EMAIL, SOCIALS } from '../data.js'

export default function Contact() {
  const [copied, setCopied] = useState(false)

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch {
      window.location.href = `mailto:${EMAIL}`
    }
  }

  return (
    <section id="contact" className="inverted contact sec-pad">
      <div className="wrap">
        <Reveal as="span" className="label" y={0}>
          Contact — Brisbane / remote
        </Reveal>

        <Reveal as="h2" className="contact-title" y={60} delay={0.05}>
          Let's make<br />
          <span className="serif">something move</span>
        </Reveal>

        <Reveal as="p" className="contact-sub" y={20} delay={0.15}>
          Looking for backend, frontend or AI/ML internships and grad roles —
          or just say hi about games, 3D and agents.
        </Reveal>

        <Reveal y={20} delay={0.25}>
          <button className="email-btn" onClick={copyEmail} data-cursor="COPY">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="5" width="18" height="14" rx="1" />
              <path d="m3 7 9 6 9-6" />
            </svg>
            <span>{EMAIL}</span>
          </button>
        </Reveal>

        <div className="socials">
          {SOCIALS.map((s) => (
            <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer">
              {s.name}
            </a>
          ))}
          <a href={`mailto:${EMAIL}`}>Email</a>
        </div>

        <div className="foot">
          <span>© {new Date().getFullYear()} Mingjuan (Wesley) Wu</span>
          <span>Designed &amp; built by hand — Brisbane, AU</span>
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} data-cursor="TOP">
            Back to top ↑
          </button>
        </div>
      </div>

      <AnimatePresence>
        {copied && (
          <motion.div
            className="toast"
            initial={{ opacity: 0, y: 16, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 16, x: '-50%' }}
            transition={{ duration: 0.3 }}
          >
            Copied — {EMAIL}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
