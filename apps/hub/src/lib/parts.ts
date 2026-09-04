import 'server-only';
import { revalidatePath } from 'next/cache';
import {
  createPartSchema,
  updatePartSchema,
  type CreatePartInput,
  type UpdatePartInput,
} from './part-schema';

/**
 * Wire shape of a single part as returned by the PHP API's `PartResource`.
 *
 * `unit_cost` is a string on the wire because the PHP `Part` model casts it
 * as `decimal:2`. The form input is `type="number"` and the submit-time
 * helper coerces back to a number before the Zod gate; the JSON body sent
 * to the PHP API re-serializes it (Laravel's `numeric` rule accepts both).
 */
export interface Part {
  id: number;
  part_number: string;
  name: string;
  description: string;
  unit_cost: string;
  inventory_qty: number;
  bin_location: string | null;
  category: string;
  manufacturer: string;
  created_at: string;
  updated_at: string;
}

/** Laravel pagination envelope around a PartResource collection. */
export interface PartsListResponse {
  data: Part[];
  meta?: {
    current_page: number;
    from: number | null;
    last_page: number;
    path: string;
    per_page: number;
    to: number | null;
    total: number;
  };
  links?: Record<string, unknown>;
}

const DEFAULT_API_URL = 'http://localhost:8000';
const REQUEST_TIMEOUT_MS = 5_000;

/**
 * Resolves the PHP API URL at call time. Production requires `https:` so the
 * admin token never crosses a cleartext wire — mirroring the fail-closed
 * posture in `PartController::adminTokenIsValid` (see also operational notes
 * in the admin UI plan).
 */
function getApiUrl(): string {
  const url = process.env.PHP_API_URL ?? DEFAULT_API_URL;
  if (process.env.NODE_ENV === 'production' && !url.startsWith('https://')) {
    throw new Error(
      `PHP_API_URL must use https:// in production (got ${url}). ` +
        'Set the env var in the Vercel dashboard.',
    );
  }
  return url;
}

/**
 * Custom error class. Carries the upstream HTTP status and a sanitized body
 * shape so debug-mode stack traces and SQL fragments from Laravel never
 * reach the browser.
 *
 * Body shape:
 *   - 422: { errors: { field: string[] } }  (Laravel validation messages)
 *   - all other non-2xx: { error: <statusText> }
 *   - network/timeout: { error: 'Network error' | 'Request timeout' }
 */
export class PartsFetchError extends Error {
  override readonly name = 'PartsFetchError';
  constructor(
    message: string,
    readonly status: number,
    readonly body: { error?: string; errors?: Record<string, string[]> },
    readonly cause?: unknown,
  ) {
    super(message);
  }
}

/**
 * Internal fetch wrapper with a 5-second AbortController timeout. A hung PHP
 * API produces a `PartsFetchError` with `status: 0` and a generic body
 * instead of an indefinite blank page.
 */
