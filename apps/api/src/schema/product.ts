import { z } from 'zod';
import { GraphQLError } from 'graphql';
import type { Product, ProductCategory } from '@hvac-portfolio/shared-data/types';
import { addProduct, getAllProducts, getProductBySku } from '../data/store.js';
import { ADMIN_TOKEN_HEADER } from '../middleware/auth.js';
import type { AdminContext } from './builder.js';
import type { createBuilder } from './builder.js';

const PRODUCT_CATEGORIES = ['Furnaces', 'Filters', 'Thermostats', 'Motors', 'Controls', 'Ductwork'] as const;

/**
 * GraphQL-shaped input type. `category` is a plain string at the schema
 * layer (Pothos can't encode string-literal unions the same way TypeScript
 * does); the zod schema below narrows it to a valid ProductCategory before
 * any data layer call.
 */
export interface CreateProductInput {
  sku: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  manufacturer: string;
  imageUrl?: string | null;
}

/**
 * Zod schema for createProduct mutation input. Validated before any data layer call.
 * Mirrors the runtime constraints implied by `CreateProductInput` in
 * `@hvac-portfolio/shared-data/types`.
 */
export const createProductInputSchema = z.object({
  sku: z.string().min(1, 'sku must not be empty'),
  name: z.string().min(1, 'name must not be empty'),
  description: z.string().min(1, 'description must not be empty'),
  price: z.number().positive('price must be positive'),
  stock: z.number().int().nonnegative('stock must be a non-negative integer'),
  category: z.enum(PRODUCT_CATEGORIES),
  manufacturer: z.string().min(1, 'manufacturer must not be empty'),
  imageUrl: z
    .string()
    .url('imageUrl must be a valid URL')
    .nullable()
    .optional(),
});

/**
 * Throws a 403 GraphQLError when admin auth fails. Mirrors requireAdmin()
 * but works on graphql-yoga's Request (web standard) instead of Express's.
 */
function assertAdmin(request: unknown): void {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) {
    throw new GraphQLError('Admin authentication required', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
  const reqLike = request as { headers?: { get?: (name: string) => string | null } } | undefined;
  const headerValue = reqLike?.headers?.get?.(ADMIN_TOKEN_HEADER) ?? null;
  if (headerValue !== expected) {
    throw new GraphQLError('Admin authentication required', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
}

/**
 * Registers the Product object type, queries, and mutation on the given builder.
 */
export function registerProductSchema(
  builder: ReturnType<typeof createBuilder>,
): void {
  // --- Object type ---
  const ProductRef = builder.objectRef<Product>('Product');

  ProductRef.implement({
    description: 'An HVAC part available in the catalog.',
    fields: (t) => ({
      id: t.exposeID('id'),
      sku: t.exposeString('sku'),
      name: t.exposeString('name'),
      description: t.exposeString('description'),
      price: t.exposeFloat('price'),
      stock: t.exposeInt('stock'),
      category: t.exposeString('category'),
      manufacturer: t.exposeString('manufacturer'),
      specs: t.field({
        type: 'JSON',
        nullable: true,
        description: 'Free-form technical specifications.',
        resolve: (parent) => parent.specs ?? null,
      }),
      imageUrl: t.exposeString('imageUrl', {
        nullable: true,
        description:
          'Public CDN URL for a real product photo (typically images.unsplash.com). ' +
          'Null when the product has no photo on file.',
      }),
    }),
  });

  // --- CreateProductInput ---
  const CreateProductInputRef = builder.inputRef<CreateProductInput>('CreateProductInput');

  CreateProductInputRef.implement({
    description: 'Input for creating a new product. Admin-only.',
    fields: (t) => ({
      sku: t.string({ required: true }),
      name: t.string({ required: true }),
      description: t.string({ required: true }),
      price: t.float({ required: true }),
      stock: t.int({ required: true }),
      category: t.string({ required: true }),
      manufacturer: t.string({ required: true }),
      imageUrl: t.string({
        required: false,
        description:
          'Optional public URL for a product photo (typically images.unsplash.com).',
      }),
    }),
  });

  // --- Queries ---
  builder.queryField('products', (t) =>
    t.field({
      type: [ProductRef],
      nullable: false,
      args: {
        category: t.arg.string({ required: false }),
      },
      description: 'Returns all products, optionally filtered by category.',
      resolve: (_root, args) => getAllProducts(args.category ?? null),
    }),
  );

  builder.queryField('product', (t) =>
    t.field({
      type: ProductRef,
      nullable: true,
      args: {
        sku: t.arg.string({ required: true }),
      },
      description: 'Returns one product by SKU, or null if not found.',
      resolve: (_root, args) => getProductBySku(args.sku) ?? null,
    }),
  );

  // --- Mutation ---
  builder.mutationField('createProduct', (t) =>
    t.field({
      type: ProductRef,
      nullable: false,
      args: {
        input: t.arg({
          type: CreateProductInputRef,
          required: true,
        }),
      },
      description: 'Create a new product. Requires admin authentication.',
      authScopes: { admin: true },
      resolve: (_root, args, ctx: AdminContext) => {
        // Verify admin via header check (defence-in-depth on top of Pothos scope).
        assertAdmin(ctx.request);

        // Validate input with zod
        const parsed = createProductInputSchema.safeParse(args.input);
        if (!parsed.success) {
          const message = parsed.error.issues
            .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
            .join('; ');
          throw new GraphQLError(`Validation failed: ${message}`, {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }

        const input = parsed.data;
        const newProduct: Product = {
          id: `p${Math.random().toString(36).slice(2, 10)}`,
          sku: input.sku,
          name: input.name,
          description: input.description,
          price: input.price,
          stock: input.stock,
          category: input.category as ProductCategory,
          manufacturer: input.manufacturer,
          ...(input.imageUrl ? { imageUrl: input.imageUrl } : {}),
        };
        return addProduct(newProduct);
      },
    }),
  );
}