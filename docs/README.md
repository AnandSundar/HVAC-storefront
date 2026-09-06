# Portfolio walk-through — 30-second pitch

> Built for the Sept 8, 2026 Robert Half virtual interview —
> Senior Software Engineer – Full Stack Developer
> (HVAC Distribution client, 12-month contract, Alberta Remote).

## What this is

A Next.js 15 monorepo that demonstrates the JD technology stack end-to-end:
**Next.js**, **React 19**, **TypeScript**, **Tailwind CSS**, **Zustand**.
Two apps (hub + storefront), one shared data package, deployable end-to-end in under 10 minutes.

```text
hvac-fullstack-portfolio/
├── apps/
│   ├── hub/            Next.js 15 portfolio landing page
│   └── storefront/     Next.js 15 HVAC parts eCommerce demo
└── packages/
    └── shared-data/    TS types + 25 HVAC product fixtures
```

## Tech stack at a glance

![Next.js](https://img.shields.io/badge/Next.js-15-000?logo=nextdotjs)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7_strict-3178c6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwindcss)
![Zustand](https://img.shields.io/badge/Zustand-5-4338ca)
![pnpm](https://img.shields.io/badge/pnpm-11-F69220?logo=pnpm)
![Turborepo](https://img.shields.io/badge/Turborepo-2.x-000?logo=turborepo)

## Three things to look at

1. **Hub** — [`apps/hub`](https://github.com/AnandSundar/hvac-fullstack-portfolio/tree/main/apps/hub) — the recruiter landing page, project card, tech badges, links to live demo.
2. **Storefront** — [`apps/storefront`](https://github.com/AnandSundar/hvac-fullstack-portfolio/tree/main/apps/storefront) — product grid, product detail, cart (Zustand), admin header link.
3. **Shared data package** — [`packages/shared-data`](https://github.com/AnandSundar/hvac-fullstack-portfolio/tree/main/packages/shared-data) — TypeScript types and 25 HVAC product fixtures consumed by both apps.

## Where to go from here

| If you want to… | Read… |
| --- | --- |
| Hear the interview talking points per technology | [`docs/talking-points.md`](talking-points.md) |
| See the full architecture decision matrix | [`docs/CONTROLS.md`](CONTROLS.md) |
| Visualise the topology | [`docs/diagrams/architecture.svg`](diagrams/architecture.svg) |
| Follow the request path user → page → API | [`docs/diagrams/data-flow.svg`](diagrams/data-flow.svg) |
| See how it deploys | [`docs/diagrams/deploy.svg`](diagrams/deploy.svg) |
| Run it locally or on Render / Vercel | [`docs/runbook.md`](runbook.md) |

## Walk order (read in this sequence)

1. **[`docs/talking-points.md`](talking-points.md)** — one paragraph per tech + key decision + trade-off
2. **[`docs/CONTROLS.md`](CONTROLS.md)** — the architecture decisions matrix
3. **[`docs/diagrams/architecture.svg`](diagrams/architecture.svg)** — component topology at a glance
4. **[`docs/diagrams/data-flow.svg`](diagrams/data-flow.svg)** — what happens when you click "Add to cart"
5. **[`docs/diagrams/deploy.svg`](diagrams/deploy.svg)** — what runs where
6. **[`docs/runbook.md`](runbook.md)** — how to run / deploy / troubleshoot it

## Scope reminder

This is a **demo**, not a production eCommerce platform. There is no real
authentication, no real payment processing, no PII handling. The deliberately
bounded scope is documented in [`docs/CONTROLS.md`](CONTROLS.md#scope-boundaries)
and in the [root README's "Why this exists" section](../README.md#why-this-exists).
