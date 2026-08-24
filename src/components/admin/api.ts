// Typed fetch helpers for the admin editor. Every helper throws Error(json.error)
// on a non-2xx response so callers can surface it via a single catch.

export interface Post {
  id: string;
  slug: string;
  title: string;
  description: string;
  body: string;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface RevisionSummary {
  id: string;
  source: string;
  created_at: string;
  title: string;
}

export interface Revision extends RevisionSummary {
  body: string;
}

export interface UpdatePostPatch {
  title?: string;
  description?: string;
  slug?: string;
  body?: string;
  status?: Post['status'];
  source?: 'save' | 'voice-edit' | 'publish';
}

export interface EditResult {
  text: string;
  scope?: 'document' | 'selection';
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  if (res.status === 204) return undefined as T;
  const json = (await res.json().catch(() => null)) as ({ error?: string } & T) | null;
  if (!res.ok) {
    throw new Error(json?.error || `request failed: ${res.status}`);
  }
  return json as T;
}

export function getPost(id: string): Promise<Post> {
  return request<Post>(`/api/admin/posts/${id}`);
}

export function updatePost(id: string, patch: UpdatePostPatch): Promise<Post> {
  return request<Post>(`/api/admin/posts/${id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(patch),
  });
}

export function deletePost(id: string): Promise<void> {
  return request<void>(`/api/admin/posts/${id}`, { method: 'DELETE' });
}

export function listRevisions(postId: string): Promise<RevisionSummary[]> {
  return request<RevisionSummary[]>(`/api/admin/posts/${postId}/revisions`);
}

export function getRevision(id: string): Promise<Revision> {
  return request<Revision>(`/api/admin/revisions/${id}`);
}

export async function transcribe(blob: Blob): Promise<string> {
  const form = new FormData();
  form.append('audio', blob, 'audio.webm');
  const { text } = await request<{ text: string }>('/api/admin/transcribe', {
    method: 'POST',
    body: form,
  });
  return text;
}

export function tidy(markdown: string): Promise<string> {
  return request<{ text: string }>('/api/admin/edit', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ mode: 'tidy', markdown }),
  }).then((r) => r.text);
}

export function editByInstruction(
  instruction: string,
  markdown: string,
  selection?: { start: number; end: number },
): Promise<EditResult> {
  return request<EditResult>('/api/admin/edit', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ mode: 'edit', instruction, markdown, selection }),
  });
}
