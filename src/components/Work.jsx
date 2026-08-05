import { useCallback, useEffect, useState } from 'react'
import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion'
import Reveal from './Reveal.jsx'
import { PROJECTS } from '../data.js'

// A row is an <article>, never an anchor: several projects carry both a live
// site and a repository, and wrapping the row would nest interactive elements.
function Row({ project, index }) {
  const number = String(index + 1).padStart(2, '0')
  const hasActions = Boolean(project.liveUrl || project.sourceUrl)

  return (
    <Reveal
      as="article"
      className="w-row"
      data-index={index}
      aria-labelledby={`w-title-${index}`}
      y={40}
      delay={index * 0.04}
    >
      <span className="fill" aria-hidden="true" />

      <div className="w-main">
        <span className="w-index" aria-hidden="true">/{number}</span>
        <div className="w-body">
          <h3 className="w-title" id={`w-title-${index}`}>
            <a href={`#/work/${project.slug}`} data-cursor="OPEN">
              {project.title} <span className="serif">{project.serif}</span>
            </a>
          </h3>
          <p className="w-desc">{project.desc}</p>
          <p className="w-tags">{project.tags}</p>
        </div>
      </div>

      <div className="w-side">
        <p className="w-meta">
          <span className="w-year">{project.year}</span>
          <span className="w-kind">{project.kind}</span>
        </p>

        <div className="w-actions">
          <a
            className="w-action w-action-case"
            href={`#/work/${project.slug}`}
            aria-label={`${project.title} — read the case study`}
            data-cursor="READ"
          >
            Case study <span aria-hidden="true">→</span>
          </a>
          {project.liveUrl && (
            <a
              className="w-action"
              href={project.liveUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`${project.title} — live site (opens in a new tab)`}
              data-cursor="OPEN"
            >
              Live site <span aria-hidden="true">↗</span>
            </a>
          )}
          {project.sourceUrl && (
            <a
              className="w-action"
              href={project.sourceUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`${project.title} — source code on GitHub (opens in a new tab)`}
              data-cursor="OPEN"
            >
              Source <span aria-hidden="true">↗</span>
            </a>
          )}
          {/* No link, no arrow icon — just the honest status. */}
          {!hasActions && <span className="w-status">{project.status}</span>}
        </div>
      </div>
    </Reveal>
  )
}

// Supplementary only: everything below is also printed in the row itself.
function Preview({ project }) {
  return (
    <div className="pv-inner">
      <p className="pv-type">{project.kind}</p>
      <dl className="pv-list">
        <div>
          <dt>Role</dt>
          <dd>{project.role}</dd>
        </div>
        <div>
          <dt>Focus</dt>
          <dd>{project.focus}</dd>
        </div>
        <div>
          <dt>Stack</dt>
          <dd>{project.stack}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{project.status}</dd>
        </div>
      </dl>
    </div>
  )
}

export default function Work() {
  const reduce = useReducedMotion()
  const [hovered, setHovered] = useState(null)
  const [finePointer, setFinePointer] = useState(false)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const px = useSpring(x, { stiffness: 260, damping: 26, mass: 0.7 })
  const py = useSpring(y, { stiffness: 260, damping: 26, mass: 0.7 })

  // The floating preview is a mouse-only flourish. Touch devices never get it.
  useEffect(() => {
    const media = window.matchMedia('(hover: hover) and (pointer: fine)')
    const sync = () => setFinePointer(media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  const clear = useCallback(() => setHovered(null), [])

  const onMove = (e) => {
    if (!finePointer) return
    x.set(e.clientX + 24)
    y.set(e.clientY - 110)
    const row = e.target.closest('.w-row')
    const index = row ? Number(row.dataset.index) : null
    setHovered(index === null || Number.isNaN(index) ? null : PROJECTS[index])
  }

  useEffect(() => {
    if (!finePointer) return undefined
    window.addEventListener('scroll', clear, { passive: true })
    return () => window.removeEventListener('scroll', clear)
  }, [finePointer, clear])

  const showPreview = finePointer && !reduce && Boolean(hovered)

  return (
    <section id="work" className="sec-pad" aria-labelledby="work-title">
      <div className="wrap">
        <div className="sec-head">
          <div>
            <span className="label">Selected engineering work</span>
            <h2 className="sec-title" id="work-title">
              Products <em>&amp;</em> systems<br />
              I built
            </h2>
          </div>
          <span className="sec-index">({String(PROJECTS.length).padStart(2, '0')})</span>
        </div>

        <div className="work-list" onMouseMove={onMove} onMouseLeave={clear}>
          {PROJECTS.map((p, i) => (
            <Row key={p.title} project={p} index={i} />
          ))}
        </div>
      </div>

      {finePointer && !reduce && (
        <motion.div
          className="work-preview"
          style={{ x: px, y: py }}
          animate={{ opacity: showPreview ? 1 : 0, scale: showPreview ? 1 : 0.9 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden="true"
        >
          {hovered && <Preview project={hovered} />}
        </motion.div>
      )}
    </section>
  )
}
