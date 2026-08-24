import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { json, readJsonBody } from '../../../lib/api';

interface EditRequestBody {
  mode: 'edit' | 'tidy';
  instruction?: string;
  markdown: string;
  selection?: { start: number; end: number };
}

const MODEL = '@cf/moonshotai/kimi-k2.6';

const TIDY_SYSTEM = `The input is a raw speech transcript from the author. Turn it into clean written prose in the author's own words: fix punctuation, casing, and paragraph breaks; remove filler words and false starts. Do not add, reorder, or summarize content. Keep it as markdown. Return only the text, with no preamble, no code fence, no commentary.`;

const EDIT_SYSTEM = `You are editing the author's markdown blog post. Apply the instruction faithfully and minimally; preserve their voice and formatting. Return only the complete revised markdown (or, when a selection is given, only the replacement for the selected range), with no preamble, no code fence, no commentary.`;

function stripFence(text: string): string {
  const match = text.trim().match(/^```[a-z]*\n([\s\S]*?)\n```$/);
  return match ? match[1] : text;
}

interface ModelOutput {
  choices?: Array<{ message?: { content?: string | null } }>;
}

function outputText(result: ModelOutput): string {
  return result.choices?.[0]?.message?.content ?? '';
}

export const POST: APIRoute = async ({ request }) => {
  const body = await readJsonBody<EditRequestBody>(request);
  if (!body || !body.markdown || (body.mode !== 'edit' && body.mode !== 'tidy')) {
    return json({ error: 'invalid request' }, 400);
  }

  let input: string;
  let scope: 'document' | 'selection' = 'document';
  if (body.mode === 'tidy') {
    input = body.markdown;
  } else if (body.selection) {
    const { start, end } = body.selection;
    const selected = body.markdown.slice(start, end);
    const marked =
      body.markdown.slice(0, start) + '<<<SELECTION>>>' + selected + '<<<END>>>' + body.markdown.slice(end);
    scope = 'selection';
    input = `Instruction: ${body.instruction ?? ''}\n\nThe full post is below for context, with the selection to edit marked between <<<SELECTION>>> and <<<END>>>. Only return the replacement text for the selection, not the full post.\n\n${marked}`;
  } else {
    input = `Instruction: ${body.instruction ?? ''}\n\nMarkdown:\n\n${body.markdown}`;
  }

  const result = (await env.AI.run(MODEL, {
    messages: [
      { role: 'system', content: body.mode === 'tidy' ? TIDY_SYSTEM : EDIT_SYSTEM },
      { role: 'user', content: input },
    ],
    max_tokens: 8000,
  })) as ModelOutput;

  const text = stripFence(outputText(result));
  if (!text) return json({ error: 'empty response from model' }, 502);

  if (body.mode === 'tidy') {
    return json({ text });
  }
  return json({ text, scope });
};
