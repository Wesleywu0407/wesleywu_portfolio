export const EMAIL = 's4866163@student.uq.edu.au'

export const SOCIALS = [
  { name: 'GitHub', url: 'https://github.com/Wesleywu0407' },
  { name: 'LinkedIn', url: 'https://www.linkedin.com/in/wesley-wu-1b9900308' },
]

// Single source of truth for the professional copy that appears in more than
// one place (hero, about, metadata). Keeping it here stops the three sections
// from drifting apart.
export const PROFILE = {
  name: 'Wesley Wu',
  role: 'full-stack software engineer',
  roleTitle: 'Full-Stack Software Engineer',
  summary:
    'I build complete web products across frontend, backend and data — with a strong focus on interaction and visual quality.',
  currently: 'Software Engineer Intern (R&D) @ HDRE',
  studying: 'Master of IT — University of Queensland',
  location: 'Brisbane, Australia',
  graduating: 'December 2026',
  openTo: 'Graduate Software Engineer / Full-Stack Developer roles',
}

// Résumé is intentionally absent: no PDF exists in this repository yet, and a
// dead download link is worse than no link. Drop a file in `public/` and set
// this to its path (e.g. '/wesley-wu-resume.pdf') to switch the action on.
export const RESUME_URL = null

export const NAV_LINKS = [
  { label: 'Work', href: '#work' },
  { label: 'About', href: '#about' },
  // The section id stays #journey so the 3D character's scroll logic keeps
  // working; only the visible label changed to "Experience".
  { label: 'Experience', href: '#journey' },
  { label: 'Contact', href: '#contact' },
]

