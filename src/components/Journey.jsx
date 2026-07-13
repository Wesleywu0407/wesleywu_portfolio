import Reveal from './Reveal.jsx'
import { EXPERIENCE, EDUCATION } from '../data.js'

function Item({ item, delay }) {
  return (
    <Reveal className="j-item" delay={delay} y={26}>
      <div className="j-when">{item.when}</div>
      <div className="j-what">
        {item.what}
        {item.now && <span className="j-now">Now</span>}
      </div>
      <div className="j-where">{item.where}</div>
      <p className="j-desc">{item.desc}</p>
    </Reveal>
  )
}

export default function Journey() {
  return (
    <section id="journey" className="sec-pad">
      <div className="wrap">
        <div className="sec-head">
          <div>
            <Reveal as="span" className="label" y={0}>Journey</Reveal>
            <Reveal as="h2" className="sec-title" y={20}>
              Where I've <em>been</em>
            </Reveal>
          </div>
          <span className="sec-index">(03)</span>
        </div>

        <div className="journey-cols">
          <div className="j-col">
            <span className="label">Experience</span>
            {EXPERIENCE.map((e, i) => (
              <Item key={e.what} item={e} delay={i * 0.08} />
            ))}
          </div>
          <div className="j-col">
            <span className="label">Education</span>
            {EDUCATION.map((e, i) => (
              <Item key={e.what} item={e} delay={i * 0.08} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
