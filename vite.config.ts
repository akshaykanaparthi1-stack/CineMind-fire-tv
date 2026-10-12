import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import type { Plugin, ViteDevServer, PreviewServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';

function tmdbBackendProxyPlugin(apiKey?: string, readToken?: string): Plugin {
  const handler = async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (!req.url || !req.url.startsWith('/api/tmdb')) {
      return next();
    }

    const subpath = req.url.replace(/^\/api\/tmdb/, '');

    // Status endpoint
    if (subpath === '/status' || subpath === '' || subpath === '/') {
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        mode: (apiKey || readToken) ? 'tmdb' : 'sample',
        hasApiKey: !!(apiKey || readToken),
        attribution: 'This product uses the TMDB API but is not endorsed or certified by TMDB.',
      }));
      return;
    }

    // Check if credentials are present
    const token = readToken || apiKey;
    if (!token) {
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(200);
      res.end(JSON.stringify({
        success: false,
        fallback: true,
        mode: 'sample',
        error: 'NO_API_KEY',
        message: 'TMDB API key not configured in environment. Using bundled local catalog.',
      }));
      return;
    }

    try {
      // Build target TMDB URL
      const isBearer = Boolean(readToken || token.startsWith('ey'));
      const targetUrl = new URL(`https://api.themoviedb.org/3${subpath}`);

      const headers: Record<string, string> = {
        'Accept': 'application/json',
      };

      if (isBearer) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        targetUrl.searchParams.set('api_key', token);
      }

      const tmdbRes = await fetch(targetUrl.toString(), {
        headers,
        method: req.method || 'GET',
      });

      // Handle Rate Limit (HTTP 429)
      if (tmdbRes.status === 429) {
        const retryAfter = tmdbRes.headers.get('retry-after') || '10';
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Retry-After', retryAfter);
        res.writeHead(429);
        res.end(JSON.stringify({
          success: false,
          fallback: true,
          rateLimited: true,
          status: 429,
          retryAfter: parseInt(retryAfter, 10),
          message: 'TMDB API rate limit exceeded (HTTP 429). Using bundled catalog as fallback.',
        }));
        return;
      }

      const body = await tmdbRes.text();
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(tmdbRes.status);
      res.end(body);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Unknown network error';
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(200);
      res.end(JSON.stringify({
        success: false,
        fallback: true,
        error: 'NETWORK_ERROR',
        message: `TMDB connection failed: ${errMsg}. Using bundled sample catalog.`,
      }));
    }
  };

  return {
    name: 'tmdb-backend-proxy',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server: PreviewServer) {
      server.middlewares.use(handler);
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiKey = env.TMDB_API_KEY || process.env.TMDB_API_KEY;
  const readToken = env.TMDB_READ_ACCESS_TOKEN || process.env.TMDB_READ_ACCESS_TOKEN;

  return {
    plugins: [
      react(),
      tmdbBackendProxyPlugin(apiKey, readToken),
    ],
  };
});
