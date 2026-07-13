import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

// Blend-mode cursor: a dot glued to the pointer + a lazy ring behind it.
// The ring grows and shows a hint when hovering anything marked data-cursor.
export default function Cursor() {
  const [hint, setHint] = useState('')
  const [visible, setVisible] = useState(false)

  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const ringX = useSpring(x, { stiffness: 320, damping: 28, mass: 0.6 })
  const ringY = useSpring(y, { stiffness: 320, damping: 28, mass: 0.6 })

  useEffect(() => {
    const move = (e) => {
      x.set(e.clientX)
      y.set(e.clientY)
      setVisible(true)
      const target = e.target.closest('[data-cursor]')
      setHint(target ? target.dataset.cursor : '')
    }
    const leave = () => setVisible(false)
    window.addEventListener('mousemove', move)
    document.documentElement.addEventListener('mouseleave', leave)
    return () => {
      window.removeEventListener('mousemove', move)
      document.documentElement.removeEventListener('mouseleave', leave)
    }
  }, [x, y])

  const active = hint !== ''

  return (
    <>
      <motion.div
        className="cursor-dot"
        style={{ x, y, translateX: '-50%', translateY: '-50%' }}
        animate={{ opacity: visible ? 1 : 0, scale: active ? 0 : 1 }}
        transition={{ duration: 0.2 }}
      />
      <motion.div
        className="cursor-ring"
        style={{ x: ringX, y: ringY, translateX: '-50%', translateY: '-50%' }}
        animate={{
          opacity: visible ? 1 : 0,
          scale: active ? 1.8 : 1,
          backgroundColor: active ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0)',
        }}
        transition={{ duration: 0.25 }}
      >
        {active && <span style={{ color: '#000', mixBlendMode: 'normal' }}>{hint}</span>}
      </motion.div>
    </>
  )
}
