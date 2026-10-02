// ============================================================================
// Cloudflare Pages Functions Handler
// Catches all /api/* routes on Cloudflare Pages and executes via Cloudflare D1
// ============================================================================

import { createD1Repositories } from '../../core/repositories/d1-repository.ts';
import { handleUniversalApiRequest } from '../../core/router.ts';

interface Env {
  DB: any; // Cloudflare D1 binding
}

export const onRequest = async (context: {
  request: Request;
  env: Env;
  params: any;
  waitUntil: (promise: Promise<any>) => void;
  next: () => Promise<Response>;
  data: Record<string, any>;
}): Promise<Response> => {
  const { request, env } = context;

  // Handle CORS preflight if requested externally
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  if (!env.DB) {
    return new Response(
      JSON.stringify({
        error: 'Cloudflare D1 database binding "DB" is not bound. Please configure d1_databases binding in wrangler.jsonc or the Cloudflare dashboard.'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  const repos = createD1Repositories(env.DB);
  return await handleUniversalApiRequest(request, repos);
};
