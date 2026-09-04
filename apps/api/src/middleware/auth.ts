import type { Request } from 'express';
import { GraphQLError } from 'graphql';

/**
 * Header name used by the storefront to present admin credentials.
 * The value is compared against `process.env.ADMIN_TOKEN`.
 */
export const ADMIN_TOKEN_HEADER = 'x-admin-token';

/**
 * Fail-closed mock admin auth check.
 *
 * Returns true ONLY if:
 *   1. ADMIN_TOKEN env var is set (non-empty)
 *   2. The request header matches ADMIN_TOKEN exactly
 *
 * If ADMIN_TOKEN is unset, every mutation is rejected — even if the header
 *     matches "something" or is empty. This is deliberate per security review:
 *     we never want a deployment that forgot to set the env var to silently
 *     accept mutations.
 *
 * @throws GraphQLError with code FORBIDDEN when admin auth fails.
 */
export function requireAdmin(req: Request): void {
  const expected = process.env.ADMIN_TOKEN;

  if (!expected) {
    throw new GraphQLError('Admin authentication required', {
      extensions: { code: 'FORBIDDEN' },
    });
  }

  const headerValue = req.header(ADMIN_TOKEN_HEADER);
  if (headerValue !== expected) {
    throw new GraphQLError('Admin authentication required', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
}