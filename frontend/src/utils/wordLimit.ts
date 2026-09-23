/** Counts words the same way enforceWordLimit finds word boundaries — any run of non-whitespace characters. */
export function countWords(text: string): number {
  if (!text.trim()) return 0;
  return text.match(/\S+/g)?.length ?? 0;
}

/**
 * Caps text at maxWords by cutting right after the Nth word — using the
 * ORIGINAL string's indices rather than re-joining words with `' '`, so
 * existing line breaks/spacing before the cut point survive untouched
 * (content creators rely on blank lines and per-line bullets rendering
 * correctly via whitespace-pre-line).
 */
export function enforceWordLimit(text: string, maxWords: number): string {
  const matches = [...text.matchAll(/\S+/g)];
  if (matches.length <= maxWords) return text;
  const nthWord = matches[maxWords - 1];
  const cutIndex = nthWord.index! + nthWord[0].length;
  return text.slice(0, cutIndex);
}
