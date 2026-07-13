import { useEffect, useRef, useState } from 'react'

// Scroll-reveal using a native IntersectionObserver + CSS transitions.
// A hard timeout guarantees the content is revealed even if the observer
// never fires — content can never get stuck invisible.
export default function Reveal({
  children,
  as: Tag = 'div',
  className,
  delay = 0,
  y = 34,
  style,
  ...rest
}) {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setShown(true)
      return
    }

    let done = false
    const reveal = () => {
      if (done) return
      done = true
      setShown(true)
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            reveal()
            io.disconnect()
            break
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(el)

    // fail-safe: reveal no matter what after 1.8s
    const fallback = setTimeout(reveal, 1800)

    return () => {
      io.disconnect()
      clearTimeout(fallback)
    }
  }, [])

  return (
    <Tag
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'none' : `translateY(${y}px)`,
        transition: `opacity .75s cubic-bezier(.22,1,.36,1) ${delay}s, transform .8s cubic-bezier(.22,1,.36,1) ${delay}s`,
        willChange: 'opacity, transform',
        ...style,
      }}
      {...rest}
    >
      {children}
    </Tag>
  )
}