// Every project has a case-study page at #/work/<slug>.
//
// SCREENSHOTS: drop image files in `public/work/<slug>/` and list them in
// `gallery` as { src, alt, caption? }. `src` must start with `work/` — it is
// resolved against the Vite base URL so it keeps working under the GitHub Pages
// sub-path. An empty gallery renders nothing at all, so a project without
// images never shows a broken frame.
export const PROJECTS = [
  {
    slug: 'hdre',
    title: 'HDRE',
    serif: 'internship',
    desc: "Contributed to a Python and Streamlit research dashboard for Australia's renewable-energy transition, improving data presentation, interface clarity and maintainable feature implementation.",
    tags: 'Python · Streamlit · Plotly · Energy Data',
    year: '2026',
    kind: 'Professional Software Engineering',
    role: 'Software Engineer Intern (R&D)',
    focus: 'Research dashboard for energy-transition data',
    stack: 'Python · Streamlit · Plotly',
    liveUrl: null,
    sourceUrl: null,
    status: 'Private company project',
    gallery: [
      {
        src: 'work/hdre/hdre-team.jpg',
        alt: 'A group of HDRE colleagues and interns standing together in front of the HDRE logo wall at the office.',
        caption: 'At the HDRE office',
      },
    ],
    detail: {
      overview:
        "A research dashboard for Australia's renewable-energy transition and electricity market, built with Python and Streamlit. I work on it as an R&D software engineering intern, implementing features in an existing codebase and improving how dense energy data is presented.",
      highlights: [
        'Implemented dashboard features against an existing Python and Streamlit codebase.',
        'Improved how dense energy-market data is presented and navigated.',
        'Focused on interface clarity and on keeping new features maintainable.',
      ],
      stackDetail: 'Python · Streamlit · Plotly',
      note: 'This is a private company project. The repository is not public, and no confidential data, internal metrics or business outcomes are published here.',
    },
  },
  {
    slug: 'bw-studio',
    title: 'BW Studio',
    serif: 'client portfolio',
    desc: 'Designed and built a full-stack portfolio and content-management platform for a 3D/CG designer, combining a cinematic public experience with an admin workflow for publishing and managing media-rich projects.',
    tags: 'Next.js · TypeScript · Prisma · SQLite',
    year: '2026',
    kind: 'Real-World Full-Stack Project',
    role: 'Full-Stack Developer & Designer',
    focus: 'Public portfolio + content-management workflow',
    stack: 'Next.js · TypeScript · Prisma · SQLite',
    liveUrl: 'https://bwstudio-kohl.vercel.app/',
    sourceUrl: 'https://github.com/Wesleywu0407/bwstudio',
    status: 'Live project',
    gallery: [],
    detail: {
      overview:
        'A full-stack portfolio and content-management platform built for a 3D/CG designer. The public side is a dark, video-led showcase where the work itself is the only source of light. Behind it sits an admin area where the designer publishes and manages their own projects without touching code.',
      problem:
        'A CG designer needs their work shown as motion rather than thumbnails, across mixed aspect ratios — and needs to keep it up to date themselves.',
      highlights: [
        'Public experience: home, works index, individual work pages and an about page, built on the Next.js App Router.',
        'Single-admin authentication using iron-session with bcrypt password hashing, plus rate limiting on the login route.',
        'Admin workflow to create, edit, delete and reorder projects, with draft/published and featured states.',
        'Server-side media pipeline: an uploaded video is processed with ffmpeg and sharp to generate a short silent preview clip, a poster frame and a blur placeholder, with the aspect ratio detected from the file.',
        'Mixed-ratio layout support (16:9, 9:16, 4:5, 1:1) so the grid adapts to whatever the designer publishes.',
        'Editable site settings — name, tagline, about text, contact address, social links and showreel.',
        'Prisma data model covering projects, stills and settings; deployed on Vercel.',
      ],
      stackDetail:
        'Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Framer Motion · Prisma 6 · PostgreSQL / SQLite · iron-session · bcrypt · sharp · ffmpeg · Vercel',
      note: 'I designed and developed the platform. The 3D/CG work shown inside it belongs to the designer it was built for.',
    },
  },
  {
    slug: 'nansieng',
    title: 'Taiwan Nan Sieng',
    serif: 'client website',
    desc: 'Designed and built the booking website for a professional lion-dance troupe, from the public site through to a Supabase backend and a custom CRM the client uses to work their enquiries.',
    tags: 'Eleventy · Supabase · Edge Functions · CMS',
    year: '2026',
    kind: 'Freelance Client Project',
    role: 'Freelance Developer & Designer (solo)',
    focus: 'Turning search traffic into booking enquiries',
    stack: 'Eleventy · Nunjucks · Supabase',
    liveUrl: 'https://nansiengtaiwan.com/',
    sourceUrl: 'https://github.com/Wesleywu0407/lion-dance-website',
    status: 'Live and in use by the client',
    gallery: [],
    detail: {
      overview:
        'The official site for Taiwan Nan Sieng Dragon & Lion Dance Activity Centre, a Taipei-based troupe performing across Taiwan. It is not a brochure site — its job is to take an event organiser from search result to confirmed enquiry in as few steps as possible, and then to hand that enquiry to the troupe in a form they can actually work. I took the project on solo, from design through build, backend and deployment.',
      problem:
        'Most bookings start on a phone, and organisers need to answer three questions fast: is this troupe right for my event, what can they actually perform, and how do I get a date and a quote? Enquiries also arrived scattered across LINE and phone with nowhere to track them.',
      highlights: [
        'Public site built with Eleventy 3 and Nunjucks: home, about, services and contact pages, plus event-case galleries and dedicated search landing pages.',
        'Entry points organised by event situation — opening ceremonies, corporate events, year-end parties, temple festivals, department stores and school programmes — so an organiser self-selects instead of reading a service list.',
        'Supabase backend with a Postgres schema, Auth and Edge Functions covering enquiry intake, an admin API, event analytics and a notification queue with rate limiting.',
        'Custom CRM at /crm/ where the troupe filters and opens enquiries, records follow-ups, moves status and exports to CSV.',
        'Client edits all content and photography through Sveltia CMS without touching code; a FormSubmit path keeps the enquiry form working if the backend is ever unavailable.',
        'Mobile-first booking flow with a persistent quick-contact bar for LINE and phone, since mobile is the primary way enquiries arrive.',
        'Build-time image optimisation via eleventy-img and sharp, and a test pipeline running unit tests, a full build, a local link check and a backend contract check.',
      ],
      stackDetail:
        'Eleventy 3 · Nunjucks · HTML · CSS · JavaScript · TypeScript · Supabase (Postgres, Auth, Edge Functions) · Sveltia CMS · Cloudflare · eleventy-img / sharp · Node.js 20',
      note: 'Built as a freelance commission. The brand, photography and performance content belong to Taiwan Nan Sieng Dragon & Lion Dance Activity Centre.',
    },
  },
  {
    slug: 'veilcore',
    title: 'Veilcore',
    serif: 'motion game',
    desc: 'A browser motion game played with your body — no headset, controller or install. I built the webcam hand and body tracking that is its entire input layer.',
    tags: 'MediaPipe · Computer Vision · WebGL',
    year: '2026',
    kind: 'Computer Vision & Real-Time Graphics',
    role: 'Tracking Developer & Visual Direction',
    focus: 'Real-time webcam tracking as the only input',
    stack: 'MediaPipe · WebGL',
    liveUrl: null,
    sourceUrl: null,
    status: 'In development — not public yet',
    gallery: [],
    detail: {
      overview:
        "A motion game that runs in a browser tab. A webcam tracks the player's hands and body, and that is the entire input layer. It was shown on a full LED wall at NUAXION's garage showcase in September 2026, where visitors figured out the bow without a single instruction. I wrote the tracking code, and designed the 3D assets and visual direction.",
      problem:
        'Hands are always moving. The hard part is not recognising a shape but deciding when a gesture starts and ends — separating intent from noise so false triggers stay low enough that the game never fights the player.',
      highlights: [
        'Wrote the webcam hand and body tracking code with MediaPipe that drives every interaction in the game.',
        'Gesture casting: the player draws a shape in the air and it becomes a spell.',
        'Archery: the player pulls back an invisible bowstring — draw length maps to power, and wind on the range changes where the arrow lands. The moment of release is what separates holding a bow from dragging a slider.',
        'Tracking, gesture logic, physics and rendering share a single frame budget on an ordinary laptop, over WebGL.',
        'Designed the 3D assets and set the visual direction, so the world answers each gesture convincingly.',
      ],
      stackDetail: 'MediaPipe (hand & body tracking) · WebGL · Browser',
      note: 'Team project, still being tuned. The repository and build are not public yet.',
    },
  },
  {
    slug: 'runespire',
    title: 'Runespire',
    serif: 'hackathon',
    desc: 'A browser game played with your hands, built in 48 hours at the UQ Computing Society Hackathon 2026. I wrote the real-time hand tracking that turns shapes traced in the air into spells.',
    tags: 'MediaPipe · Hand Tracking · Game Dev',
    year: '2026',
    kind: 'Hackathon Project',
    role: 'Hand-Tracking Developer (team of five)',
    focus: 'Real-time hand tracking as game input',
    stack: 'MediaPipe · Browser',
    liveUrl: null,
    sourceUrl: null,
    status: 'Hackathon build — not public yet',
    gallery: [],
    detail: {
      overview:
        'Draw the rune, cast the spell. Runespire is a browser game you play with your hands: a webcam tracks them in real time, and whatever shape you trace in the air becomes the magic. It plays single-player or with a room full of people at their screens together. Built by a team of five in 48 hours at the UQ Computing Society Hackathon 2026; I wrote the hand-tracking code.',
      highlights: [
        'Wrote the real-time webcam hand-tracking code with MediaPipe that serves as the game’s input.',
        'Shapes traced in the air are turned into spells.',
        'Supports single-player and a shared-room mode.',
        'Designed, built and demoed within the 48-hour hackathon window.',
      ],
      stackDetail: 'MediaPipe (hand tracking) · Browser',
      note: 'Hackathon team project. The repository is not public yet.',
    },
  },
  {
    slug: '2nd-games',
    title: '2nd Games',
    serif: '3D game',
    desc: 'A browser-based 3D game with flight, combat, explorable environments, NPC interaction and multiple game modes.',
    tags: 'Three.js · JavaScript · Game Systems',
    year: '2026',
    kind: 'Browser-Based 3D Game',
    role: 'Solo Developer',
    focus: 'Flight, combat, exploration and game systems',
    stack: 'Three.js · JavaScript',
    liveUrl: 'https://wesleywu0407.github.io/2ndgames/',
    sourceUrl: 'https://github.com/Wesleywu0407/2ndgames',
    status: 'Playable in the browser',
    gallery: [],
    detail: {
      overview:
        'A browser-based 3D game built with Three.js. From a lobby you step into themed rooms; the flagship is a first-person, flyable night city where lantern-bearing residents carry on living between sessions. It runs as a plain static site with no build step — a small Node server is optional and only adds persistence.',
      highlights: [
        'First-person flight and combat: take off, fly with WASD, rise and descend, switch between three weapons and cast.',
        'Several explorable rooms reached from a gallery lobby, each with its own environment and rules.',
        'NPC interaction — greet, help or attack residents — driven by an editable JSON file that acts as the design source of truth.',
        'Three game modes: Solo Story, Solo Hunt, and a split-screen Local Versus for two players on one keyboard.',
        'Optional Node server adding a persistent world on SQLite with a REST snapshot API; actions carry an id so a lost response never applies twice, and the client queues actions offline to replay on reconnect.',
        'LAN multiplayer over WebSocket: players appear to each other as lantern-bearers and can defend the same city together in a server-authoritative co-op siege.',
        'Settings panel with language (English / 繁體中文), audio, graphics quality and controls, saved per device.',
      ],
      stackDetail: 'Three.js · JavaScript (ES modules) · Node.js · WebSocket · SQLite',
    },
  },
  {
    slug: 'deep-q-network',
    title: 'Deep Q-Network',
    serif: 'agent',
    desc: 'A reinforcement-learning agent trained to make decisions in a simulated environment using PyTorch and Gymnasium.',
    tags: 'PyTorch · Gymnasium · Reinforcement Learning',
    year: '2025',
    kind: 'AI Engineering Project',
    role: 'Developer',
    focus: 'Agent training and decision-making',
    stack: 'PyTorch · Gymnasium',
    liveUrl: null,
    sourceUrl: null,
    status: 'Academic project',
    gallery: [],
    detail: {
      overview:
        'A reinforcement-learning agent trained to make decisions in a simulated environment, implemented with PyTorch and Gymnasium.',
      stackDetail: 'PyTorch · Gymnasium',
      note: 'University project. The repository is not public.',
    },
  },
  {
    slug: 'cheesehunter',
    title: 'CheeseHunter',
    serif: 'search',
    desc: 'A search-based planning agent using A*, uniform-cost search and a custom admissible heuristic.',
    tags: 'Python · A* · UCS · Heuristics',
    year: '2025',
    kind: 'Algorithms Project',
    role: 'Developer',
    focus: 'Search, planning and heuristic design',
    stack: 'Python · A* · UCS',
    liveUrl: null,
    sourceUrl: 'https://github.com/Wesleywu0407/aisearchreport',
    status: 'View source',
    gallery: [],
    detail: {
      overview:
        'A search-based planning agent that finds optimal routes through a grid environment using A* and uniform-cost search, guided by a custom admissible heuristic.',
      stackDetail: 'Python · A* · UCS · Heuristic design',
      note: 'University project. The repository is public.',
    },
  },
  {
    slug: 'star-command',
    title: 'Star Command',
    serif: 'turn-based',
    desc: 'A turn-based strategy game built in Java with an MVC architecture and Swing interface.',
    tags: 'Java · Swing · MVC · OOP',
    year: '2024',
    kind: 'Software Engineering Project',
    role: 'Developer',
    focus: 'MVC architecture and game logic',
    stack: 'Java · Swing',
    liveUrl: null,
    sourceUrl: null,
    status: 'Academic project',
    gallery: [],
    detail: {
      overview:
        'A turn-based strategy game written in Java, structured with an MVC architecture and a Swing interface.',
      stackDetail: 'Java · Swing · MVC · OOP',
      note: 'University project. The repository is not public.',
    },
  },
]

