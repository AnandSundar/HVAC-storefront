---
name: inline-two-step-confirmation
description: How to confirm a destructive action on the same page (no modal) using sibling forms, HTML5 form="..." attribute, useFormStatus pending coordination, and Escape-to-cancel.
type: pattern
tags: [react, nextjs, forms, ux, accessibility, server-actions]
related_code:
  - apps/hub/src/components/admin/PartForm.tsx
  - apps/hub/src/lib/parts-actions.ts
  - apps/hub/tests/admin/parts.test.ts
---

# Inline two-step confirmation

## Problem

The edit page has a destructive action (Delete part) that should never be
one click away from data loss. We considered four patterns:

| Pattern | Why we rejected it |
| --- | --- |
| Browser `confirm()` dialog | Blocks the JS thread, looks dated, no theming |
| Modal dialog (Radix/shadcn Dialog) | Heavyweight for a single confirmation; demands focus trap, ARIA, portal, escape handling — all of which we end up needing inline too |
| Separate confirm page | Extra round-trip, breaks "I was just here" mental model |
| **Inline two-step** (Delete → Cancel + Confirm Delete) | Same page, no library, accessible-by-default |

The inline pattern is the right scope: the user is already on the edit
page; they didn't ask for a popup. We just need to add a confirm step.

## Solution

Three intertwined pieces:

1. **Sibling forms, not nested.** Browsers drop nested `<form>` elements,
   so Save (which submits the edit payload) and Delete (which submits the
   destructive action) must be siblings. The edit inputs carry an HTML5
   `form="part-form-save"` attribute that associates them with the Save
   form by id, even though they aren't children of it.

2. **Toggle state in the delete subtree.** `DeleteForm` owns a `confirming`
   boolean. When `false`, render the Delete button (no form wrapper). When
   `true`, render the Cancel button + a `<form action={formAction}>` wrapping
   the Confirm Delete submit button.

3. **`useFormStatus` to coordinate pending.** The Confirm Delete submit
   button lives inside its own `<form>` so `useFormStatus` reads that
   form's pending state. It reports upward via two callback props:
   `onPendingChange` (to disable the Save button in the parent `PartForm`)
   and `onLocalPendingChange` (to disable the Cancel button in `DeleteForm`
   itself). Both are needed — see "Why both?" below.

The Cancel/Confirm pair handle keyboard too:

- **Escape** cancels regardless of focus. A `document.addEventListener('keydown', ...)`
  is attached inside a `useEffect` keyed on `confirming` and cleaned up on
  unmount.
- **Focus** moves to the Confirm Delete button when toggling in
  (`requestAnimationFrame` so it fires after the button mounts) and back to
  the Delete button when cancelling (same trick).

## Key invariants

- **Save form id is stable.** The constant `SAVE_FORM_ID` is referenced by
  every edit input's `form={SAVE_FORM_ID}` attribute AND by the form's `id`.
  Renaming it without updating all eight inputs silently drops the edit
  payload on Save.
- **Pending coordination is bidirectional.** R11 in the origin plan
  documents why: cancelling while the action is in flight lets the success
  navigate override the user's intent. Both callbacks exist for a reason.
- **No nested forms.** The Confirm Delete submit lives inside its own
  `<form>`, never inside the Save form. Browsers silently drop nested
  forms and the action button stops doing anything.
- **No browser-native `confirm()`.** Use the in-page state. Native
  dialogs block the JS thread and bypass the focus management we set up.

## Why both `onPendingChange` AND `onLocalPendingChange`?

`useFormStatus` only reports the parent `<form>`'s pending state. The
Confirm Delete submit is inside the Delete form, but the Save button is in
a sibling form. The Delete form's local state can disable its own Cancel
button (preventing the user from canceling an in-flight action), but it
cannot reach the Save button — that's owned by `PartForm`. So:

- `onLocalPendingChange` (passed `setPending`): disable Cancel in the same form.
- `onPendingChange` (passed `setDeleting` from `PartForm`): disable Save in
  the sibling form.

Both are necessary. Skipping `onLocalPendingChange` lets the user cancel
while the action is in flight; skipping `onPendingChange` lets them click
Save during a delete and trigger a concurrent edit.

## Trade-offs

- **State duplication.** `confirming` lives in `DeleteForm`; `deleting`
  lives in `PartForm`. The two are related but not derivable — the user
  can confirm without being pending yet. Considered lifting both to
  `PartForm`, but that leaks the delete UI's internal state up.
- **`useActionState` cannot be shared across sibling forms.** R9's
  restructure had to give `DeleteForm` its own `useActionState` because
  the action signature (`deletePartAction(partNumber, token, _prev, _formData)`)
  doesn't accept the parent form's state shape.
- **Keyboard handler attached to `document`.** Not the most testable
  pattern, but it's the only way to catch Escape when focus is on the
  Cancel button itself. Documented in the code.

## Related

- Origin plan: [`docs/plans/2026-09-05-001-feat-admin-delete-part-plan.md`](../plans/2026-09-05-001-feat-admin-delete-part-plan.md) — drove the
  sibling-form restructure and documents R9, R10, R11, R13.
- Sibling: the Create page uses the same `<form>` with `submitPartAction`
  but without the two-step pattern (creation is not destructive).
