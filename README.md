# Wesley Wu — Portfolio

A black-and-white editorial portfolio with an interactive 3D human figure in the hero.
Built with React, Vite, React Three Fiber (Three.js) and Framer Motion.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build → dist/
npm run preview  # preview the production build
```

## Where to edit things

Everything you'll want to change lives in **`src/data.js`**:

- `PROFILE` — role, summary and the hero/about facts (shared by several sections)
- `EMAIL` — the contact email shown on the site
- `SOCIALS` — your GitHub / LinkedIn links
- `RESUME_URL` — `null` by default. Drop a PDF in `public/` and point this at it
  to switch the Résumé actions on; while it is `null` no résumé link is rendered.
- `NAV_LINKS` — desktop and mobile navigation
- `PROJECTS` — the work list. Links are explicit rather than one generic `url`:
  - `liveUrl` renders a **Live site ↗** action, `sourceUrl` renders **Source ↗**
  - a project may have both, one, or neither
  - with neither, `status` is printed instead and no arrow icon is shown
  - `kind`, `role`, `focus` and `stack` feed the floating preview card
- `EXPERIENCE` / `EDUCATION` — the Experience section (section id is still `#journey`)
- `SKILLS` — the toolbox row in About
- `MARQUEE_ITEMS` — the scrolling band under the hero

Copy for the About and Contact sections is in
`src/components/About.jsx` and `src/components/Contact.jsx`.

## Project case studies

Every project has its own page at `#/work/<slug>`, rendered by
`src/components/ProjectPage.jsx`.

Routing is hash-based (`src/useHashRoute.js`) — no router dependency, and it
survives a page refresh on GitHub Pages, which serves a single `index.html` and
would otherwise 404 on a real path. In-page anchors (`#work`, `#about`, …) are
deliberately not routes: anything that does not start with `#/` falls through to
the home page and normal anchor scrolling.

A case study reads from `PROJECTS[n].detail`:

- `overview` — the lead paragraph (falls back to `desc`)
- `problem` — optional "The problem" block
- `highlights` — optional array, rendered as the "What I built" list
- `stackDetail` — the full stack (the homepage row keeps the short version)
- `note` — optional closing caveat, e.g. "the repository is not public"

Every field is optional; a block that has no data is not rendered at all.

### Adding screenshots

1. Put the images in `public/work/<slug>/`, e.g. `public/work/bw-studio/admin.png`
2. List them in that project's `gallery` array in `src/data.js`:

```js
gallery: [
  { src: 'work/bw-studio/admin.png', alt: 'The admin works list', caption: 'Admin — works' },
]
```

`src` must start with `work/` (no leading slash) — it is resolved against the
Vite base URL so it keeps working under the GitHub Pages sub-path. `alt` is
required for accessibility. `caption` is optional. An empty `gallery` renders no
gallery section at all, so a project without images never shows a broken frame.

## The 3D model

The hero figure is loaded in `src/components/Scene.jsx` from a public Three.js
example model (`Xbot.glb`) and re-shaded as mercury. To use your own scanned
avatar, replace `MODEL_URL` with a path to your `.glb` (drop the file in
`public/` and point to `/your-model.glb`).

The figure walks between per-section stations defined in
`src/components/characterMotion.js`. Those stations sit on side rails, and the
matching text safe zones are the `padding-inline` rules on `#work` / `#about` /
`#journey` in `index.css` — change one and you must change the other. Below
900px the character is hidden after the hero and the safe zones switch off.

The page never depends on it: if WebGL is unavailable or the model fails to
download, the canvas is skipped and the content renders unchanged.

## Structure

```
src/
  App.jsx            layout + preloader gate
  data.js            ← all your content
  index.css          design tokens + all styles
  components/
    Preloader.jsx    intro screen
    Nav.jsx          fixed nav + Brisbane clock
    Hero.jsx         name + 3D figure
    Scene.jsx        React Three Fiber canvas
    Marquee.jsx      scrolling keyword band
    Work.jsx         project list
    About.jsx        dark statement + toolbox
    Journey.jsx      experience + education
    Contact.jsx      email + socials
    Reveal.jsx       scroll-in animation (fail-safe: always reveals)
    Cursor.jsx       blend-mode custom cursor (desktop only)
```

The previous single-file template is kept in `_legacy/`.
