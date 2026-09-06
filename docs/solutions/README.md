# Solutions — institutional learnings

> Captured patterns from this codebase that took a non-obvious decision to
> land. Each entry is searchable by frontmatter (`tags`) and self-contained
> so a future maintainer (or AI agent) can apply it without re-deriving the
> rationale.

## What goes here

A "solution" is a recurring pattern that's *bigger than a snippet but
smaller than a plan* — too narrow for [`CONTROLS.md`](../CONTROLS.md) (which
captures architecture decisions) and too concrete for [`talking-points.md`](../talking-points.md)
(which captures interview framing). Solutions are the *how* that maps the
*what* in CONTROLS.md to working code.

Each entry follows this shape:

- **Frontmatter** — `name`, `description`, `type` (`pattern` | `bug-fix`
  | `workflow` | `design`), `tags` (searchable), `related_code` (paths).
- **Problem** — what constraint or friction the entry addresses.
- **Solution** — the approach with rationale, not implementation code.
- **Key invariants** — the rules that must NOT change without breaking the
  pattern's value.
- **Trade-offs** — what this costs (extra ceremony, performance, etc.).
- **Related** — links to the plan that introduced it, the CONTROLS entry
  it implements, or sibling solutions.

## Current solutions

| Solution | Type | Tags |
| --- | --- | --- |
| [Admin token: fail-closed pattern](admin-token-fail-closed-pattern.md) | pattern | `auth`, `php`, `laravel`, `security`, `fail-closed` |
| [Inline two-step confirmation](inline-two-step-confirmation-pattern.md) | pattern | `react`, `nextjs`, `forms`, `ux`, `accessibility` |

## When to add a new entry

Add an entry when ALL of these are true:

1. You made a decision that required non-trivial reasoning (more than "I
   wrote it that way because it works").
2. The decision is **reusable** — you'd apply it the same way to a new
   endpoint, a new component, or a new feature.
3. The decision is **not yet captured** in `CONTROLS.md`, `talking-points.md`,
   or the README. Solutions complement those — they don't replace them.

If you're tempted to write a solution entry but it's actually a one-off
fix (a specific bug, a one-time refactor), put it in a commit message
instead. Solutions are for *patterns*, not *incidents*.

## Frontmatter schema

```yaml
---
name: kebab-case-slug  # unique across this directory
description: one-line summary used by search agents to decide relevance
type: pattern | bug-fix | workflow | design
tags: [comma, separated, searchable, terms]
related_code:
  - apps/php-api/app/Http/Controllers/PartController.php
  - apps/hub/src/lib/parts.ts
---
```

`related_code` paths are repo-relative so they survive machine moves.
`tags` are intentionally lowercase + singular to make grep easy.
