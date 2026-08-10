import { motion, useReducedMotion } from 'framer-motion'
import { PROFILE, RESUME_URL, SOCIALS } from '../data.js'

const NAME = 'WESLEY WU'

// Kept short enough that no value wraps mid-phrase in the hero column.
const FACTS = [
  ['Currently', 'Software Engineer Intern (R&D), HDRE'],
  ['Studying', 'Master of IT, University of Queensland'],
  ['Graduating', PROFILE.graduating],
  ['Based in', PROFILE.location],
]

const github = SOCIALS.find((s) => s.name === 'GitHub')
const linkedin = SOCIALS.find((s) => s.name === 'LinkedIn')

export default function Hero({ ready }) {
  const reduce = useReducedMotion()
  // Reduced motion keeps the fade but drops the travel.
  const rise = (delay) => ({
    initial: { opacity: 0, y: reduce ? 0 : 16 },
    animate: ready ? { opacity: 1, y: 0 } : {},
    transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] },
  })

  return (
    <section className="hero" id="top" aria-labelledby="hero-name">
      <div className="hero-stage">
        <motion.div className="hero-intro" {...rise(0.5)}>
          <span className="label">Portfolio — 2026</span>
          <p className="hero-role">{PROFILE.role}</p>
          <p className="hero-summary">{PROFILE.summary}</p>

          <div className="hero-actions">
            <a className="cta" href="#work" data-cursor="WORK">
              View work
            </a>
            <a
              className="cta"
              href={github.url}
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub profile (opens in a new tab)"
              data-cursor="OPEN"
            >
              GitHub <span aria-hidden="true">↗</span>
            </a>
            <a
              className="cta"
              href={linkedin.url}
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn profile (opens in a new tab)"
              data-cursor="OPEN"
            >
              LinkedIn <span aria-hidden="true">↗</span>
            </a>
            {RESUME_URL && (
              <a
                className="cta"
                href={RESUME_URL}
                target="_blank"
                rel="noreferrer"
                aria-label="Résumé PDF (opens in a new tab)"
                data-cursor="OPEN"
              >
                Résumé <span aria-hidden="true">↗</span>
              </a>
            )}
          </div>
        </motion.div>

        <h1 className="hero-name" id="hero-name" aria-label="Wesley Wu">
          {NAME.split('').map((ch, i) =>
            ch === ' ' ? (
              <span key={i}>&nbsp;</span>
            ) : (
              <span
                key={i}
                style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom' }}
                aria-hidden="true"
              >
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
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 5v14M6 13l6 6 6-6" />
            </svg>
            Scroll
          </span>
          <span className="label">{PROFILE.roleTitle}</span>
          <span className="scroll-hint">Scroll — follow the guide</span>
        </motion.div>
      </div>

      {/* Outside .hero-stage on purpose. On desktop it is absolutely positioned
          into the top-right corner; on mobile the stage keeps its full viewport
          for the character and this simply flows underneath it, so the figure
          can never sit on top of the facts. */}
      <motion.dl className="hero-side" {...rise(0.62)}>
        {FACTS.map(([k, v]) => (
          <div className="hero-fact" key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </motion.dl>
    </section>
  )
}
