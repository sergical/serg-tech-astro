import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { json } from '../../../lib/api';

const MAX_BYTES = 25 * 1024 * 1024;

// String.fromCharCode(...bytes) would overflow the call stack for large files, so chunk it.
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const audio = form.get('audio');
  if (!(audio instanceof File)) {
    return json({ error: 'missing audio field' }, 400);
  }
  if (audio.size > MAX_BYTES) {
    return json({ error: 'file too large' }, 413);
  }

  const buffer = await audio.arrayBuffer();
  const base64 = arrayBufferToBase64(buffer);

  const result = await env.AI.run('@cf/openai/whisper-large-v3-turbo', { audio: base64 });
  return json({ text: result.text });
};
