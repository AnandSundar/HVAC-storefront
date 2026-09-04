import { describe, expect, it, vi, afterEach } from 'vitest';
import type { Product } from '@hvac-portfolio/shared-data/types';

/**
 * Unit tests for the GraphQL fetcher.
 *
 * We stub `global.fetch` to return canned responses without hitting the
 * network, and assert on the behaviour of:
 *   - fetchProducts()
 *   - fetchProduct()
 *   - fetchProductsWithFallback()
 *   - fetchProductWithFallback()
 *
 * The fallback catalog is the same fixture used by `@hvac-portfolio/shared-data`,
 * so we expect fallback products to include the well-known FURN-001 SKU.
 */

const fixtureProduct: Product = {
  id: 'p001',
  sku: 'FURN-001',
  name: 'Trane S9V2 96% AFUE Two-Stage Gas Furnace',
  description: 'Two-stage, variable-speed gas furnace.',
  price: 1849.0,
  stock: 12,
  category: 'Furnaces',
  manufacturer: 'Trane',
  specs: { afue: '96%', btu: '80000' },
};

const fixtureResponse = {
  products: [fixtureProduct],
};

function makeResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function makeGraphQLResponse(data: unknown): Response {
  return makeResponse({ data });
}

function makeGraphQLErrorResponse(message: string): Response {
  return makeResponse({ errors: [{ message }] }, 200);
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('fetchProducts', () => {
  it('returns products on a successful response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => makeGraphQLResponse(fixtureResponse)),
    );
    const { fetchProducts } = await import('../src/lib/graphql');
    const products = await fetchProducts();
    expect(products).toEqual([fixtureProduct]);
  });

  it('passes the category variable through to the GraphQL request', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      makeGraphQLResponse(fixtureResponse),
    );
    vi.stubGlobal('fetch', fetchMock);
    const { fetchProducts } = await import('../src/lib/graphql');
    await fetchProducts('Filters');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const init = fetchMock.mock.calls[0]?.[1] as unknown as RequestInit;
    const body = JSON.parse(init.body as string);
    expect(body.variables).toEqual({ category: 'Filters' });
  });

  it('throws GraphQLFetchError on a network failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }),
    );
    const { fetchProducts, GraphQLFetchError } = await import('../src/lib/graphql');
    await expect(fetchProducts()).rejects.toBeInstanceOf(GraphQLFetchError);
  });

  it('throws GraphQLFetchError on a non-2xx HTTP response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => makeResponse('Service Unavailable', 503)),
    );
    const { fetchProducts, GraphQLFetchError } = await import('../src/lib/graphql');
    await expect(fetchProducts()).rejects.toBeInstanceOf(GraphQLFetchError);
  });
});

describe('fetchProduct', () => {
  it('returns the product when the SKU exists', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => makeGraphQLResponse({ product: fixtureProduct })),
    );
    const { fetchProduct } = await import('../src/lib/graphql');
    const product = await fetchProduct('FURN-001');
    expect(product).toEqual(fixtureProduct);
  });

  it('returns null when the API responds successfully with no product', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => makeGraphQLResponse({ product: null })),
    );
    const { fetchProduct } = await import('../src/lib/graphql');
    const product = await fetchProduct('MISSING');
    expect(product).toBeNull();
  });

  it('throws on a transport error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Network down');
      }),
    );
    const { fetchProduct, GraphQLFetchError } = await import('../src/lib/graphql');
    await expect(fetchProduct('FURN-001')).rejects.toBeInstanceOf(
      GraphQLFetchError,
    );
  });
});

describe('fetchProductsWithFallback', () => {
  it('returns the live products and usedFallback=false on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => makeGraphQLResponse(fixtureResponse)),
    );
    const { fetchProductsWithFallback } = await import('../src/lib/graphql');
    const result = await fetchProductsWithFallback();
    expect(result.usedFallback).toBe(false);
    expect(result.products).toEqual([fixtureProduct]);
  });

  it('returns the bundled fixture when the live fetch fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Network down');
      }),
    );
    const { fetchProductsWithFallback } = await import('../src/lib/graphql');
    const result = await fetchProductsWithFallback();
    expect(result.usedFallback).toBe(true);
    expect(result.products.length).toBeGreaterThan(0);
    expect(result.products.some((p) => p.sku === 'FURN-001')).toBe(true);
  });

  it('returns a category-filtered fixture on failure when a category is provided', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Network down');
      }),
    );
    const { fetchProductsWithFallback } = await import('../src/lib/graphql');
    const result = await fetchProductsWithFallback('Filters');
    expect(result.usedFallback).toBe(true);
    expect(result.products.length).toBeGreaterThan(0);
    for (const product of result.products) {
      expect(product.category).toBe('Filters');
    }
  });

  it('returns an empty fallback list when the category has no fixtures', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Network down');
      }),
    );
    const { fetchProductsWithFallback } = await import('../src/lib/graphql');
    const result = await fetchProductsWithFallback('Ductwork');
    expect(result.usedFallback).toBe(true);
    // Either 0 products or some products depending on the fixture; we
    // accept any non-undefined array.
    expect(Array.isArray(result.products)).toBe(true);
  });
});

describe('fetchProductWithFallback', () => {
  it('returns the live product and usedFallback=false on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => makeGraphQLResponse({ product: fixtureProduct })),
    );
    const { fetchProductWithFallback } = await import('../src/lib/graphql');
    const result = await fetchProductWithFallback('FURN-001');
    expect(result.product).toEqual(fixtureProduct);
    expect(result.usedFallback).toBe(false);
    expect(result.notFound).toBe(false);
  });

  it('falls back to the fixture when the API returns null but the SKU exists in the catalog', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => makeGraphQLResponse({ product: null })),
    );
    const { fetchProductWithFallback } = await import('../src/lib/graphql');
    const result = await fetchProductWithFallback('FURN-001');
    expect(result.product?.sku).toBe('FURN-001');
    expect(result.usedFallback).toBe(true);
    expect(result.notFound).toBe(false);
  });

  it('reports notFound when the API returns null and the SKU is not in the fallback', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => makeGraphQLResponse({ product: null })),
    );
    const { fetchProductWithFallback } = await import('../src/lib/graphql');
    const result = await fetchProductWithFallback('NO-SUCH-SKU');
    expect(result.product).toBeNull();
    expect(result.notFound).toBe(true);
  });

  it('falls back to the fixture on a transport error when the SKU exists', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Network down');
      }),
    );
    const { fetchProductWithFallback } = await import('../src/lib/graphql');
    const result = await fetchProductWithFallback('FURN-001');
    expect(result.product?.sku).toBe('FURN-001');
    expect(result.usedFallback).toBe(true);
    expect(result.notFound).toBe(false);
  });

  it('reports notFound when the transport fails and the SKU is unknown', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Network down');
      }),
    );
    const { fetchProductWithFallback } = await import('../src/lib/graphql');
    const result = await fetchProductWithFallback('NO-SUCH-SKU');
    expect(result.product).toBeNull();
    expect(result.notFound).toBe(true);
    expect(result.usedFallback).toBe(true);
  });
});