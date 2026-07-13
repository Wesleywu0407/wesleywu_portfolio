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

- `EMAIL` — the contact email shown on the site
- `SOCIALS` — your GitHub / LinkedIn links
- `PROJECTS` — the work list (title, one-word serif tag, description, tech, year, link)
- `EXPERIENCE` / `EDUCATION` — the Journey section
- `SKILLS` — the toolbox row in About
- `MARQUEE_ITEMS` — the scrolling band under the hero

Copy for the About and Contact sections is in
`src/components/About.jsx` and `src/components/Contact.jsx`.

## The 3D model

The hero figure is loaded in `src/components/Scene.jsx` from a public Three.js
example model (`Xbot.glb`) and re-shaded as white plaster. To use your own
scanned avatar, replace `MODEL_URL` with a path to your `.glb`
(drop the file in `public/` and point to `/your-model.glb`). The figure turns to
follow the cursor and the render loop pauses when the hero scrolls off-screen.

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
