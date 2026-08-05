import Reveal from './Reveal.jsx'
import { PROFILE, SKILLS } from '../data.js'

const FACTS = [
  ['Now', 'Software Engineer Intern (R&D) — HDRE'],
  ['Study', PROFILE.studying],
  ['Focus', 'Full-stack software engineering'],
  ['Strength', 'Engineering + interaction design'],
  ['Location', PROFILE.location],
  ['Open to', PROFILE.openTo],
]

export default function About() {
  return (
    <section id="about" className="inverted sec-pad" aria-labelledby="about-title">
      <div className="wrap">
        <div className="sec-head">
          <div>
            <Reveal as="span" className="label" y={0}>About</Reveal>
            <Reveal as="h2" className="sec-title" id="about-title" y={20}>
              Business brain,<br />
              <em>engineer's</em> hands
            </Reveal>
          </div>
          <span className="sec-index">(02)</span>
        </div>

        <div className="about-grid">
          <Reveal>
            <p className="about-lead">
              I came to software through business, so I think about the product,
              the user and the system <em>before I start building.</em>
            </p>
            <div className="about-body">
              <p>
                I am completing a Master of Information Technology at the University of
                Queensland and working as a Software Engineer Intern at HDRE.
              </p>
              <p>
                I build across the full product stack — from responsive interfaces and
                interactive experiences to backend logic, APIs, databases and data-driven
                applications.
              </p>
              <p>
                My work includes a renewable-energy research dashboard, a full-stack
                portfolio and content-management platform built for a 3D/CG designer, and
                an ambitious browser-based 3D game.
              </p>
              <p>
                My visual and interaction-design skills help me build software that is
                clearer, more engaging and more polished.
              </p>
            </div>
          </Reveal>

          <Reveal as="dl" className="about-facts" delay={0.12}>
            {FACTS.map(([k, v]) => (
              <div className="fact" key={k}>
                <dt className="k">{k}</dt>
                <dd className="v">{v}</dd>
              </div>
            ))}
          </Reveal>
        </div>

        <Reveal className="skills-band">
          <span className="label">Toolbox</span>
          <div className="skill-line">
            {SKILLS.map((s) => (
              <span key={s}>{s}</span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
