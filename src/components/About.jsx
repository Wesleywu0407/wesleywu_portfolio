import Reveal from './Reveal.jsx'
import { SKILLS } from '../data.js'

export default function About() {
  return (
    <section id="about" className="inverted sec-pad">
      <div className="wrap">
        <div className="sec-head">
          <div>
            <Reveal as="span" className="label" y={0}>About</Reveal>
            <Reveal as="h2" className="sec-title" y={20}>
              Business brain,<br />
              <em>engineer's</em> hands
            </Reveal>
          </div>
          <span className="sec-index">(02)</span>
        </div>

        <div className="about-grid">
          <Reveal>
            <p className="about-lead">
              I came to code through business school — so I build software the way
              a product person would, <em>and ship it the way an engineer has to.</em>
            </p>
            <div className="about-body">
              <p>
                Right now I'm doing my Master of IT at the University of Queensland and
                interning at HDRE, where I'm building a 3D game for the browser. Before
                that I taught agents to make decisions with reinforcement learning,
                made A* run fast with hand-built heuristics, and shipped 3D websites
                with Three.js.
              </p>
              <p>
                What ties it together: I like systems you can feel — a game loop, a
                scroll interaction, an agent learning in real time. If it moves and
                responds, I want to build it.
              </p>
            </div>
          </Reveal>

          <Reveal className="about-facts" delay={0.12}>
            {[
              ['Now', '3D Game Dev Intern — HDRE'],
              ['Study', 'MIT, Univ. of Queensland'],
              ['Focus', 'Full-stack · 3D web · AI/ML'],
              ['Location', 'Brisbane, Australia'],
              ['Open to', 'Backend / Frontend / AI roles'],
            ].map(([k, v]) => (
              <div className="fact" key={k}>
                <span className="k">{k}</span>
                <span className="v">{v}</span>
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
