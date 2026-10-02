// ============================================================================
// Cloudflare Worker Entry Point (Workers + Assets Architecture)
// ============================================================================

import { createD1Repositories } from '../core/repositories/d1-repository.ts';
import { createMemoryRepositories } from '../core/repositories/memory-repository.ts';
import { handleUniversalApiRequest } from '../core/router.ts';

interface Env {
  DB?: any;
  ASSETS?: {
    fetch: (request: Request | string) => Promise<Response>;
  };
  ENVIRONMENT?: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
    const url = new URL(request.url);

    // 1. Handle CORS preflight requests
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

    // 2. Handle /api/* backend routes
    if (url.pathname.startsWith('/api/')) {
      const repos = env.DB ? createD1Repositories(env.DB) : createMemoryRepositories();
      return handleUniversalApiRequest(request, repos);
    }

    // 3. Serve static assets and SPA routes via Cloudflare Assets
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not found', { status: 404 });
  }
};
