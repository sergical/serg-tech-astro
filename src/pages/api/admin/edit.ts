import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import Anthropic from '@anthropic-ai/sdk';
import { json, readJsonBody } from '../../../lib/api';

interface EditRequestBody {
  mode: 'edit' | 'tidy';
  instruction?: string;
  markdown: string;
  selection?: { start: number; end: number };
}

const TIDY_SYSTEM = `The input is a raw speech transcript from the author. Turn it into clean written prose in the author's own words: fix punctuation, casing, and paragraph breaks; remove filler words and false starts. Do not add, reorder, or summarize content. Keep it as markdown. Return only the text, with no preamble, no code fence, no commentary.`;

const EDIT_SYSTEM = `You are editing the author's markdown blog post. Apply the instruction faithfully and minimally; preserve their voice and formatting. Return only the complete revised markdown (or, when a selection is given, only the replacement for the selected range), with no preamble, no code fence, no commentary.`;

function stripFence(text: string): string {
  const match = text.trim().match(/^```[a-z]*\n([\s\S]*?)\n```$/);
  return match ? match[1] : text;
}

export const POST: APIRoute = async ({ request }) => {
  const body = await readJsonBody<EditRequestBody>(request);
  if (!body || !body.markdown || (body.mode !== 'edit' && body.mode !== 'tidy')) {
    return json({ error: 'invalid request' }, 400);
  }

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  const system = body.mode === 'tidy' ? TIDY_SYSTEM : EDIT_SYSTEM;

  let userMessage: string;
  let scope: 'document' | 'selection' = 'document';
  if (body.mode === 'tidy') {
    userMessage = body.markdown;
  } else if (body.selection) {
    const { start, end } = body.selection;
    const selected = body.markdown.slice(start, end);
    const marked =
      body.markdown.slice(0, start) + '<<<SELECTION>>>' + selected + '<<<END>>>' + body.markdown.slice(end);
    scope = 'selection';
    userMessage = `Instruction: ${body.instruction ?? ''}\n\nThe full post is below for context, with the selection to edit marked between <<<SELECTION>>> and <<<END>>>. Only return the replacement text for the selection, not the full post.\n\n${marked}`;
  } else {
    userMessage = `Instruction: ${body.instruction ?? ''}\n\nMarkdown:\n\n${body.markdown}`;
  }

  const stream = client.messages.stream({
    model: 'claude-opus-5',
    max_tokens: 16000,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'medium' },
    system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: userMessage }],
  });

  const message = await stream.finalMessage();

  if (message.stop_reason === 'refusal') {
    return json({ error: 'refused' }, 422);
  }

  const text = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('');

  if (body.mode === 'tidy') {
    return json({ text: stripFence(text) });
  }
  return json({ text: stripFence(text), scope });
};
