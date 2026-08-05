import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { PROFILE } from '../data.js'

// The bar tracks real signals (fonts, window load) rather than a fake counter,
// so it never claims progress the browser has not actually made.
export default function Preloader() {
  const [steps, setSteps] = useState(1)

  useEffect(() => {
    let alive = true
    const advance = () => alive && setSteps((s) => Math.min(3, s + 1))

    document.fonts?.ready.then(advance) ?? advance()

    if (document.readyState === 'complete') advance()
    else window.addEventListener('load', advance, { once: true })

    return () => {
      alive = false
      window.removeEventListener('load', advance)
    }
  }, [])

  return (
    <motion.div
      className="preloader"
      exit={{ y: '-100%' }}
      transition={{ duration: 0.7, ease: [0.65, 0, 0.35, 1] }}
    >
      <div className="big">
        <motion.div
          initial={{ y: '110%' }}
          animate={{ y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          Wesley&nbsp;Wu
        </motion.div>
      </div>
      <div className="pre-foot">
        <span className="pre-role">{PROFILE.roleTitle}</span>
        <span className="pre-bar" aria-hidden="true">
          <span style={{ transform: `scaleX(${steps / 3})` }} />
        </span>
      </div>
    </motion.div>
  )
}
