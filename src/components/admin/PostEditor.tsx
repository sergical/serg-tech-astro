import { useEffect, useRef, useState } from 'react';
import { slugify } from '@/lib/slug';
import {
  deletePost,
  editByInstruction,
  getPost,
  getRevision,
  listRevisions,
  tidy,
  transcribe,
  updatePost,
  type Post,
  type RevisionSummary,
} from './api';
import { insertAtCursor } from './insertAtCursor';
import { useRecorder } from './useRecorder';
import { DiffReview } from './DiffReview';

interface PostEditorProps {
  postId: string;
}

interface PendingEdit {
  before: string;
  after: string;
  scope: 'document' | 'selection';
  selection?: { start: number; end: number };
  instruction: string;
}

interface EditableFields {
  title: string;
  description: string;
  slug: string;
  body: string;
  status?: Post['status'];
}

const AUTOSAVE_DELAY_MS = 1500;

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function readTimeLabel(body: string): string {
  const words = body.trim() ? body.trim().split(/\s+/).length : 0;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${words} words · ${minutes} min read`;
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export default function PostEditor({ postId }: PostEditorProps) {
  const [post, setPost] = useState<Post | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [slug, setSlug] = useState('');
  const [body, setBody] = useState('');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [recording, setRecording] = useState<null | 'dictate' | 'instruct'>(null);
  const [busy, setBusy] = useState<null | 'transcribing' | 'tidying' | 'editing'>(null);
  const [pendingEdit, setPendingEdit] = useState<PendingEdit | null>(null);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [instructionInput, setInstructionInput] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [revisions, setRevisions] = useState<RevisionSummary[] | null>(null);
  const [tidyDictation, setTidyDictation] = useState(() => {
    return localStorage.getItem('admin.tidyDictation') !== 'false';
  });

  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const skipAutosave = useRef(true);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingCaret = useRef<number | null>(null);

  const recorder = useRecorder((message) => setError(message));

  // --- load ---
  useEffect(() => {
    let cancelled = false;
    getPost(postId)
      .then((p) => {
        if (cancelled) return;
        setPost(p);
        setTitle(p.title);
        setDescription(p.description);
        setSlug(p.slug);
        setBody(p.body);
        // Let this initial render settle before the autosave effect starts
        // reacting to state changes, otherwise the load itself looks like an edit.
        setTimeout(() => {
          skipAutosave.current = false;
        }, 0);
      })
      .catch((err) => setError(errorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, [postId]);

  // --- auto-derive slug from title while it still looks untouched ---
  useEffect(() => {
    if (!post || post.status !== 'draft') return;
    if (!slug.startsWith('untitled-')) return;
    setSlug(slugify(title) || slug);
  }, [title, post, slug]);

  // --- persist the tidy-dictation preference ---
  useEffect(() => {
    localStorage.setItem('admin.tidyDictation', String(tidyDictation));
  }, [tidyDictation]);

  // --- auto-grow the body textarea ---
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [body]);

  // --- move the caret after an AI insertion lands in the DOM ---
  useEffect(() => {
    if (pendingCaret.current === null) return;
    const el = bodyRef.current;
    if (el) {
      const pos = pendingCaret.current;
      el.focus();
      el.setSelectionRange(pos, pos);
    }
    pendingCaret.current = null;
  }, [body]);

  async function commitSave(
    source: 'save' | 'voice-edit' | 'publish',
    overrides?: Partial<EditableFields>,
  ) {
    if (autosaveTimer.current) {
      clearTimeout(autosaveTimer.current);
      autosaveTimer.current = null;
    }
    const fields: EditableFields = { title, description, slug, body, ...overrides };
    setSaving(true);
    try {
      const updated = await updatePost(postId, { ...fields, source });
      setPost(updated);
      // Only the slug can come back different (the server derives it from the title);
      // re-applying the other fields would clobber keystrokes typed while the save was in flight.
      if (updated.slug !== fields.slug) setSlug(updated.slug);
      setSavedAt(new Date());
      setDirty(false);
      setError(null);
      setSlugError(null);
      return updated;
    } catch (err) {
      const message = errorMessage(err);
      if (overrides?.slug !== undefined || fields.slug !== post?.slug) {
        setSlugError(message);
      } else {
        setError(message);
      }
      throw err;
    } finally {
      setSaving(false);
    }
  }

  // --- debounced autosave for title/description/slug/body ---
  useEffect(() => {
    if (skipAutosave.current || pendingEdit) return;
    setDirty(true);
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      commitSave('save').catch(() => {});
    }, AUTOSAVE_DELAY_MS);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, slug, body]);

  // --- warn on unload while unsaved ---
  useEffect(() => {
    function handler(event: BeforeUnloadEvent) {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = '';
    }
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  function insertDictation(text: string) {
    const el = bodyRef.current;
    const start = el?.selectionStart ?? body.length;
    const end = el?.selectionEnd ?? body.length;
    const result = insertAtCursor(body, start, end, text);
    pendingCaret.current = result.caret;
    setBody(result.text);
  }

  async function toggleDictate() {
    if (busy) return;
    if (recording === 'dictate') {
      const blob = await recorder.stop();
      setRecording(null);
      if (!blob) return;
      try {
        setBusy('transcribing');
        let text = await transcribe(blob);
        if (tidyDictation) {
          setBusy('tidying');
          text = await tidy(text);
        }
        insertDictation(text);
      } catch (err) {
        setError(errorMessage(err));
      } finally {
        setBusy(null);
      }
    } else if (!recording) {
      setError(null);
      await recorder.start();
      setRecording('dictate');
    }
  }

  async function applyInstruction(instruction: string) {
    if (!instruction.trim()) return;
    const el = bodyRef.current;
    const start = el?.selectionStart ?? 0;
    const end = el?.selectionEnd ?? 0;
    const hasSelection = start !== end;
    setBusy('editing');
    setError(null);
    try {
      const result = await editByInstruction(
        instruction,
        body,
        hasSelection ? { start, end } : undefined,
      );
      const after = hasSelection ? body.slice(0, start) + result.text + body.slice(end) : result.text;
      setPendingEdit({
        before: body,
        after,
        scope: result.scope ?? (hasSelection ? 'selection' : 'document'),
        selection: hasSelection ? { start, end } : undefined,
        instruction,
      });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function toggleInstruct() {
    if (busy) return;
    if (recording === 'instruct') {
      const blob = await recorder.stop();
      setRecording(null);
      if (!blob) return;
      try {
        setBusy('transcribing');
        const text = await transcribe(blob);
        setInstructionInput(text);
        setBusy(null);
        await applyInstruction(text);
      } catch (err) {
        setError(errorMessage(err));
        setBusy(null);
      }
    } else if (!recording) {
      setError(null);
      await recorder.start();
      setRecording('instruct');
    }
  }

  function handleInstructionSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    applyInstruction(instructionInput);
  }

  function acceptPendingEdit() {
    if (!pendingEdit) return;
    setUndoStack((stack) => [...stack, pendingEdit.before]);
    setBody(pendingEdit.after);
    setInstructionInput('');
    setPendingEdit(null);
    commitSave('voice-edit', { body: pendingEdit.after }).catch(() => {});
  }

  function discardPendingEdit() {
    setPendingEdit(null);
  }

  function undoLastEdit() {
    setUndoStack((stack) => {
      if (stack.length === 0) return stack;
      const next = stack.slice(0, -1);
      setBody(stack[stack.length - 1]);
      return next;
    });
  }

  async function togglePublish() {
    if (!post) return;
    const status = post.status === 'published' ? 'draft' : 'published';
    try {
      await commitSave('publish', { status });
    } catch {
      // error already surfaced via commitSave
    }
  }

  async function handleSlugBlur() {
    if (!post || slug === post.slug) return;
    try {
      await commitSave('save', { slug });
    } catch {
      // slugError already set by commitSave
    }
  }

  async function toggleHistory() {
    if (historyOpen) {
      setHistoryOpen(false);
      return;
    }
    try {
      const list = await listRevisions(postId);
      setRevisions(list);
      setHistoryOpen(true);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function loadRevision(revisionId: string, createdAt: string) {
    try {
      const revision = await getRevision(revisionId);
      setPendingEdit({
        before: body,
        after: revision.body,
        scope: 'document',
        instruction: `restore revision from ${new Date(createdAt).toLocaleString()}`,
      });
      setHistoryOpen(false);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function handleDelete() {
    if (!confirm('delete this post?')) return;
    try {
      await deletePost(postId);
      window.location.href = '/admin';
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  // --- keyboard shortcuts ---
  useEffect(() => {
    function handler(event: KeyboardEvent) {
      const mod = event.metaKey || event.ctrlKey;
      if (!mod) return;
      const key = event.key.toLowerCase();
      if (key === 's') {
        event.preventDefault();
        commitSave('save').catch(() => {});
      } else if (event.shiftKey && key === 'd') {
        event.preventDefault();
        toggleDictate();
      } else if (event.shiftKey && key === 'e') {
        event.preventDefault();
        toggleInstruct();
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  function saveIndicator(): string {
    if (saving) return 'saving…';
    if (dirty) return 'unsaved';
    if (savedAt) {
      return `saved ${savedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return '';
  }

  if (!post) {
    return <p className="text-muted-foreground text-sm">{error ?? 'loading…'}</p>;
  }

  return (
    <div className="text-sm">
      <div className="flex items-center gap-3 mb-4">
        <a href="/admin" className="text-muted-foreground hover:text-foreground">
          ← admin
        </a>
        <span className="text-muted-foreground">[{post.status}]</span>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-muted-foreground">{saveIndicator()}</span>
          <a
            href={`/admin/preview/${post.id}`}
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline"
          >
            preview
          </a>
          <button type="button" onClick={togglePublish} className="text-primary hover:underline">
            {post.status === 'published' ? 'unpublish' : 'publish'}
          </button>
        </div>
      </div>

      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="title"
        className="w-full bg-transparent outline-none text-2xl font-semibold mb-2 placeholder:text-muted-foreground"
      />

      <div className="flex flex-col gap-1 mb-4 text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>/blog/</span>
          <input
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            onBlur={handleSlugBlur}
            className="bg-transparent outline-none flex-1"
          />
        </div>
        {slugError && <span className="text-red-500">{slugError}</span>}
        <input
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="one-line description"
          className="w-full bg-transparent outline-none placeholder:text-muted-foreground"
        />
      </div>

      {pendingEdit ? (
        <DiffReview
          instruction={pendingEdit.instruction}
          before={pendingEdit.before}
          after={pendingEdit.after}
          onAccept={acceptPendingEdit}
          onDiscard={discardPendingEdit}
        />
      ) : (
        <textarea
          ref={bodyRef}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="write, or hold the mic and talk."
          rows={1}
          className="w-full resize-none overflow-hidden bg-transparent outline-none text-base leading-relaxed"
          style={{ fontSize: '16px' }}
        />
      )}

      <p className="text-muted-foreground text-xs mt-2">{readTimeLabel(body)}</p>

      {error && (
        <p className="text-red-500 text-sm mt-2">
          {error}{' '}
          <button type="button" onClick={() => setError(null)} className="underline">
            dismiss
          </button>
        </p>
      )}

      {historyOpen && (
        <div className="border border-muted rounded p-3 mt-3">
          <p className="text-muted-foreground text-xs mb-2">history</p>
          <ul className="space-y-1">
            {(revisions ?? []).map((revision) => (
              <li key={revision.id}>
                <button
                  type="button"
                  onClick={() => loadRevision(revision.id, revision.created_at)}
                  className="text-primary hover:underline"
                >
                  {new Date(revision.created_at).toLocaleString()} · {revision.source} ·{' '}
                  {revision.title || 'untitled'}
                </button>
              </li>
            ))}
            {revisions && revisions.length === 0 && <li className="text-muted-foreground">no revisions yet</li>}
          </ul>
        </div>
      )}

      <div className="sticky bottom-0 bg-background/90 backdrop-blur border-t border-muted mt-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={toggleDictate}
          disabled={recording === 'instruct' || (busy !== null && recording !== 'dictate')}
          className="text-primary hover:underline disabled:opacity-50"
        >
          {recording === 'dictate' ? (
            <>
              <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1 align-middle" />
              {formatTimer(recorder.seconds)} stop
            </>
          ) : (
            '● dictate'
          )}
        </button>

        <button
          type="button"
          onClick={toggleInstruct}
          disabled={recording === 'dictate' || (busy !== null && recording !== 'instruct')}
          className="text-primary hover:underline disabled:opacity-50"
        >
          {recording === 'instruct' ? (
            <>
              <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1 align-middle" />
              {formatTimer(recorder.seconds)} stop
            </>
          ) : (
            '✦ edit by voice'
          )}
        </button>

        <form onSubmit={handleInstructionSubmit} className="flex items-center gap-2 flex-1 min-w-[200px]">
          <input
            value={instructionInput}
            onChange={(event) => setInstructionInput(event.target.value)}
            placeholder="or type an instruction…"
            className="flex-1 bg-transparent outline-none border-b border-muted"
          />
          <button type="submit" className="text-primary hover:underline">
            apply
          </button>
        </form>

        {busy && <span className="text-muted-foreground text-xs">{busy}…</span>}

        {undoStack.length > 0 && (
          <button type="button" onClick={undoLastEdit} className="text-muted-foreground hover:underline">
            undo ai
          </button>
        )}

        <label className="flex items-center gap-1 text-muted-foreground">
          <input
            type="checkbox"
            checked={tidyDictation}
            onChange={(event) => setTidyDictation(event.target.checked)}
          />
          tidy dictation
        </label>

        <button type="button" onClick={toggleHistory} className="text-muted-foreground hover:underline">
          history
        </button>
        <button type="button" onClick={handleDelete} className="text-muted-foreground hover:underline">
          delete
        </button>
      </div>
    </div>
  );
}
