import type { APIRoute } from 'astro';
import { deletePost, getPostById, updatePost, type PostStatus } from '../../../../lib/posts';
import { json, errorToStatus, readJsonBody } from '../../../../lib/api';

export const GET: APIRoute = async ({ params }) => {
  const post = await getPostById(params.id!);
  if (!post) return json({ error: 'not found' }, 404);
  return json(post);
};

interface PatchBody {
  title?: string;
  description?: string;
  slug?: string;
  body?: string;
  status?: PostStatus;
  source?: string;
}

export const PATCH: APIRoute = async ({ params, request }) => {
  const body = await readJsonBody<PatchBody>(request);
  if (!body) return json({ error: 'invalid json' }, 400);

  const { source, ...patch } = body;
  try {
    const post = await updatePost(params.id!, patch, { source: source ?? 'save' });
    return json(post);
  } catch (err) {
    console.error('update post failed', err);
    const { status, message } = errorToStatus(err);
    return json({ error: message }, status);
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  await deletePost(params.id!);
  return new Response(null, { status: 204 });
};
