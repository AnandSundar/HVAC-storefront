import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

// revalidatePath runs from next/cache. The submitPartAction pulls it in as
// a transitive import; mock it so the test doesn't try to hit the runtime
// tag system.
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function createFormData(values: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(values)) {
    fd.set(key, value);
  }
  return fd;
}

const VALID_CREATE = {
  part_number: 'PHP-NEW',
  name: 'HVAC Filter',
  description: 'A reusable filter',
  unit_cost: '12.50',
  inventory_qty: '10',
  bin_location: 'A-1-3',
  category: 'Filters',
  manufacturer: 'Honeywell',
};

function jsonResponse(body: unknown, status = 200, statusText?: string): Response {
  return new Response(JSON.stringify(body), {
    status,
    statusText: statusText ?? statusTextFor(status),
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Mirrors the standard Node/http status texts happy-dom doesn't always set. */
function statusTextFor(status: number): string {
  switch (status) {
    case 200: return 'OK';
    case 201: return 'Created';
    case 404: return 'Not Found';
    case 422: return 'Unprocessable Entity';
    case 500: return 'Internal Server Error';
    case 503: return 'Service Unavailable';
    default: return '';
  }
}

const fixturePart = {
  id: 1,
  part_number: 'PHP-001',
  name: 'Filter A',
  description: 'HVAC filter',
  unit_cost: '89.99',
  inventory_qty: 100,
  bin_location: 'A1',
  category: 'Filters',
  manufacturer: 'Honeywell',
  created_at: '2026-01-01T00:00:00.000000Z',
  updated_at: '2026-01-01T00:00:00.000000Z',
};

const ADMIN_TOKEN = 'test-secret';

describe('listParts', () => {
  it('attaches X-Admin-Token and queries with ?per_page=100', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      const headers = init?.headers as Record<string, string> | undefined;
      expect(headers?.['X-Admin-Token']).toBe(ADMIN_TOKEN);
      return jsonResponse({ data: [fixturePart] });
    });
    vi.stubGlobal('fetch', fetchMock);
    const { listParts } = await import('../../src/lib/parts');
    const parts = await listParts(ADMIN_TOKEN);
    expect(parts).toHaveLength(1);
    expect(parts[0]?.part_number).toBe('PHP-001');
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('/api/parts?per_page=100');
  });

  it('throws PartsFetchError with sanitized body on 422', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse(
          {
            message: 'The given data was invalid.',
            errors: { unit_cost: ['Unit cost must be at least 0.'] },
          },
          422,
        ),
      ),
    );
    const { listParts, PartsFetchError } = await import('../../src/lib/parts');
    await expect(listParts(ADMIN_TOKEN)).rejects.toMatchObject({
      status: 422,
      body: { errors: { unit_cost: ['Unit cost must be at least 0.'] } },
    });
    await expect(listParts(ADMIN_TOKEN)).rejects.toBeInstanceOf(PartsFetchError);
  });

  it('drops non-validation fields from a 422 body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse(
          {
            message: 'drop me',
            errors: { name: ['Name is required.'] },
            exception: 'Symfony\\Component\\HttpKernel\\Exception\\HttpException',
            file: '/var/www/app/Http/Requests/StorePartRequest.php',
          },
          422,
        ),
      ),
    );
    const { listParts, PartsFetchError } = await import('../../src/lib/parts');
    const err = await listParts(ADMIN_TOKEN).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(PartsFetchError);
    const body = (err as InstanceType<typeof PartsFetchError>).body;
    expect(body).toEqual({ errors: { name: ['Name is required.'] } });
    expect(body).not.toHaveProperty('message');
    expect(body).not.toHaveProperty('exception');
    expect(body).not.toHaveProperty('file');
  });

  it('throws a generic PartsFetchError on 500', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ exception: 'SQLSTATE...', file: '/var/...' }, 500)),
    );
    const { listParts, PartsFetchError } = await import('../../src/lib/parts');
    const err = await listParts(ADMIN_TOKEN).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(PartsFetchError);
    expect((err as InstanceType<typeof PartsFetchError>).status).toBe(500);
    expect((err as InstanceType<typeof PartsFetchError>).body).toEqual({ error: 'Internal Server Error' });
  });

  it('throws PartsFetchError with status 0 and "Request timeout" on AbortError', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init?: RequestInit) => {
        return new Promise((_, reject) => {
          init?.signal?.addEventListener('abort', () => {
            const err = new Error('aborted');
            err.name = 'AbortError';
            reject(err);
          });
        });
      }),
    );
    const { listParts, PartsFetchError } = await import('../../src/lib/parts');
    const promise = listParts(ADMIN_TOKEN).catch((e: unknown) => e);
    await vi.advanceTimersByTimeAsync(5_001);
    const err = await promise;
    vi.useRealTimers();
    expect(err).toBeInstanceOf(PartsFetchError);
    expect((err as InstanceType<typeof PartsFetchError>).status).toBe(0);
    expect((err as InstanceType<typeof PartsFetchError>).body).toEqual({ error: 'Request timeout' });
  });

  it('throws PartsFetchError with status 0 and "Network error" on a network failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }),
    );
    const { listParts, PartsFetchError } = await import('../../src/lib/parts');
    const err = await listParts(ADMIN_TOKEN).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(PartsFetchError);
    expect((err as InstanceType<typeof PartsFetchError>).body).toEqual({ error: 'Network error' });
  });

  it('propagates the upstream JSON `error` field on a non-422 non-2xx (e.g. 403)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse({ error: 'Admin authentication required' }, 403, 'Forbidden'),
      ),
    );
    const { listParts, PartsFetchError } = await import('../../src/lib/parts');
    const err = await listParts(ADMIN_TOKEN).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(PartsFetchError);
    expect((err as InstanceType<typeof PartsFetchError>).status).toBe(403);
    expect((err as InstanceType<typeof PartsFetchError>).body).toEqual({
      error: 'Admin authentication required',
    });
  });

  it('falls back to res.statusText when a non-2xx body is not JSON (e.g. 403 HTML)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response('<html>Forbidden</html>', {
          status: 403,
          statusText: 'Forbidden',
          headers: { 'Content-Type': 'text/html' },
        }),
      ),
    );
    const { listParts, PartsFetchError } = await import('../../src/lib/parts');
    const err = await listParts(ADMIN_TOKEN).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(PartsFetchError);
    expect((err as InstanceType<typeof PartsFetchError>).status).toBe(403);
    expect((err as InstanceType<typeof PartsFetchError>).body).toEqual({ error: 'Forbidden' });
  });
});

