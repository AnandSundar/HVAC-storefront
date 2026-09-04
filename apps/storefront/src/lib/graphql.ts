import { GraphQLClient, gql } from 'graphql-request';
import type { Product } from '@hvac-portfolio/shared-data/types';
import { fallbackProducts, findFallbackProduct } from '../data/fallback-products';

const DEFAULT_API_URL = 'http://localhost:4000';

/**
 * Resolves the API URL at call time (not module-eval time) so a server-side
 * render still picks up the env var if it's set per-request. Falls back to
 * localhost:4000 for local dev when the API runs alongside the storefront.
 */
function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL;
}

/**
 * GraphQL fetcher for products. Reads the live API URL from
 * `NEXT_PUBLIC_API_URL` and falls back to localhost:4000 for local dev.
 *
 * All public methods throw `GraphQLFetchError` on transport failure so the
 * caller can decide whether to render fallback data or surface an error.
 */
export class GraphQLFetchError extends Error {
  override readonly name = 'GraphQLFetchError';
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
  }
}

const PRODUCTS_QUERY = gql`
  query Products($category: String) {
    products(category: $category) {
      id
      sku
      name
      description
      price
      stock
      category
      manufacturer
      specs
      imageUrl
    }
  }
`;

const PRODUCT_BY_SKU_QUERY = gql`
  query ProductBySku($sku: String!) {
    product(sku: $sku) {
      id
      sku
      name
      description
      price
      stock
      category
      manufacturer
      specs
      imageUrl
    }
  }
`;

interface ProductsQueryResult {
  readonly products: readonly Product[];
}

interface ProductBySkuQueryResult {
  readonly product: Product | null;
}

/**
 * Creates a GraphQLClient for the configured API URL.
 */
function makeClient(): GraphQLClient {
  return new GraphQLClient(`${getApiUrl()}/graphql`, {
    fetch,
  });
}

/**
 * Fetches the full product catalog (or filtered by category) from the live
 * Node GraphQL API. Throws on transport failure.
 */
export async function fetchProducts(category?: string): Promise<readonly Product[]> {
  const client = makeClient();
  try {
    const data = await client.request<ProductsQueryResult>(PRODUCTS_QUERY, {
      category: category ?? null,
    });
    return data.products;
  } catch (err) {
    throw new GraphQLFetchError(
      `Failed to fetch products${category ? ` (category=${category})` : ''}`,
      err,
    );
  }
}

/**
 * Fetches a single product by SKU. Returns `null` if the API responds
 * successfully but the product does not exist. Throws on transport failure.
 */
export async function fetchProduct(sku: string): Promise<Product | null> {
  const client = makeClient();
  try {
    const data = await client.request<ProductBySkuQueryResult>(PRODUCT_BY_SKU_QUERY, {
      sku,
    });
    return data.product;
  } catch (err) {
    throw new GraphQLFetchError(`Failed to fetch product (sku=${sku})`, err);
  }
}

/**
 * Fetches all products, falling back to the static catalog on transport error.
 * Returns both the resolved list and a flag indicating whether the live API
 * was used so the UI can render a "showing cached data" banner when needed.
 */
export interface FetchProductsResult {
  readonly products: readonly Product[];
  readonly usedFallback: boolean;
}

export async function fetchProductsWithFallback(
  category?: string,
): Promise<FetchProductsResult> {
  try {
    const products = await fetchProducts(category);
    return { products, usedFallback: false };
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('[storefront] Falling back to static products:', err);
    }
    const products = category
      ? fallbackProducts.filter((p) => p.category === category)
      : fallbackProducts;
    return { products, usedFallback: true };
  }
}

/**
 * Fetches a single product by SKU. If the API is unreachable or returns null,
 * the fallback static catalog is consulted as a last resort.
 */
export interface FetchProductResult {
  readonly product: Product | null;
  readonly usedFallback: boolean;
  readonly notFound: boolean;
}

export async function fetchProductWithFallback(
  sku: string,
): Promise<FetchProductResult> {
  try {
    const product = await fetchProduct(sku);
    if (product) {
      return { product, usedFallback: false, notFound: false };
    }
    // API responded but returned null — consult the fallback catalog.
    const fallback = findFallbackProduct(sku);
    if (fallback) {
      return { product: fallback, usedFallback: true, notFound: false };
    }
    return { product: null, usedFallback: false, notFound: true };
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn(`[storefront] Falling back for sku=${sku}:`, err);
    }
    const fallback = findFallbackProduct(sku);
    if (fallback) {
      return { product: fallback, usedFallback: true, notFound: false };
    }
    return { product: null, usedFallback: true, notFound: true };
  }
}