export interface InsertResult {
  text: string;
  caret: number;
}

// Inserts `insert` at the caret (or over the current selection), with spacing that
// keeps dictated text readable: a blank line before it when it lands at the start of
// a new paragraph (empty document, or preceded by a blank line), otherwise a single
// space so it doesn't run into the previous word.
export function insertAtCursor(
  text: string,
  selectionStart: number,
  selectionEnd: number,
  insert: string,
): InsertResult {
  const before = text.slice(0, selectionStart);
  const after = text.slice(selectionEnd);

  const atParagraphStart = before.length === 0 || /\n\s*\n\s*$/.test(before);
  const needsLeadingSpace = !atParagraphStart && before.length > 0 && !/\s$/.test(before);
  const prefix = atParagraphStart && before.length > 0 ? '\n\n' : needsLeadingSpace ? ' ' : '';

  const combined = before + prefix + insert;
  const caret = combined.length;
  return { text: combined + after, caret };
}
