import type { APIRoute } from 'astro';
import { createPost } from '../../lib/posts';

export const POST: APIRoute = async () => {
  const post = await createPost();
  return new Response(null, {
    status: 303,
    headers: { Location: `/admin/${post.id}` },
  });
};
