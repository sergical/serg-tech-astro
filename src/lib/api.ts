export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export function errorToStatus(err: unknown): { status: number; message: string } {
  const message = err instanceof Error ? err.message : String(err);
  if (message === 'slug already in use') return { status: 409, message };
  if (message === 'invalid status') return { status: 400, message };
  if (message === 'post not found') return { status: 404, message };
  return { status: 500, message: 'internal error' };
}

export async function readJsonBody<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}
