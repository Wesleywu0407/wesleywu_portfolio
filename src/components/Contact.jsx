import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Reveal from './Reveal.jsx'
import { EMAIL, PROFILE, RESUME_URL, SOCIALS } from '../data.js'

export default function Contact() {
  const [copied, setCopied] = useState(false)
  const timer = useRef(0)

  useEffect(() => () => clearTimeout(timer.current), [])

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL)
      setCopied(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 2200)
    } catch {
      window.location.href = `mailto:${EMAIL}`
    }
  }

  return (
    <section id="contact" className="inverted contact sec-pad" aria-labelledby="contact-title">
      <div className="wrap">
        <Reveal as="span" className="label" y={0}>
          Contact — Brisbane / remote
        </Reveal>

        <Reveal as="h2" className="contact-title" id="contact-title" y={60} delay={0.05}>
          Let's build<br />
          <span className="serif">something useful</span>
        </Reveal>

        <Reveal as="div" className="contact-sub" y={20} delay={0.15}>
          <p>
            I'm seeking graduate software engineering and full-stack development
            opportunities in Australia.
          </p>
          <p>
            For roles, collaborations or technical conversations, feel free to get in
            touch.
          </p>
        </Reveal>

        <Reveal y={20} delay={0.25}>
          <button
            type="button"
            className="email-btn"
            onClick={copyEmail}
            aria-label={`Copy email address ${EMAIL} to the clipboard`}
            data-cursor="COPY"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="5" width="18" height="14" rx="1" />
              <path d="m3 7 9 6 9-6" />
            </svg>
            <span>{EMAIL}</span>
          </button>
        </Reveal>

        <nav className="socials" aria-label="Elsewhere">
          {SOCIALS.map((s) => (
            <a
              key={s.name}
              href={s.url}
              target="_blank"
              rel="noreferrer"
              aria-label={`${s.name} profile (opens in a new tab)`}
            >
              {s.name}
            </a>
          ))}
          <a href={`mailto:${EMAIL}`}>Email</a>
          {RESUME_URL && (
            <a
              href={RESUME_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="Résumé PDF (opens in a new tab)"
            >
              Résumé
            </a>
          )}
        </nav>

        <div className="foot">
          <span>© {new Date().getFullYear()} {PROFILE.name}</span>
          <span>Designed &amp; built by hand — Brisbane, AU</span>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            data-cursor="TOP"
          >
            Back to top ↑
          </button>
        </div>
      </div>

      <div className="sr-only" role="status" aria-live="polite">
        {copied ? `Email address ${EMAIL} copied to clipboard` : ''}
      </div>

      <AnimatePresence>
        {copied && (
          <motion.div
            className="toast"
            aria-hidden="true"
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
