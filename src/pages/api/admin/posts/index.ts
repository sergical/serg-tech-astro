import type { APIRoute } from 'astro';
import { createPost, listPosts } from '../../../../lib/posts';
import { json, errorToStatus } from '../../../../lib/api';

export const GET: APIRoute = async () => {
  try {
    const posts = await listPosts();
    return json(posts);
  } catch (err) {
    console.error('list posts failed', err);
    const { status, message } = errorToStatus(err);
    return json({ error: message }, status);
  }
};

export const POST: APIRoute = async () => {
  try {
    const post = await createPost();
    return json(post, 201);
  } catch (err) {
    console.error('create post failed', err);
    const { status, message } = errorToStatus(err);
    return json({ error: message }, status);
  }
};
