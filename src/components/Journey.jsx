import Reveal from './Reveal.jsx'
import { EXPERIENCE, EDUCATION } from '../data.js'

function Item({ item, delay }) {
  return (
    <Reveal as="li" className="j-item" delay={delay} y={26}>
      <div className="j-when">{item.when}</div>
      <h4 className="j-what">
        {item.what}
        {item.now && <span className="j-now">Now</span>}
      </h4>
      <div className="j-where">{item.where}</div>
      <p className="j-desc">{item.desc}</p>
    </Reveal>
  )
}

// The section id stays #journey: the 3D character's scroll stations and the
// safe-zone padding both key off it. Only the visible wording is "Experience".
export default function Journey() {
  return (
    <section id="journey" className="sec-pad" aria-labelledby="journey-title">
      <div className="wrap">
        <div className="sec-head">
          <div>
            <Reveal as="span" className="label" y={0}>Experience</Reveal>
            <Reveal as="h2" className="sec-title" id="journey-title" y={20}>
              Experience <em>&amp;</em> education
            </Reveal>
          </div>
          <span className="sec-index">(03)</span>
        </div>

        <div className="journey-cols">
          <div className="j-col">
            <h3 className="label">Experience</h3>
            <ul className="j-list">
              {EXPERIENCE.map((e, i) => (
                <Item key={e.what} item={e} delay={i * 0.08} />
              ))}
            </ul>
          </div>
          <div className="j-col">
            <h3 className="label">Education</h3>
            <ul className="j-list">
              {EDUCATION.map((e, i) => (
                <Item key={e.what} item={e} delay={i * 0.08} />
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
