'use client';

import {
  useActionState,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { AlertCircle, Save, Trash2 } from 'lucide-react';
import {
  deletePartAction,
  submitPartAction,
} from '@/lib/parts-actions';
import { CATEGORIES } from '@/lib/part-schema';

type FormState =
  | { ok: false; fieldErrors: Record<string, string[]>; error?: string }
  | { ok: true; redirectTo: string };

type DeleteState =
  | { ok: false; error?: string }
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
const INITIAL_DELETE_STATE: DeleteState = { ok: false };

/**
 * Stable id used to associate the edit inputs with the Save Changes form via
 * HTML5 `form="..."` attribute. R9 requires Save and Delete to be sibling
 * `<form>` elements (nested forms are dropped by browsers); without this
 * attribute, the Save form — which wraps only the submit button — would
 * submit an empty FormData and the edit payload would be lost.
 */
const SAVE_FORM_ID = 'part-form-save';

function SubmitButton({
  mode,
  disabled,
}: {
  readonly mode: 'create' | 'edit';
  readonly disabled: boolean;
}): React.ReactElement {
  const { pending } = useFormStatus();
  const isDisabled = pending || disabled;
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
      disabled={isDisabled}
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

interface DeleteFormProps {
  readonly partNumber: string;
  readonly token: string;
  /** Notified when the delete submission is in flight so the Save button can
   *  disable during the pending window (R11 — concurrent-edit prevention). */
  readonly onPendingChange: (pending: boolean) => void;
}

/**
 * Two-step destructive action for the edit page. Click Delete → button
 * toggles into a "Cancel" + "Confirm Delete" pair; Escape cancels and
 * returns focus to the (restored) Delete button. The component owns its own
 * `useActionState` and error alert because R9's sibling-form restructure
 * prevents it from writing into the parent edit form's state shape.
 */
function DeleteForm({
  partNumber,
  token,
  onPendingChange,
}: DeleteFormProps): React.ReactElement {
  const router = useRouter();
  const [state, formAction] = useActionState<DeleteState, FormData>(
    deletePartAction.bind(null, partNumber, token),
    INITIAL_DELETE_STATE,
  );
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (state.ok) {
      router.push(state.redirectTo);
      router.refresh();
    }
  }, [state, router]);

  // R13: Escape cancels the confirm state and returns focus to the Delete
  // button (which re-renders once `confirming` flips back to false).
  //
  // The keydown listener is attached to `document` so Escape works regardless
  // of focus location — including from the Cancel or Confirm button itself.
  // The cleanup function removes it on unmount or when `confirming` flips.
  // The post-cancel focus uses `requestAnimationFrame` so it fires after the
  // Cancel/Confirm pair unmounts and the Delete button remounts. The focus
  // call is null-safe via optional chaining in case the component unmounted
  // mid-frame (e.g., user navigated away).
  useEffect(() => {
    if (!confirming) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setConfirming(false);
        requestAnimationFrame(() => deleteButtonRef.current?.focus());
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [confirming]);

  // R13: When toggling into the confirm state, move focus to the new Confirm
  // button so the next Enter press fires the destructive action without an
  // extra Tab.
  useEffect(() => {
    if (confirming) {
      requestAnimationFrame(() => confirmButtonRef.current?.focus());
    }
  }, [confirming]);

  return (
    <div className="flex flex-col items-end gap-2">
      {state.ok === false && state.error !== undefined ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-2">
        {confirming ? (
          <>
            <form action={formAction}>
              <ConfirmDeleteSubmit
                onPendingChange={onPendingChange}
                onLocalPendingChange={setPending}
                buttonRef={confirmButtonRef}
              />
            </form>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              // R11: Cancel is disabled while the destructive action is in
              // flight. Otherwise clicking Cancel flips the UI back to the
              // Delete button, but the in-flight server action still resolves
              // and the success-navigate effect overrides the user's intent.
              disabled={pending}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-destructive/40 bg-background px-4 text-sm font-medium text-destructive transition-colors hover:bg-destructive/5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            ref={deleteButtonRef}
            type="button"
            onClick={() => setConfirming(true)}
            disabled={pending}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-destructive/40 bg-background px-4 text-sm font-medium text-destructive transition-colors hover:bg-destructive/5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Submit button for the confirm step. Lives inside its own `<form>` so
 * `useFormStatus` reads the parent form's pending state. Reports pending
 * upward via `onPendingChange` so the parent PartForm can disable the Save
 * Changes button (R11), and locally via `onLocalPendingChange` so the
 * DeleteForm can disable the Cancel button during the same window.
 */
function ConfirmDeleteSubmit({
  onPendingChange,
  onLocalPendingChange,
  buttonRef,
}: {
  readonly onPendingChange: (pending: boolean) => void;
  readonly onLocalPendingChange: (pending: boolean) => void;
  readonly buttonRef: React.RefObject<HTMLButtonElement | null>;
}): React.ReactElement {
  const { pending } = useFormStatus();
  useEffect(() => {
    onPendingChange(pending);
    onLocalPendingChange(pending);
  }, [pending, onPendingChange, onLocalPendingChange]);

  return (
    <button
      ref={buttonRef}
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="inline-flex h-10 items-center gap-2 rounded-md bg-destructive px-4 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Deleting…' : 'Confirm Delete'}
    </button>
  );
}

export function PartForm({
  mode,
  token,
  partNumber,
  initialValues,
}: PartFormProps): React.ReactElement {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
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

  const isEdit = mode === 'edit';

  return (
    <div className="flex flex-col gap-5">
      <Field
        id="part_number"
        label="Part number (SKU)"
        errorMessages={state.ok ? undefined : state.fieldErrors.part_number}
      >
        <input
          id="part_number"
          name="part_number"
          form={SAVE_FORM_ID}
          type="text"
          required
          maxLength={50}
          defaultValue={partNumber ?? ''}
          readOnly={isEdit}
          aria-describedby={isEdit ? 'part_number-readonly' : undefined}
          className={`${inputClass} font-mono ${isEdit ? 'cursor-not-allowed bg-muted text-muted-foreground' : ''}`}
        />
        {isEdit ? (
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
          form={SAVE_FORM_ID}
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
          form={SAVE_FORM_ID}
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
            form={SAVE_FORM_ID}
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
            form={SAVE_FORM_ID}
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
          form={SAVE_FORM_ID}
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
          form={SAVE_FORM_ID}
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
          form={SAVE_FORM_ID}
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

      <div className={isEdit ? 'flex items-center justify-between' : 'flex'}>
        <form id={SAVE_FORM_ID} action={formAction}>
          <SubmitButton mode={mode} disabled={deleting} />
        </form>

        {isEdit && partNumber !== undefined ? (
          <DeleteForm
            partNumber={partNumber}
            token={token}
            onPendingChange={setDeleting}
          />
        ) : null}
      </div>
    </div>
  );
}
