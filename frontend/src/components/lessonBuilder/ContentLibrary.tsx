import React, { useState, useMemo } from 'react';
import { Search, Image, Video, GalleryHorizontal, FileText, Type, Info, HelpCircle, ListChecks, ArrowRightCircle } from 'lucide-react';
import { BlockTypeMeta } from '../../types/courseBuilder.types';
import clsx from 'clsx';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  HERO_BANNER: Image,
  VIDEO: Video,
  IMAGES: GalleryHorizontal,
  BANNER_IMAGE: Image,
  PDF: FileText,
  RICH_TEXT: Type,
  CALLOUT: Info,
  IMAGE_TEXT: GalleryHorizontal,
  KNOWLEDGE_CHECK: HelpCircle,
  QUIZ: ListChecks,
  NEXT_LESSON: ArrowRightCircle,
};

const DESCRIPTIONS: Record<string, string> = {
  HERO_BANNER: 'Main visual header for the lesson',
  VIDEO: 'Embed video content',
  IMAGES: 'Gallery or single image',
  BANNER_IMAGE: 'Full-width header',
  PDF: 'Downloadable guides',
  RICH_TEXT: 'Formatted text block',
  CALLOUT: 'Important tips or info',
  IMAGE_TEXT: 'Image with title & description',
  KNOWLEDGE_CHECK: 'Quick 3-question check',
  QUIZ: 'Multi-question in-lesson quiz',
  NEXT_LESSON: 'Navigation to next lesson',
};

const CATEGORY_ORDER = ['MEDIA', 'CONTENT', 'ASSESSMENT', 'LESSON_FLOW'] as const;
const CATEGORY_LABELS: Record<string, string> = {
  MEDIA: 'Media',
  CONTENT: 'Content',
  ASSESSMENT: 'Assessment',
  LESSON_FLOW: 'Lesson Flow',
};

interface ContentLibraryProps {
  blockTypes: BlockTypeMeta[];
  onAddBlock: (type: string) => void;
}

export const ContentLibrary: React.FC<ContentLibraryProps> = ({ blockTypes, onAddBlock }) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  const filtered = useMemo(() => {
    return blockTypes.filter((b) => {
      const matchesSearch = b.label.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory === 'ALL' || b.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [blockTypes, search, activeCategory]);

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    items: filtered.filter((b) => b.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="flex h-full flex-col">
      <h2 className="px-4 pt-4 text-sm font-bold text-ink">Content Library</h2>
      <div className="px-4 pt-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-ink-faint" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search components..."
            className="w-full rounded-md border border-surface-border bg-surface py-2 pl-8 pr-2 text-xs text-ink placeholder-ink-faint focus:border-accent focus:bg-surface-card focus:outline-none"
          />
        </div>
        <div className="mt-2.5 flex flex-wrap gap-1">
          {['ALL', ...CATEGORY_ORDER].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={clsx(
                'rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider',
                activeCategory === cat ? 'bg-accent text-white' : 'bg-surface text-ink-muted hover:text-ink',
              )}
            >
              {cat === 'ALL' ? 'All' : CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 flex-1 space-y-4 overflow-y-auto px-4 pb-4">
        {grouped.map((group) => (
          <div key={group.category}>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-faint">
              {CATEGORY_LABELS[group.category]}
            </p>
            <div className="space-y-1.5">
              {group.items.map((item) => {
                const Icon = ICONS[item.type] ?? Type;
                return (
                  <button
                    key={item.type}
                    onClick={() => onAddBlock(item.type)}
                    className="flex w-full items-center gap-2.5 rounded-md border border-surface-border bg-surface-card px-2.5 py-2 text-left transition hover:border-accent hover:bg-accent/5"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-accent/10 text-accent">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-semibold text-ink">{item.label}</span>
                      <span className="block truncate text-[10px] text-ink-muted">{DESCRIPTIONS[item.type]}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
