import express from 'express';
import helmet from 'helmet';
import { createYoga } from 'graphql-yoga';
import { buildCors } from './middleware/cors.js';
import { ADMIN_TOKEN_HEADER } from './middleware/auth.js';
import { buildSchema, buildContext, type AdminRequestContext } from './schema/index.js';

const PORT = Number.parseInt(process.env.PORT ?? '4000', 10);
const NODE_ENV = process.env.NODE_ENV ?? 'development';

/**
 * Boots the Express + graphql-yoga server.
 *
 * GraphQL endpoint: POST /graphql
 * Health check:     GET  /healthz
 * Landing page:     GET  /graphql (browsable playground in non-production)
 */
export function createServer() {
  const app = express();

  // Security headers. Disable CSP for the playground in non-production
  // (the inline <script> in the GraphiQL HTML would be blocked otherwise).
  app.use(
    helmet({
      contentSecurityPolicy: NODE_ENV === 'production' ? undefined : false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  // Health check endpoint — Render probes this for liveness.
  app.get('/healthz', (_req, res) => {
    res.status(200).send('OK');
  });

  // Build the Pothos-derived schema once at boot.
  const schema = buildSchema();

  const yoga = createYoga<AdminRequestContext>({
    schema,
    graphqlEndpoint: '/graphql',
    landingPage: NODE_ENV !== 'production',
    graphiql: NODE_ENV !== 'production',
    cors: false, // we wire cors explicitly below so OPTIONS preflight is handled
    context: (initialContext) => {
      const token = initialContext.request.headers.get(ADMIN_TOKEN_HEADER);
      const expected = process.env.ADMIN_TOKEN;
      const isAdmin = Boolean(expected) && token === expected;
      return buildContext(isAdmin, initialContext);
    },
    // Disable graphql-yoga's default error masking so test assertions can
    // match our explicit GraphQLError messages (e.g. "Admin authentication
    // required"). The same messages are safe to expose in dev — production
    // hardening would re-enable masking with an allowlist.
    maskedErrors: false,
  });

  app.use(
    yoga.graphqlEndpoint,
    buildCors(),
    express.json(),
    yoga as unknown as express.RequestHandler,
  );

  return { app, yoga };
}

/**
 * Boot the server only when invoked directly (not when imported by tests).
 * Vitest uses createServer() above for HTTP integration tests.
 */
const isMainModule = import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, '/')}`;
if (isMainModule) {
  const { app } = createServer();
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server ready on http://localhost:${PORT}/graphql (env=${NODE_ENV})`);
  });
}