describe('getPart', () => {
  it('URL-encodes the SKU path segment', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      // The slash in the submitted SKU is encoded to %2F by encodeURIComponent.
      expect(String(url)).toBe('http://localhost:8000/api/parts/PHP%2F001');
      return jsonResponse({ data: fixturePart });
    });
    vi.stubGlobal('fetch', fetchMock);
    const { getPart } = await import('../../src/lib/parts');
    const part = await getPart(ADMIN_TOKEN, 'PHP/001');
    expect(part.part_number).toBe('PHP-001');
  });

  it('throws PartsFetchError with status 404 when the part is missing', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ message: 'not found' }, 404)));
    const { getPart, PartsFetchError } = await import('../../src/lib/parts');
    const err = await getPart(ADMIN_TOKEN, 'PHP-MISSING').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(PartsFetchError);
    expect((err as InstanceType<typeof PartsFetchError>).status).toBe(404);
  });
});

describe('createPart', () => {
  it('POSTs to /api/parts with the JSON body', async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      expect(String(url)).toBe('http://localhost:8000/api/parts');
      expect(init?.method).toBe('POST');
      const body = JSON.parse(init?.body as string);
      expect(body).toMatchObject({
        part_number: 'PHP-NEW',
        unit_cost: 12.5,
        category: 'Filters',
      });
      return jsonResponse({ data: { ...fixturePart, part_number: 'PHP-NEW' } }, 201);
    });
    vi.stubGlobal('fetch', fetchMock);
    const { createPart } = await import('../../src/lib/parts');
    const part = await createPart(ADMIN_TOKEN, {
      part_number: 'PHP-NEW',
      name: 'X',
      description: 'Y',
      unit_cost: 12.5,
      inventory_qty: 1,
      bin_location: null,
      category: 'Filters',
      manufacturer: 'M',
    });
    expect(part.part_number).toBe('PHP-NEW');
  });
});

