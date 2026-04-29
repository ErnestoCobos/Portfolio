# cobos.io · portfolio

Personal portfolio of **Ernesto Cobos** — Cloud Architect · Platform Engineer · DevSecOps.

> Operator-console aesthetic: terminal-flavored, data-rich, the portfolio as a control plane.

## Stack

- [Next.js 16](https://nextjs.org) (App Router, React Compiler, Turbopack)
- React 19
- Tailwind v4 (tokens) + plain CSS variables for the design system
- TypeScript

## Local development

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
pnpm build   # production build (statically prerendered)
pnpm start   # serve the build
pnpm lint    # eslint
```

## Project structure

```
app/
├── layout.tsx           ─ root layout, fonts (Inter, Inter Tight, JetBrains Mono)
├── globals.css          ─ design tokens (cyan/violet on dark) + utility classes
├── page.tsx             ─ portfolio entry
└── components/
    ├── Portfolio.tsx        ─ all sections (nav, hero, about, stack, infra, work, exp,
    │                          trends, blog, approach, contact)
    ├── portfolio-data.ts    ─ profile data, projects, experience, posts
    └── portfolio-visuals.tsx ─ animated canvas/svg primitives + hooks
```

## Design system tokens

| Token | Value |
|---|---|
| `--bg` | `#0A0A0F` |
| `--surface` | `#11111B` |
| `--cyan` | `#00D4FF` |
| `--violet` | `#7C3AED` |
| `--fg` | `#F8FAFC` |
| `--muted` | `#94A3B8` |

Type pairing: **Inter Tight** display · **Inter** body · **JetBrains Mono** for terminal-flavored UI.

## Contact

- email · [hola@cobos.io](mailto:hola@cobos.io)
- web · [cobos.io](https://cobos.io)
- github · [github.com/ErnestoCobos](https://github.com/ErnestoCobos)
