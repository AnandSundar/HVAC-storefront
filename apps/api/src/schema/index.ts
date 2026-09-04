import type { YogaInitialContext } from 'graphql-yoga';
import { createBuilder } from './builder.js';
import { registerProductSchema } from './product.js';
import type { AdminContext } from './builder.js';

/**
 * The full graphql-yoga context shape — passed to resolvers via info.context.
 */
export type AdminRequestContext = AdminContext & YogaInitialContext;

/**
 * Builds the full GraphQL schema.
 *
 * Query and Mutation root types are explicitly registered via queryType()
 * and mutationType() — without these, Pothos's auto-created QueryRef /
 * MutationRef never get their `kind` set to 'Query' / 'Mutation' and never
 * get registered with the config store, causing a "Missing implementations"
 * error at toSchema() time.
 */
export function buildSchema() {
  const builder = createBuilder();

  // Register root types explicitly so they show up in the schema.
  builder.queryType({});
  builder.mutationType({});

  registerProductSchema(builder);

  return builder.toSchema();
}

/**
 * Helper that materializes a request-scoped context from an isAdmin flag.
 */
export function buildContext(isAdmin: boolean, yogaContext: YogaInitialContext): AdminContext {
  return { isAdmin, request: yogaContext.request };
}