import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Server } from 'node:http';
import { createServer } from '../src/server.js';
import { ADMIN_TOKEN_HEADER } from '../src/middleware/auth.js';
import { productCount, resetStore } from '../src/data/store.js';

const ADMIN_TOKEN = 'test-admin-secret';

let server: Server | undefined;
let port = 0;

beforeAll(async () => {
  // Set ADMIN_TOKEN before building any context that might read it.
  process.env.ADMIN_TOKEN = ADMIN_TOKEN;
  process.env.NODE_ENV = 'test';

  const { app } = createServer();
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server!.address();
      if (typeof addr === 'object' && addr) {
        port = addr.port;
      }
      resolve();
    });
  });
});

afterAll(async () => {
  await new Promise<void>((resolve) => server?.close(() => resolve()));
});

/** Sends a GraphQL operation via HTTP to the running server. */
async function graphql(
  body: { query: string; variables?: Record<string, unknown> },
  headers: Record<string, string> = {},
): Promise<{ status: number; body: unknown }> {
  const response = await fetch(`http://localhost:${port}/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  let parsed: unknown = text;
  try {
    parsed = JSON.parse(text);
  } catch {
    // not JSON — leave as text
  }
  return { status: response.status, body: parsed };
}

describe('GET /healthz', () => {
  it('returns 200 OK', async () => {
    const response = await fetch(`http://localhost:${port}/healthz`);
    const text = await response.text();
    expect(response.status).toBe(200);
    expect(text).toBe('OK');
  });
});

describe('GraphQL introspection', () => {
  it('returns the schema', async () => {
    const { status, body } = await graphql({
      query: `{
        __schema {
          queryType { name }
          mutationType { name }
        }
      }`,
    });
    expect(status).toBe(200);
    const parsed = body as { data: { __schema: { queryType: { name: string }; mutationType: { name: string } } } };
    expect(parsed.data.__schema.queryType.name).toBe('Query');
    expect(parsed.data.__schema.mutationType.name).toBe('Mutation');
  });
});

describe('query products', () => {
  it('returns the 25 seeded products', async () => {
    expect(productCount()).toBe(25);
    const { status, body } = await graphql({
      query: '{ products { id sku name price stock category } }',
    });
    expect(status).toBe(200);
    const parsed = body as { data: { products: Array<{ sku: string; name: string }> } };
    expect(parsed.data.products).toHaveLength(25);
    expect(parsed.data.products[0]?.sku).toBe('FURN-001');
  });

  it('filters by category', async () => {
    const { status, body } = await graphql({
      query: '{ products(category: "Filters") { sku category } }',
    });
    expect(status).toBe(200);
    const parsed = body as { data: { products: Array<{ sku: string; category: string }> } };
    expect(parsed.data.products.length).toBeGreaterThan(0);
    for (const product of parsed.data.products) {
      expect(product.category).toBe('Filters');
    }
    expect(parsed.data.products.length).toBe(5);
  });

  it('returns empty list for unknown category', async () => {
    const { status, body } = await graphql({
      query: '{ products(category: "DoesNotExist") { sku } }',
    });
    expect(status).toBe(200);
    const parsed = body as { data: { products: unknown[] } };
    expect(parsed.data.products).toEqual([]);
  });
});

describe('query product', () => {
  it('returns one product by sku', async () => {
    const { body } = await graphql({
      query: '{ product(sku: "FURN-001") { name price stock } }',
    });
    const parsed = body as { data: { product: { name: string; price: number; stock: number } } };
    expect(parsed.data.product.name).toBeTruthy();
    expect(parsed.data.product.price).toBeGreaterThan(0);
    expect(parsed.data.product.stock).toBeGreaterThanOrEqual(0);
  });

  it('returns null for unknown sku', async () => {
    const { status, body } = await graphql({
      query: '{ product(sku: "DOES-NOT-EXIST") { name } }',
    });
    expect(status).toBe(200);
    const parsed = body as { data: { product: unknown } };
    expect(parsed.data.product).toBeNull();
  });
});

describe('mutation createProduct', () => {
  beforeAll(() => {
    // start each suite from a clean store so the count assertion is stable
    resetStore();
  });

  it('returns 403 without admin header', async () => {
    const { body } = await graphql({
      query: `mutation { createProduct(input: { sku: "TEST-1", name: "T", description: "D", price: 1.0, stock: 1, category: "Filters", manufacturer: "M" }) { sku } }`,
    });
    const parsed = body as { errors?: Array<{ message: string; extensions?: { code?: string } }> };
    expect(parsed.errors).toBeDefined();
    expect(parsed.errors?.[0]?.message).toBe('Admin authentication required');
    expect(parsed.errors?.[0]?.extensions?.code).toBe('FORBIDDEN');
  });

  it('returns validation error for empty sku', async () => {
    const { body } = await graphql(
      {
        query: `mutation { createProduct(input: { sku: "", name: "T", description: "D", price: 1.0, stock: 1, category: "Filters", manufacturer: "M" }) { sku } }`,
      },
      { [ADMIN_TOKEN_HEADER]: ADMIN_TOKEN },
    );
    const parsed = body as { errors?: Array<{ message: string }> };
    expect(parsed.errors).toBeDefined();
    expect(parsed.errors?.[0]?.message).toContain('sku');
  });

  it('creates a product with valid input', async () => {
    const before = productCount();
    const { status, body } = await graphql(
      {
        query: `mutation { createProduct(input: { sku: "TEST-NEW-001", name: "Test Product", description: "From test", price: 9.99, stock: 5, category: "Filters", manufacturer: "TestCo" }) { sku name price category } }`,
      },
      { [ADMIN_TOKEN_HEADER]: ADMIN_TOKEN },
    );
    expect(status).toBe(200);
    const parsed = body as { data: { createProduct: { sku: string; name: string; price: number; category: string } } };
    expect(parsed.data.createProduct.sku).toBe('TEST-NEW-001');
    expect(parsed.data.createProduct.name).toBe('Test Product');
    expect(parsed.data.createProduct.price).toBe(9.99);
    expect(parsed.data.createProduct.category).toBe('Filters');
    expect(productCount()).toBe(before + 1);
  });
});