import React from 'react';

/**
 * Lightweight bold markup for plain-text content fields (Rich Text, Callout,
 * Image+Text) — a content creator wraps a phrase as `\b like this \b` and it
 * renders bold. Deliberately not full markdown: these fields are plain
 * strings, not HTML, so this only ever produces a flat list of text/<strong>
 * nodes — nothing here is ever parsed as markup that could inject HTML.
 */
export function renderFormattedText(text: string): React.ReactNode {
  if (!text) return null;

  const pattern = /\\b\s*(.+?)\s*\\b/g;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    nodes.push(
      <strong key={key++} className="font-bold text-ink">
        {match[1]}
      </strong>,
    );
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}
