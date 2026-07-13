import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export default function Preloader() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const start = performance.now()
    let raf
    const tick = (now) => {
      const p = Math.min(1, (now - start) / 1400)
      // ease so the counter rushes early then settles
      setCount(Math.round(100 * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
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
      <div className="pct">{String(count).padStart(3, '0')}%</div>
    </motion.div>
  )
}