describe('updatePart', () => {
  it('PATCHes /api/parts/{part}', async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      expect(String(url)).toBe('http://localhost:8000/api/parts/PHP-001');
      expect(init?.method).toBe('PATCH');
      return jsonResponse({ data: fixturePart });
    });
    vi.stubGlobal('fetch', fetchMock);
    const { updatePart } = await import('../../src/lib/parts');
    const part = await updatePart(ADMIN_TOKEN, 'PHP-001', { inventory_qty: 50 });
    expect(part.part_number).toBe('PHP-001');
  });
});

describe('formDataToCreateInput', () => {
  it('coerces numeric fields and trims strings', async () => {
    const { formDataToCreateInput } = await import('../../src/lib/parts');
    const fd = new FormData();
    fd.set('part_number', '  PHP-X  ');
    fd.set('name', '  Filter X ');
    fd.set('description', '  desc ');
    fd.set('unit_cost', '89.99');
    fd.set('inventory_qty', '50');
    fd.set('bin_location', '');
    fd.set('category', 'Filters');
    fd.set('manufacturer', '  Honeywell ');
    const input = formDataToCreateInput(fd);
    expect(input).toEqual({
      part_number: 'PHP-X',
      name: 'Filter X',
      description: 'desc',
      unit_cost: 89.99,
      inventory_qty: 50,
      bin_location: null,
      category: 'Filters',
      manufacturer: 'Honeywell',
    });
  });
});

describe('formDataToUpdateInput', () => {
  it('omits empty fields', async () => {
    const { formDataToUpdateInput } = await import('../../src/lib/parts');
    const fd = new FormData();
    fd.set('unit_cost', '99.00');
    fd.set('inventory_qty', '');
    fd.set('name', '');
    const input = formDataToUpdateInput(fd);
    expect(input).toEqual({ unit_cost: 99.0 });
  });

  it('preserves provided fields', async () => {
    const { formDataToUpdateInput } = await import('../../src/lib/parts');
    const fd = new FormData();
    fd.set('name', 'New Name');
    fd.set('inventory_qty', '25');
    fd.set('bin_location', 'B2');
    const input = formDataToUpdateInput(fd);
    expect(input).toEqual({ name: 'New Name', inventory_qty: 25, bin_location: 'B2' });
  });
});

describe('submitPartAction – create', () => {
  it('returns { ok: true, redirectTo } with ?created=<sku> on a successful POST', async () => {
    const createdPart = { ...fixturePart, part_number: 'PHP-NEW' };
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      expect(String(url)).toBe('http://localhost:8000/api/parts');
      expect(init?.method).toBe('POST');
      const headers = init?.headers as Record<string, string> | undefined;
      expect(headers?.['X-Admin-Token']).toBe(ADMIN_TOKEN);
      const body = JSON.parse(init?.body as string);
      expect(body).toMatchObject({
        part_number: 'PHP-NEW',
        unit_cost: 12.5,
        category: 'Filters',
      });
      return jsonResponse({ data: createdPart }, 201);
    });
    vi.stubGlobal('fetch', fetchMock);
    const { submitPartAction } = await import('../../src/lib/parts-actions');
    const result = await submitPartAction(
      'create',
      null,
      ADMIN_TOKEN,
      undefined,
      createFormData(VALID_CREATE),
    );
    expect(result).toEqual({
      ok: true,
      redirectTo: '/admin/inventory?created=PHP-NEW',
    });
  });

  it('returns { ok: false, fieldErrors } when a required field is missing (no fetch issued)', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { submitPartAction } = await import('../../src/lib/parts-actions');
    const partial = { ...VALID_CREATE };
    delete (partial as Record<string, string>).name;
    const result = await submitPartAction(
      'create',
      null,
      ADMIN_TOKEN,
      undefined,
      createFormData(partial as Record<string, string>),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors.name).toBeDefined();
      expect(result.fieldErrors.name?.[0]).toMatch(/required/i);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('propagates a Laravel 422 as { ok: false, fieldErrors } keyed by field name', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse(
          {
            message: 'The given data was invalid.',
            errors: {
              unit_cost: ['Unit cost must be at least 0.'],
              manufacturer: ['Manufacturer is required.'],
            },
          },
          422,
        ),
      ),
    );
    const { submitPartAction } = await import('../../src/lib/parts-actions');
    const result = await submitPartAction(
      'create',
      null,
      ADMIN_TOKEN,
      undefined,
      createFormData(VALID_CREATE),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors.unit_cost?.[0]).toBe('Unit cost must be at least 0.');
      expect(result.fieldErrors.manufacturer?.[0]).toBe('Manufacturer is required.');
      // No top-level `error` set for 422 — the field-level errors ARE the
      // feedback.
      expect(result.error).toBeUndefined();
    }
  });

  it('returns { ok: false, error } for a non-422 upstream failure (e.g. 500)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ exception: 'SQLSTATE...' }, 500)),
    );
    const { submitPartAction } = await import('../../src/lib/parts-actions');
    const result = await submitPartAction(
      'create',
      null,
      ADMIN_TOKEN,
      undefined,
      createFormData(VALID_CREATE),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('Internal Server Error');
      expect(result.fieldErrors).toEqual({});
    }
  });

  it('returns { ok: false, error } for a network error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }),
    );
    const { submitPartAction } = await import('../../src/lib/parts-actions');
    const result = await submitPartAction(
      'create',
      null,
      ADMIN_TOKEN,
      undefined,
      createFormData(VALID_CREATE),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('Network error');
    }
  });
});