async function request(path: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(`${getApiUrl()}${path}`, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

/** Parses a Laravel error body into the sanitized shape. */
async function parseErrorBody(res: Response): Promise<PartsFetchError['body']> {
  let raw: unknown;
  try {
    raw = await res.json();
  } catch {
    return { error: res.statusText || 'Request failed' };
  }
  if (res.status === 422 && typeof raw === 'object' && raw !== null) {
    const errors = (raw as { errors?: Record<string, string[]> }).errors;
    if (errors && typeof errors === 'object') {
      return { errors };
    }
  }
  return { error: res.statusText || 'Request failed' };
}

function buildHeaders(token: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Admin-Token': token,
  };
}

/**
 * Fetches the parts list with `?per_page=100` so the controller's max doesn't
 * silently truncate when the recruiter adds more than the default of 25 parts
 * during the demo.
 */
export async function listParts(token: string): Promise<Part[]> {
  let res: Response;
  try {
    res = await request('/api/parts?per_page=100', {
      headers: buildHeaders(token),
      cache: 'no-store',
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new PartsFetchError('PHP API request timed out', 0, { error: 'Request timeout' }, err);
    }
    throw new PartsFetchError('PHP API unreachable', 0, { error: 'Network error' }, err);
  }
  if (!res.ok) {
    const body = await parseErrorBody(res);
    throw new PartsFetchError(`PHP API returned ${res.status}`, res.status, body);
  }
  const payload = (await res.json()) as PartsListResponse;
  return payload.data;
}

export async function getPart(token: string, partNumber: string): Promise<Part> {
  let res: Response;
  try {
    res = await request(
      `/api/parts/${encodeURIComponent(partNumber)}`,
      { headers: buildHeaders(token), cache: 'no-store' },
    );
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new PartsFetchError('PHP API request timed out', 0, { error: 'Request timeout' }, err);
    }
    throw new PartsFetchError('PHP API unreachable', 0, { error: 'Network error' }, err);
  }
  if (res.status === 404) {
    const body = await parseErrorBody(res);
    throw new PartsFetchError(`Part ${partNumber} not found`, 404, body);
  }
  if (!res.ok) {
    const body = await parseErrorBody(res);
    throw new PartsFetchError(`PHP API returned ${res.status}`, res.status, body);
  }
  // Laravel wraps single resources in `{ data: ... }` via JsonResource's
  // default $wrap = 'data' attribute; unwrap to match the Part interface.
  const envelope = (await res.json()) as { data: Part };
  return envelope.data;
}

export async function createPart(token: string, input: CreatePartInput): Promise<Part> {
  let res: Response;
  try {
    res = await request('/api/parts', {
      method: 'POST',
      headers: buildHeaders(token),
      body: JSON.stringify(input),
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new PartsFetchError('PHP API request timed out', 0, { error: 'Request timeout' }, err);
    }
    throw new PartsFetchError('PHP API unreachable', 0, { error: 'Network error' }, err);
  }
  if (!res.ok) {
    const body = await parseErrorBody(res);
    throw new PartsFetchError(`PHP API returned ${res.status}`, res.status, body);
  }
  const envelope = (await res.json()) as { data: Part };
  return envelope.data;
}

export async function updatePart(
  token: string,
  partNumber: string,
  input: UpdatePartInput,
): Promise<Part> {
  let res: Response;
  try {
    res = await request(
      `/api/parts/${encodeURIComponent(partNumber)}`,
      {
        method: 'PATCH',
        headers: buildHeaders(token),
        body: JSON.stringify(input),
      },
    );
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new PartsFetchError('PHP API request timed out', 0, { error: 'Request timeout' }, err);
    }
    throw new PartsFetchError('PHP API unreachable', 0, { error: 'Network error' }, err);
  }
  if (!res.ok) {
    const body = await parseErrorBody(res);
    throw new PartsFetchError(`PHP API returned ${res.status}`, res.status, body);
  }
  const envelope = (await res.json()) as { data: Part };
  return envelope.data;
}

/**
 * Coerces a `FormData` payload into the typed shape Zod expects. Kept as a
 * pure helper so the validation logic is unit-testable without a React render.
 *
 * Number fields are parsed with `parseFloat` / `parseInt` and an empty string
 * becomes `NaN` (which Zod rejects as a type error).
 */
export function formDataToCreateInput(formData: FormData): CreatePartInput {
  const get = (key: string): string => (formData.get(key) as string | null) ?? '';
  const binRaw = get('bin_location').trim();
  return {
    part_number: get('part_number').trim(),
    name: get('name').trim(),
    description: get('description').trim(),
    unit_cost: parseFloat(get('unit_cost')),
    inventory_qty: parseInt(get('inventory_qty'), 10),
    bin_location: binRaw === '' ? null : binRaw,
    category: get('category') as CreatePartInput['category'],
    manufacturer: get('manufacturer').trim(),
  };
}

export function formDataToUpdateInput(formData: FormData): UpdatePartInput {
  const get = (key: string): string => (formData.get(key) as string | null) ?? '';
  const result: Record<string, unknown> = {};
  for (const key of [
    'part_number',
    'name',
    'description',
    'unit_cost',
    'inventory_qty',
    'bin_location',
    'category',
    'manufacturer',
  ]) {
    const raw = get(key);
    if (raw === '') continue;
    if (key === 'unit_cost') result[key] = parseFloat(raw);
    else if (key === 'inventory_qty') result[key] = parseInt(raw, 10);
    else if (key === 'bin_location') result[key] = raw;
    else result[key] = raw.trim();
  }
  return result as UpdatePartInput;
}

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
  'use server';
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
