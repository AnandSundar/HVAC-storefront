'use server';

import { revalidatePath } from 'next/cache';
import {
  createPartSchema,
  updatePartSchema,
} from './part-schema';
import {
  createPart,
  formDataToCreateInput,
  formDataToUpdateInput,
  PartsFetchError,
  updatePart,
  type Part,
} from './parts';

/**
 * Server action for the create + edit form.
 *
 * Mapping rule for Laravel 422 responses: `errors → fieldErrors` (key rename
 * only; `string[]` values pass through verbatim). The client component
 * renders `fieldErrors[field][0]` below each input.
 *
 * On success the action returns `{ ok: true, redirectTo }` and the client
 * navigates with `router.push(redirectTo)` + `router.refresh()`. We avoid
 * calling `redirect()` from inside the action because that bypasses the
 * client-side side-effects (revalidation triggers, focus management, etc.)
 * that the client component owns in the `useActionState` flow.
 *
 * Lives in its own file with file-top `'use server'` because `PartForm` is a
 * client component that imports it via `useActionState`. Next.js cannot
 * bundle `server-only` modules for the client, so the action module must be
 * a server-actions-only file that the client can safely reference.
 */
export async function submitPartAction(
  mode: 'create' | 'edit',
  partNumber: string | null,
  token: string,
  _prev: unknown,
  formData: FormData,
): Promise<
  | { ok: true; redirectTo: string }
  | { ok: false; fieldErrors: Record<string, string[]>; error?: string }
> {
  if (mode === 'create') {
    const input = formDataToCreateInput(formData);
    const parsed = createPartSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, fieldErrors: issuesToFieldErrors(parsed.error.issues) };
    }
    let resultPart: Part;
    try {
      resultPart = await createPart(token, parsed.data);
    } catch (err) {
      return fetchErrorToState(err);
    }
    revalidatePath('/admin/inventory');
    return {
      ok: true,
      redirectTo: `/admin/inventory?created=${encodeURIComponent(resultPart.part_number)}`,
    };
  }
  const input = formDataToUpdateInput(formData);
  const parsed = updatePartSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: issuesToFieldErrors(parsed.error.issues) };
  }
  let resultPart: Part;
  try {
    resultPart = await updatePart(token, partNumber as string, parsed.data);
  } catch (err) {
    return fetchErrorToState(err);
  }
  revalidatePath('/admin/inventory');
  return {
    ok: true,
    redirectTo: `/admin/inventory?updated=${encodeURIComponent(resultPart.part_number)}`,
  };
}

function issuesToFieldErrors(issues: { path: (string | number)[]; message: string }[]): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of issues) {
    const key = issue.path.join('.') || '_form';
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return fieldErrors;
}

function fetchErrorToState(err: unknown): { ok: false; fieldErrors: Record<string, string[]>; error?: string } {
  if (err instanceof PartsFetchError) {
    if (err.status === 422 && err.body.errors) {
      return { ok: false, fieldErrors: err.body.errors };
    }
    return { ok: false, fieldErrors: {}, error: err.body.error ?? 'PHP API rejected the request' };
  }
  return { ok: false, fieldErrors: {}, error: 'Could not reach PHP API' };
}