describe('submitPartAction – edit', () => {
  it('returns { ok: true, redirectTo } with ?updated=<sku> on a successful PATCH', async () => {
    const updatedPart = { ...fixturePart, inventory_qty: 50 };
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      expect(String(url)).toBe('http://localhost:8000/api/parts/PHP-001');
      expect(init?.method).toBe('PATCH');
      return jsonResponse({ data: updatedPart });
    });
    vi.stubGlobal('fetch', fetchMock);
    const { submitPartAction } = await import('../../src/lib/parts-actions');
    const fd = new FormData();
    fd.set('inventory_qty', '50');
    const result = await submitPartAction(
      'edit',
      'PHP-001',
      ADMIN_TOKEN,
      undefined,
      fd,
    );
    expect(result).toEqual({
      ok: true,
      redirectTo: '/admin/inventory?updated=PHP-001',
    });
  });

  it('returns { ok: false, fieldErrors } on a 422 from the edit (Zod passes, PHP rejects)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse(
          { message: 'invalid', errors: { inventory_qty: ['Out of range for this SKU.'] } },
          422,
        ),
      ),
    );
    const { submitPartAction } = await import('../../src/lib/parts-actions');
    const fd = new FormData();
    fd.set('inventory_qty', '999999');
    const result = await submitPartAction(
      'edit',
      'PHP-001',
      ADMIN_TOKEN,
      undefined,
      fd,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors.inventory_qty?.[0]).toBe('Out of range for this SKU.');
    }
  });
});

