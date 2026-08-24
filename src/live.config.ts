import { defineLiveCollection } from 'astro:content';
import { z } from 'astro/zod';
import type { LiveLoader } from 'astro/loaders';
import { getPostById, getPostBySlug, listPosts, type Post, type PostStatus } from './lib/posts';
import { renderMarkdown } from './lib/markdown';

const postDataSchema = z.object({
  title: z.string(),
  description: z.string(),
  status: z.enum(['draft', 'published']),
  publishedAt: z.string().nullable(),
  updatedAt: z.string(),
});

type PostData = z.infer<typeof postDataSchema>;

type EntryFilter = { slug: string; status?: PostStatus } | { id: string };
type CollectionFilter = { status?: PostStatus };

function toData(post: Post): PostData {
  return {
    title: post.title,
    description: post.description,
    status: post.status,
    publishedAt: post.published_at,
    updatedAt: post.updated_at,
  };
}

const postsLoader: LiveLoader<PostData, EntryFilter, CollectionFilter> = {
  name: 'd1-posts',
  async loadEntry({ filter }) {
    const post =
      'id' in filter ? await getPostById(filter.id) : await getPostBySlug(filter.slug, { status: filter.status });
    if (!post) return undefined;
    // The entry id mirrors the lookup key used: slug for public reads, id for admin reads by id.
    const entryId = 'id' in filter ? post.id : post.slug;
    return {
      id: entryId,
      data: toData(post),
      rendered: { html: renderMarkdown(post.body) },
      cacheHint: { tags: ['posts', `post:${post.id}`] },
    };
  },
  async loadCollection({ filter }) {
    const posts = await listPosts({ status: filter?.status ?? 'published' });
    return {
      entries: posts.map((post) => ({
        id: post.slug,
        data: toData(post),
        rendered: { html: renderMarkdown(post.body) },
        cacheHint: { tags: ['posts', `post:${post.id}`] },
      })),
      cacheHint: { tags: ['posts'] },
    };
  },
};

export const collections = {
  posts: defineLiveCollection({
    loader: postsLoader,
    schema: postDataSchema,
  }),
};
