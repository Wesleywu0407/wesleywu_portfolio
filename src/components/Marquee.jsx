import { MARQUEE_ITEMS } from '../data.js'

export default function Marquee() {
  const chunk = (
    <>
      {MARQUEE_ITEMS.map((item) => (
        <span key={item}>
          {item} <span className="sep" aria-hidden="true">&nbsp;·&nbsp;</span>
        </span>
      ))}
    </>
  )
  return (
    <div className="marquee" data-character-zone="marquee" aria-hidden="true">
      <div className="marquee-track">
        <div className="marquee-chunk">{chunk}</div>
        <div className="marquee-chunk">{chunk}</div>
      </div>
    </div>
  )
}
