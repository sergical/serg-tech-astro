import type { APIRoute } from 'astro';
import { getRevision } from '../../../../lib/posts';
import { json } from '../../../../lib/api';

export const GET: APIRoute = async ({ params }) => {
  const revision = await getRevision(params.id!);
  if (!revision) return json({ error: 'not found' }, 404);
  return json(revision);
};