export const EXPERIENCE = [
  {
    when: '2026 — Present',
    what: 'Software Engineer Intern (R&D)',
    where: 'HDRE',
    desc: "Contributing to a Python and Streamlit research dashboard for Australia's renewable-energy transition and electricity market.",
    now: true,
  },
  {
    when: 'Sep 2026',
    what: 'Tracking Developer — Veilcore',
    where: 'NUAXION garage showcase',
    desc: 'Wrote the MediaPipe hand and body tracking for a browser motion game shown on a full LED wall, and designed its 3D assets and visual direction.',
  },
  {
    when: 'Sep 2026',
    what: 'Hackathon — Runespire',
    where: 'UQ Computing Society Hackathon 2026',
    desc: 'Wrote the real-time MediaPipe hand tracking for a gesture-controlled spell-casting browser game, built by a team of five in 48 hours.',
  },
  {
    when: 'Dec 2025',
    what: 'Marketing Intern',
    where: 'Practera Program, Australia',
    desc: 'Conducted data-informed content analysis, competitor research and digital growth experiments.',
  },
]

export const EDUCATION = [
  {
    when: 'Feb 2025 — Dec 2026',
    what: 'Master of Information Technology',
    where: 'University of Queensland, Brisbane',
    desc: 'Coursework across software engineering, databases, web application development, algorithms and artificial intelligence.',
    now: true,
  },
  {
    when: '2019 — 2023',
    what: 'Bachelor of International Business',
    where: 'Ming Chuan University, Taiwan',
    desc: 'Developed a foundation in product thinking, business analysis and understanding user needs.',
  },
]

// Full-stack engineering first; every entry is backed by a project in this
// portfolio or by one of the linked repositories.
export const SKILLS = [
  'React',
  'Next.js',
  'TypeScript',
  'JavaScript',
  'Python',
  'Node.js',
  'REST APIs',
  'Prisma',
  'SQL',
  'PostgreSQL',
  'SQLite',
  'Streamlit',
  'Three.js',
  'MediaPipe',
  'Java',
  'PyTorch',
  'Git',
]

export const MARQUEE_ITEMS = [
  'Full-Stack Engineering',
  'React',
  'Next.js',
  'TypeScript',
  'Python',
  'Backend Systems',
  'Databases',
  'REST APIs',
  'Interactive Web',
  'Three.js',
  'Software Engineering',
]
