import type { APIRoute } from 'astro';
import { listRevisions } from '../../../../../lib/posts';
import { json } from '../../../../../lib/api';

export const GET: APIRoute = async ({ params }) => {
  const revisions = await listRevisions(params.id!);
  return json(revisions);
};
