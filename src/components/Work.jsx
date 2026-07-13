import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import Reveal from './Reveal.jsx'
import { PROJECTS } from '../data.js'

function Row({ project, index }) {
  return (
    <Reveal
      as="a"
      className="work-row"
      href={project.url}
      target="_blank"
      rel="noopener noreferrer"
      data-cursor="OPEN"
      data-index={index}
      y={40}
      amount={0.3}
      delay={index * 0.04}
    >
      <span className="fill" aria-hidden="true" />
      <span className="w-index">/{String(index + 1).padStart(2, '0')}</span>
      <span>
        <h3 className="w-title">
          {project.title} <span className="serif">{project.serif}</span>
        </h3>
        <div className="w-tags">{project.tags}</div>
      </span>
      <span className="w-meta">
        <span>{project.year}</span>
        <svg className="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M7 17 17 7M8 7h9v9" />
        </svg>
      </span>
    </Reveal>
  )
}

export default function Work() {
  const [hovered, setHovered] = useState(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const px = useSpring(x, { stiffness: 260, damping: 26, mass: 0.7 })
  const py = useSpring(y, { stiffness: 260, damping: 26, mass: 0.7 })

  const onMove = (e) => {
    x.set(e.clientX + 24)
    y.set(e.clientY - 110)
    const row = e.target.closest('.work-row')
    const index = row ? Number(row.dataset.index) : null
    setHovered(index === null ? null : PROJECTS[index])
  }

  const onLeave = () => {
    setHovered(null)
  }

  useEffect(() => {
    const clearPreview = () => onLeave()
    window.addEventListener('scroll', clearPreview, { passive: true })
    return () => window.removeEventListener('scroll', clearPreview)
  }, [])

  return (
    <section id="work" className="sec-pad">
      <div className="wrap">
        <div className="sec-head">
          <div>
            <span className="label">Selected work</span>
            <h2 className="sec-title">
              Things I <em>actually</em> built
            </h2>
          </div>
          <span className="sec-index">({String(PROJECTS.length).padStart(2, '0')})</span>
        </div>

        <div
          className="work-list"
          onMouseMove={onMove}
          onMouseLeave={onLeave}
        >
          {PROJECTS.map((p, i) => (
            <Row key={p.title} project={p} index={i} />
          ))}
        </div>
      </div>

      <motion.div
        className="work-preview"
        style={{ x: px, y: py }}
        animate={{ opacity: hovered ? 1 : 0, scale: hovered ? 1 : 0.9 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        aria-hidden="true"
      >
        {hovered && (
          <div className="pv-inner">
            <div className="pv-type">{hovered.kind}</div>
            <div className="pv-sub">{hovered.desc}</div>
          </div>
        )}
      </motion.div>
    </section>
  )
}
