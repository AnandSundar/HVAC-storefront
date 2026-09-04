import cors from 'cors';
import type { RequestHandler } from 'express';

/**
 * CORS configuration for the GraphQL endpoint.
 *
 * - In production, only the storefront origin configured via STOREFRONT_URL is allowed.
 * - In development, wildcard `*` is permitted for local testing.
 *
 * The header `x-admin-token` is always exposed so the storefront can surface
 * admin errors to the user. This is harmless because the actual token value is
 * never sent back — only the response code.
 */
export function buildCors(): RequestHandler {
  const storefrontUrl = process.env.STOREFRONT_URL ?? 'http://localhost:3001';
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    return cors({
      origin: storefrontUrl,
      credentials: true,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'x-admin-token'],
      exposedHeaders: ['x-admin-token'],
    });
  }

  return cors({
    origin: '*',
    credentials: false,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-admin-token'],
    exposedHeaders: ['x-admin-token'],
  });
}