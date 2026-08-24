import { defineMiddleware } from 'astro:middleware';
import { env } from 'cloudflare:workers';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { json } from './lib/api';

declare global {
  namespace App {
    interface Locals {
      user?: { email: string };
    }
  }
}

// Cached across requests within the same isolate: JWKS fetches are expensive and rarely change.
let jwksCache: { team: string; jwks: ReturnType<typeof createRemoteJWKSet> } | null = null;

function getJwks(team: string) {
  if (jwksCache && jwksCache.team === team) return jwksCache.jwks;
  const jwks = createRemoteJWKSet(
    new URL(`https://${team}.cloudflareaccess.com/cdn-cgi/access/certs`),
  );
  jwksCache = { team, jwks };
  return jwks;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, locals } = context;
  const path = new URL(request.url).pathname;
  const isProtected = path.startsWith('/admin') || path.startsWith('/api/admin');
  if (!isProtected) return next();

  if (import.meta.env.DEV) return next();

  const team = env.CF_ACCESS_TEAM_DOMAIN;
  const aud = env.CF_ACCESS_AUD;
  if (!team || !aud) {
    return json({ error: 'admin is not configured' }, 503);
  }

  const token =
    request.headers.get('Cf-Access-Jwt-Assertion') ??
    context.cookies.get('CF_Authorization')?.value;
  if (!token) {
    return json({ error: 'unauthorized' }, 401);
  }

  try {
    const jwks = getJwks(team);
    const { payload } = await jwtVerify(token, jwks, {
      issuer: `https://${team}.cloudflareaccess.com`,
      audience: aud,
    });
    locals.user = { email: String(payload.email ?? '') };
  } catch (err) {
    console.error('access token verification failed', err);
    return json({ error: 'unauthorized' }, 401);
  }

  return next();
});
