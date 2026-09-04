'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { AlertCircle, Save } from 'lucide-react';
import { submitPartAction } from '@/lib/parts';
import { CATEGORIES } from '@/lib/part-schema';

type FormState =
  | { ok: false; fieldErrors: Record<string, string[]>; error?: string }
  | { ok: true; redirectTo: string };

interface PartFormProps {
  readonly mode: 'create' | 'edit';
  /** Admin token from the httpOnly cookie. Read by the parent server component. */
  readonly token: string;
  /** Existing part data — required for `mode="edit"`, ignored for `mode="create"`. */
  readonly partNumber?: string;
  readonly initialValues?: {
    readonly name?: string;
    readonly description?: string;
    readonly unit_cost?: string;
    readonly inventory_qty?: number;
    readonly bin_location?: string | null;
    readonly category?: string;
    readonly manufacturer?: string;
  };
}

const INITIAL_STATE: FormState = { ok: false, fieldErrors: {} };

function SubmitButton({
  mode,
}: {
  readonly mode: 'create' | 'edit';
}): React.ReactElement {
  const { pending } = useFormStatus();
  const label = pending
    ? mode === 'create'
      ? 'Creating…'
      : 'Saving…'
    : mode === 'create'
      ? 'Create part'
      : 'Save changes';
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Save className="h-4 w-4" />
      {label}
    </button>
  );
}

function FieldError({
  id,
  messages,
}: {
  readonly id: string;
  readonly messages: readonly string[] | undefined;
}): React.ReactElement | null {
  if (!messages || messages.length === 0) return null;
  return (
    <p
      id={id}
      role="alert"
      className="mt-1 flex items-start gap-1 text-xs text-destructive"
    >
      <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
      <span>{messages[0]}</span>
    </p>
  );
}

function Field({
  id,
  label,
  errorMessages,
  children,
  hint,
}: {
  readonly id: string;
  readonly label: string;
  readonly errorMessages: readonly string[] | undefined;
  readonly children: React.ReactNode;
  readonly hint?: string;
}): React.ReactElement {
  const hasError = (errorMessages?.length ?? 0) > 0;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {hasError ? (
        <FieldError id={`${id}-error`} messages={errorMessages} />
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

const inputClass =
  'block h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40';

export function PartForm({
  mode,
  token,
  partNumber,
  initialValues,
}: PartFormProps): React.ReactElement {
  const router = useRouter();
  // Bind the server action with the mode + partNumber + token so the
  // client-side handler signature matches useActionState's expected
  // (prev, formData) shape. `bind()` is the canonical way to plumb
  // contextual data into a server action invoked from a client
  // component; the bound args are serialized into the RPC payload.
  const action = submitPartAction.bind(
    null,
    mode,
    partNumber ?? null,
    token,
  );
  const [state, formAction] = useActionState<FormState, FormData>(
    action,
    INITIAL_STATE,
  );

  useEffect(() => {
    if (state.ok) {
      router.push(state.redirectTo);
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Field
        id="part_number"
        label="Part number (SKU)"
        errorMessages={state.ok ? undefined : state.fieldErrors.part_number}
      >
        <input
          id="part_number"
          name="part_number"
          type="text"
          required
          maxLength={50}
          defaultValue={partNumber ?? ''}
          readOnly={mode === 'edit'}
          aria-describedby={mode === 'edit' ? 'part_number-readonly' : undefined}
          className={`${inputClass} font-mono ${mode === 'edit' ? 'cursor-not-allowed bg-muted text-muted-foreground' : ''}`}
        />
        {mode === 'edit' ? (
          <span id="part_number-readonly" className="sr-only">
            Part number is read-only on the edit page.
          </span>
        ) : null}
      </Field>

      <Field
        id="name"
        label="Name"
        errorMessages={state.ok ? undefined : state.fieldErrors.name}
      >
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={255}
          defaultValue={initialValues?.name ?? ''}
          className={inputClass}
        />
      </Field>

      <Field
        id="description"
        label="Description"
        errorMessages={state.ok ? undefined : state.fieldErrors.description}
      >
        <textarea
          id="description"
          name="description"
          required
          rows={3}
          defaultValue={initialValues?.description ?? ''}
          className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40"
        />
      </Field>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field
          id="unit_cost"
          label="Unit cost (USD)"
          errorMessages={state.ok ? undefined : state.fieldErrors.unit_cost}
          hint="Decimal, two-place precision."
        >
          <input
            id="unit_cost"
            name="unit_cost"
            type="number"
            required
            min={0}
            step={0.01}
            defaultValue={initialValues?.unit_cost ?? ''}
            className={inputClass}
          />
        </Field>

        <Field
          id="inventory_qty"
          label="Inventory qty"
          errorMessages={state.ok ? undefined : state.fieldErrors.inventory_qty}
        >
          <input
            id="inventory_qty"
            name="inventory_qty"
            type="number"
            required
            min={0}
            step={1}
            defaultValue={initialValues?.inventory_qty ?? ''}
            className={inputClass}
          />
        </Field>
      </div>

      <Field
        id="bin_location"
        label="Bin location"
        errorMessages={state.ok ? undefined : state.fieldErrors.bin_location}
        hint="Optional. Aisle-bay-shelf code, e.g. A-12-3."
      >
        <input
          id="bin_location"
          name="bin_location"
          type="text"
          maxLength={50}
          defaultValue={initialValues?.bin_location ?? ''}
          className={`${inputClass} font-mono`}
        />
      </Field>

      <Field
        id="category"
        label="Category"
        errorMessages={state.ok ? undefined : state.fieldErrors.category}
      >
        <select
          id="category"
          name="category"
          required
          defaultValue={initialValues?.category ?? ''}
          className={inputClass}
        >
          {initialValues?.category ? null : (
            <option value="" disabled>
              Select a category…
            </option>
          )}
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Field>

      <Field
        id="manufacturer"
        label="Manufacturer"
        errorMessages={state.ok ? undefined : state.fieldErrors.manufacturer}
      >
        <input
          id="manufacturer"
          name="manufacturer"
          type="text"
          required
          maxLength={100}
          defaultValue={initialValues?.manufacturer ?? ''}
          className={inputClass}
        />
      </Field>

      {state.ok ? null : state.error ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      ) : null}

      <div>
        <SubmitButton mode={mode} />
      </div>
    </form>
  );
}
