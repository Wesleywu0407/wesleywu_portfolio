import Reveal from './Reveal.jsx'
import { PROJECTS } from '../data.js'
import { asset } from '../useHashRoute.js'

function NotFound() {
  return (
    <article className="project-page">
      <div className="wrap">
        <a className="p-back" href="#work">
          <span aria-hidden="true">←</span> All work
        </a>
        <h1 className="p-title">Not found</h1>
        <p className="p-lead">That project does not exist. Head back to the work list.</p>
      </div>
    </article>
  )
}

export default function ProjectPage({ slug }) {
  const index = PROJECTS.findIndex((p) => p.slug === slug)
  if (index === -1) return <NotFound />

  const project = PROJECTS[index]
  const detail = project.detail ?? {}
  const gallery = project.gallery ?? []
  const next = PROJECTS[(index + 1) % PROJECTS.length]

  const facts = [
    ['Role', project.role],
    ['Type', project.kind],
    ['Year', project.year],
    ['Stack', detail.stackDetail || project.stack],
    ['Status', project.status],
  ].filter(([, v]) => Boolean(v))

  return (
    <article className="project-page">
      <div className="wrap">
        <Reveal as="a" className="p-back" href="#work" y={0}>
          <span aria-hidden="true">←</span> All work
        </Reveal>

        <header className="p-head">
          <Reveal as="span" className="label" y={0}>
            {String(index + 1).padStart(2, '0')} — {project.kind}
          </Reveal>
          <Reveal as="h1" className="p-title" y={20}>
            {project.title} <span className="serif">{project.serif}</span>
          </Reveal>
          <Reveal as="p" className="p-lead" y={20} delay={0.06}>
            {detail.overview || project.desc}
          </Reveal>

          {(project.liveUrl || project.sourceUrl) && (
            <Reveal className="p-actions" y={20} delay={0.12}>
              {project.liveUrl && (
                <a
                  className="w-action"
                  href={project.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${project.title} — live site (opens in a new tab)`}
                  data-cursor="OPEN"
                >
                  Live site <span aria-hidden="true">↗</span>
                </a>
              )}
              {project.sourceUrl && (
                <a
                  className="w-action"
                  href={project.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${project.title} — source code on GitHub (opens in a new tab)`}
                  data-cursor="OPEN"
                >
                  Source <span aria-hidden="true">↗</span>
                </a>
              )}
            </Reveal>
          )}
        </header>

        <Reveal as="dl" className="p-facts" delay={0.08}>
          {facts.map(([k, v]) => (
            <div className="p-fact" key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </Reveal>

        {detail.problem && (
          <Reveal as="section" className="p-block" aria-labelledby="p-problem">
            <h2 className="p-h" id="p-problem">The problem</h2>
            <p className="p-body">{detail.problem}</p>
          </Reveal>
        )}

        {detail.highlights?.length > 0 && (
          <Reveal as="section" className="p-block" aria-labelledby="p-build">
            <h2 className="p-h" id="p-build">What I built</h2>
            <ul className="p-list">
              {detail.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Reveal>
        )}

        {/* Renders nothing at all when there are no local images, so an empty
            gallery can never produce a broken frame. */}
        {gallery.length > 0 && (
          <Reveal as="section" className="p-block" aria-labelledby="p-shots">
            <h2 className="p-h" id="p-shots">Screens</h2>
            <div className="p-gallery">
              {gallery.map((shot) => (
                <figure key={shot.src}>
                  <img src={asset(shot.src)} alt={shot.alt} loading="lazy" decoding="async" />
                  {shot.caption && <figcaption>{shot.caption}</figcaption>}
                </figure>
              ))}
            </div>
          </Reveal>
        )}

        {detail.note && (
          <Reveal as="p" className="p-note">
            {detail.note}
          </Reveal>
        )}

        <nav className="p-nav" aria-label="Project navigation">
          <a href="#work">
            <span aria-hidden="true">←</span> All work
          </a>
          <a href={`#/work/${next.slug}`}>
            Next: {next.title} <span aria-hidden="true">→</span>
          </a>
        </nav>
      </div>
    </article>
  )
}
