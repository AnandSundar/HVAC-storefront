import { GraphQLError } from 'graphql';
import SchemaBuilder from '@pothos/core';
import ScopeAuthPlugin from '@pothos/plugin-scope-auth';

/**
 * Pothos schema builder.
 *
 * - ScopeAuthPlugin is included so resolvers can demand admin scope on mutations.
 * - A custom JSON scalar is registered so the `specs` field can serialize
 *   free-form technical specifications without forcing every key to a typed field.
 */
export interface AdminContext {
  isAdmin: boolean;
  /** graphql-yoga Request (Web Fetch API). Typed as `unknown` at the builder level. */
  request: unknown;
}

export type SchemaBuilderType = {
  Context: AdminContext;
  AuthScopes: {
    admin: boolean;
  };
  Scalars: {
    JSON: {
      Input: unknown;
      Output: unknown;
    };
  };
};

/**
 * Custom unauthorized error so unauthenticated mutations report the same
 * "Admin authentication required" + FORBIDDEN shape that resolvers raise on
 * direct header mismatches. This keeps the storefront error UI consistent.
 */
function unauthorizedError(): Error {
  return new GraphQLError('Admin authentication required', {
    extensions: { code: 'FORBIDDEN' },
  });
}

export function createBuilder() {
  const builder = new SchemaBuilder<SchemaBuilderType>({
    plugins: [ScopeAuthPlugin],
    scopeAuth: {
      authScopes: (ctx) => ({
        admin: ctx.isAdmin === true,
      }),
      unauthorizedError: () => unauthorizedError(),
    },
  });

  builder.scalarType('JSON', {
    serialize: (value) => value as unknown,
    parseValue: (value) => value as unknown,
  });

  return builder;
}