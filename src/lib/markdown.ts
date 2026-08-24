import { marked } from 'marked';

marked.setOptions({ gfm: true });

// No sanitization: the only author is the site owner, writing through the admin API.
export function renderMarkdown(md: string): string {
  return marked.parse(md, { async: false }) as string;
}
