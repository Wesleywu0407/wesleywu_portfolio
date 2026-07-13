import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

function BrisbaneClock() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat('en-AU', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Australia/Brisbane',
    })
    const update = () => setTime(fmt.format(new Date()))
    update()
    const id = setInterval(update, 10_000)
    return () => clearInterval(id)
  }, [])
  return <span className="clock">BNE {time} AEST</span>
}

export default function Nav() {
  return (
    <motion.header
      className="nav"
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="nav-inner">
        <a href="#top" className="brand" data-cursor="TOP">Wesley Wu</a>
        <nav className="nav-links" aria-label="Primary">
          <a href="#work">Work</a>
          <a href="#about">About</a>
          <a href="#journey">Journey</a>
          <a href="#contact">Contact</a>
        </nav>
        <BrisbaneClock />
      </div>
    </motion.header>
  )
}