describe('deletePart', () => {
  it('attaches X-Admin-Token and DELETEs /api/parts/<sku> with method DELETE', async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      expect(String(url)).toBe('http://localhost:8000/api/parts/PHP-001');
      expect(init?.method).toBe('DELETE');
      const headers = init?.headers as Record<string, string> | undefined;
      expect(headers?.['X-Admin-Token']).toBe(ADMIN_TOKEN);
      // Accept: application/json documents that we want Laravel's JSON
      // exception renderer for non-2xx (otherwise Laravel returns HTML404).
      expect(headers?.['Accept']).toBe('application/json');
      // 204 No Content — empty body, status only.
      return new Response(null, { status: 204, statusText: 'No Content' });
    });
    vi.stubGlobal('fetch', fetchMock);
    const { deletePart } = await import('../../src/lib/parts');
    const result = await deletePart(ADMIN_TOKEN, 'PHP-001');
    expect(result).toBeUndefined();
  });

  it('URL-encodes the SKU path segment (e.g. slash → %2F)', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      expect(String(url)).toBe('http://localhost:8000/api/parts/PHP%2F001');
      return new Response(null, { status: 204, statusText: 'No Content' });
    });
    vi.stubGlobal('fetch', fetchMock);
    const { deletePart } = await import('../../src/lib/parts');
    const result = await deletePart(ADMIN_TOKEN, 'PHP/001');
    expect(result).toBeUndefined();
  });

  it('throws PartsFetchError with status 404 when the part is missing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ message: 'No query results for model [App\\Models\\Part] PHP-MISSING' }, 404)),
    );
    const { deletePart, PartsFetchError } = await import('../../src/lib/parts');
    const err = await deletePart(ADMIN_TOKEN, 'PHP-MISSING').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(PartsFetchError);
    const fetchErr = err as InstanceType<typeof PartsFetchError>;
    expect(fetchErr.status).toBe(404);
    // Message names the SKU so the caller (PartForm) can present "Part <sku> not found".
    expect(fetchErr.message).toMatch(/PHP-MISSING.*not found/);
  });

  it('propagates the upstream JSON `error` field on a 403', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse({ error: 'Admin authentication required' }, 403, 'Forbidden'),
      ),
    );
    const { deletePart, PartsFetchError } = await import('../../src/lib/parts');
    const err = await deletePart(ADMIN_TOKEN, 'PHP-001').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(PartsFetchError);
    const fetchErr = err as InstanceType<typeof PartsFetchError>;
    expect(fetchErr.status).toBe(403);
    expect(fetchErr.body).toEqual({ error: 'Admin authentication required' });
  });

  it('throws PartsFetchError with status 0 and "Request timeout" on AbortError', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init?: RequestInit) => {
        return new Promise((_, reject) => {
          init?.signal?.addEventListener('abort', () => {
            const err = new Error('aborted');
            err.name = 'AbortError';
            reject(err);
          });
        });
      }),
    );
    const { deletePart, PartsFetchError } = await import('../../src/lib/parts');
    const promise = deletePart(ADMIN_TOKEN, 'PHP-001').catch((e: unknown) => e);
    await vi.advanceTimersByTimeAsync(5_001);
    const err = await promise;
    vi.useRealTimers();
    expect(err).toBeInstanceOf(PartsFetchError);
    const fetchErr = err as InstanceType<typeof PartsFetchError>;
    expect(fetchErr.status).toBe(0);
    expect(fetchErr.body).toEqual({ error: 'Request timeout' });
  });

  it('throws PartsFetchError with status 0 and "Network error" on a network failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }),
    );
    const { deletePart, PartsFetchError } = await import('../../src/lib/parts');
    const err = await deletePart(ADMIN_TOKEN, 'PHP-001').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(PartsFetchError);
    const fetchErr = err as InstanceType<typeof PartsFetchError>;
    expect(fetchErr.status).toBe(0);
    expect(fetchErr.body).toEqual({ error: 'Network error' });
  });
});

describe('deletePartAction', () => {
  it('returns {ok: true, redirectTo: ?deleted=<sku>} and revalidates /admin/inventory on 204', async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      expect(String(url)).toBe('http://localhost:8000/api/parts/PHP-001');
      expect(init?.method).toBe('DELETE');
      const headers = init?.headers as Record<string, string> | undefined;
      expect(headers?.['X-Admin-Token']).toBe(ADMIN_TOKEN);
      return new Response(null, { status: 204, statusText: 'No Content' });
    });
    vi.stubGlobal('fetch', fetchMock);
    const { revalidatePath } = await import('next/cache');
    const { deletePartAction } = await import('../../src/lib/parts-actions');
    const result = await deletePartAction(
      'PHP-001',
      ADMIN_TOKEN,
      undefined,
      new FormData(),
    );
    expect(result).toEqual({
      ok: true,
      redirectTo: '/admin/inventory?deleted=PHP-001',
    });
    expect(revalidatePath).toHaveBeenCalledTimes(1);
    expect(revalidatePath).toHaveBeenCalledWith('/admin/inventory');
  });

  it('returns {ok: false, error: "Admin authentication required"} on 403', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse({ error: 'Admin authentication required' }, 403, 'Forbidden'),
      ),
    );
    const { revalidatePath } = await import('next/cache');
    const { deletePartAction } = await import('../../src/lib/parts-actions');
    const result = await deletePartAction(
      'PHP-001',
      ADMIN_TOKEN,
      undefined,
      new FormData(),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('Admin authentication required');
    }
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('returns {ok: false, error: "Part <sku> not found"} on 404', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse(
          { message: 'No query results for model [App\\Models\\Part] PHP-001' },
          404,
          'Not Found',
        ),
      ),
    );
    const { deletePartAction } = await import('../../src/lib/parts-actions');
    const result = await deletePartAction(
      'PHP-001',
      ADMIN_TOKEN,
      undefined,
      new FormData(),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('Part PHP-001 not found');
    }
  });

  it('returns {ok: false, error: "Network error"} on fetch TypeError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }),
    );
    const { deletePartAction } = await import('../../src/lib/parts-actions');
    const result = await deletePartAction(
      'PHP-001',
      ADMIN_TOKEN,
      undefined,
      new FormData(),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('Network error');
    }
  });
});
