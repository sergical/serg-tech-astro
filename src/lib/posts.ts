import { env } from 'cloudflare:workers';
import { slugify } from './slug';

export type PostStatus = 'draft' | 'published';

export interface Post {
  id: string;
  slug: string;
  title: string;
  description: string;
  body: string;
  status: PostStatus;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface Revision {
  id: string;
  post_id: string;
  title: string;
  body: string;
  source: string;
  created_at: string;
}

export type RevisionSummary = Pick<Revision, 'id' | 'source' | 'created_at' | 'title'>;

function db() {
  return env.DB;
}

export async function listPosts(opts: { status?: PostStatus } = {}): Promise<Post[]> {
  const { status } = opts;
  const orderBy = status === 'published' ? 'published_at DESC' : 'updated_at DESC';
  const query = status
    ? `SELECT * FROM posts WHERE status = ?1 ORDER BY ${orderBy}`
    : `SELECT * FROM posts ORDER BY ${orderBy}`;
  const stmt = status ? db().prepare(query).bind(status) : db().prepare(query);
  const { results } = await stmt.all<Post>();
  return results;
}

export async function getPostBySlug(
  slug: string,
  opts: { status?: PostStatus } = {},
): Promise<Post | null> {
  const { status } = opts;
  const query = status
    ? 'SELECT * FROM posts WHERE slug = ?1 AND status = ?2'
    : 'SELECT * FROM posts WHERE slug = ?1';
  const stmt = status ? db().prepare(query).bind(slug, status) : db().prepare(query).bind(slug);
  const post = await stmt.first<Post>();
  return post ?? null;
}

export async function getPostById(id: string): Promise<Post | null> {
  const post = await db().prepare('SELECT * FROM posts WHERE id = ?1').bind(id).first<Post>();
  return post ?? null;
}

export async function createPost(): Promise<Post> {
  const id = crypto.randomUUID();
  const slug = `untitled-${crypto.randomUUID().slice(0, 6)}`;
  const now = new Date().toISOString();
  const post: Post = {
    id,
    slug,
    title: '',
    description: '',
    body: '',
    status: 'draft',
    created_at: now,
    updated_at: now,
    published_at: null,
  };
  await db()
    .prepare(
      `INSERT INTO posts (id, slug, title, description, body, status, created_at, updated_at, published_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`,
    )
    .bind(
      post.id,
      post.slug,
      post.title,
      post.description,
      post.body,
      post.status,
      post.created_at,
      post.updated_at,
      post.published_at,
    )
    .run();
  return post;
}

export interface UpdatePostPatch {
  title?: string;
  description?: string;
  slug?: string;
  body?: string;
  status?: PostStatus;
}

export async function updatePost(
  id: string,
  patch: UpdatePostPatch,
  { source }: { source: string },
): Promise<Post> {
  const existing = await getPostById(id);
  if (!existing) throw new Error('post not found');

  const next: Post = { ...existing };
  if (patch.title !== undefined) next.title = patch.title;
  if (patch.description !== undefined) next.description = patch.description;
  if (patch.body !== undefined) next.body = patch.body;
  if (patch.slug !== undefined) {
    next.slug = slugify(patch.slug);
  } else if (
    patch.title !== undefined &&
    existing.status === 'draft' &&
    existing.slug.startsWith('untitled-')
  ) {
    // Draft posts still on their placeholder slug track the title until the author sets one explicitly.
    next.slug = slugify(patch.title) || existing.slug;
  }
  if (patch.status !== undefined) {
    if (patch.status !== 'draft' && patch.status !== 'published') {
      throw new Error('invalid status');
    }
    next.status = patch.status;
  }

  const now = new Date().toISOString();
  next.updated_at = now;

  const isFirstPublish = existing.status !== 'published' && next.status === 'published';
  if (isFirstPublish) {
    next.published_at = now;
  }

  try {
    await db()
      .prepare(
        `UPDATE posts SET slug = ?1, title = ?2, description = ?3, body = ?4, status = ?5, updated_at = ?6, published_at = ?7
         WHERE id = ?8`,
      )
      .bind(
        next.slug,
        next.title,
        next.description,
        next.body,
        next.status,
        next.updated_at,
        next.published_at,
        id,
      )
      .run();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('UNIQUE constraint failed')) {
      throw new Error('slug already in use');
    }
    throw err;
  }

  const titleOrBodyChanged =
    (patch.title !== undefined && patch.title !== existing.title) ||
    (patch.body !== undefined && patch.body !== existing.body);
  if (titleOrBodyChanged || isFirstPublish) {
    await db()
      .prepare(
        `INSERT INTO post_revisions (id, post_id, title, body, source, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
      )
      .bind(crypto.randomUUID(), id, next.title, next.body, source, now)
      .run();
  }

  return next;
}

export async function deletePost(id: string): Promise<void> {
  await db().prepare('DELETE FROM posts WHERE id = ?1').bind(id).run();
}

export async function listRevisions(postId: string): Promise<RevisionSummary[]> {
  const { results } = await db()
    .prepare(
      'SELECT id, source, created_at, title FROM post_revisions WHERE post_id = ?1 ORDER BY created_at DESC',
    )
    .bind(postId)
    .all<RevisionSummary>();
  return results;
}

export async function getRevision(id: string): Promise<Revision | null> {
  const revision = await db()
    .prepare('SELECT * FROM post_revisions WHERE id = ?1')
    .bind(id)
    .first<Revision>();
  return revision ?? null;
}
