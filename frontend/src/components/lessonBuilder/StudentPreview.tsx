import React from 'react';
import { Play, FileText, HelpCircle, ArrowRight, Image as ImageIcon } from 'lucide-react';
import { LessonBlock } from '../../types/courseBuilder.types';

function PreviewImage({ url, className }: { url?: string; className: string }) {
  if (!url) {
    return (
      <div className={`flex items-center justify-center bg-surface-border text-ink-faint ${className}`}>
        <ImageIcon className="h-4 w-4" />
      </div>
    );
  }
  return <img src={url} alt="" className={`object-cover ${className}`} />;
}

function renderBlock(block: LessonBlock): React.ReactNode {
  const c = block.content as Record<string, unknown>;

  switch (block.type) {
    case 'HERO_BANNER': {
      const bannerImage = (c.bannerImage as { url?: string }) ?? {};
      return (
        <div className="overflow-hidden rounded-lg bg-charcoal">
          <PreviewImage url={bannerImage.url} className="h-24 w-full rounded-none" />
          <div className="bg-white p-2.5">
            <p className="text-[9px] font-bold uppercase tracking-wider text-accent">{String(c.moduleTitle ?? 'Module')}</p>
            <p className="text-xs font-bold text-ink">{String(c.lessonTitle ?? 'Lesson title')}</p>
          </div>
        </div>
      );
    }
    case 'VIDEO': {
      const videoUrl = c.videoUrl ? String(c.videoUrl) : '';
      return videoUrl ? (
        <video src={videoUrl} controls className="aspect-video w-full rounded-lg bg-charcoal" />
      ) : (
        <div className="flex aspect-video items-center justify-center rounded-lg bg-charcoal text-white/60">
          <Play className="h-6 w-6" />
        </div>
      );
    }
    case 'IMAGES': {
      const images = (c.images as { url: string }[]) ?? [];
      return (
        <div className="grid grid-cols-2 gap-1.5">
          {(images.length ? images : [{ url: '' }]).slice(0, 4).map((img, i) => (
            <PreviewImage key={i} url={img.url} className="aspect-square rounded" />
          ))}
        </div>
      );
    }
    case 'BANNER_IMAGE':
      return <PreviewImage url={c.imageUrl ? String(c.imageUrl) : undefined} className="h-16 w-full rounded-lg" />;
    case 'PDF':
      return (
        <div className="flex items-center gap-2 rounded-lg border border-surface-border bg-surface p-2.5">
          <FileText className="h-4 w-4 text-accent" />
          <span className="truncate text-[11px] font-medium text-ink">{String(c.fileName ?? 'document.pdf')}</span>
        </div>
      );
    case 'RICH_TEXT':
      return <p className="text-[11px] leading-relaxed text-ink-muted">{String(c.html ?? 'Rich text content...')}</p>;
    case 'CALLOUT':
      return (
        <div className="rounded-lg border border-accent/30 bg-accent/5 p-2.5">
          <p className="text-[11px] font-bold text-accent">{String(c.title ?? 'Key Point')}</p>
          <p className="mt-0.5 text-[10px] text-ink-muted">{String(c.message ?? '')}</p>
        </div>
      );
    case 'IMAGE_TEXT': {
      const image = (c.image as { url?: string }) ?? {};
      const position = c.imagePosition === 'right' ? 'right' : 'left';
      return (
        <div className={`flex gap-2.5 ${position === 'right' ? 'flex-row-reverse' : ''}`}>
          <PreviewImage url={image.url} className="h-12 w-12 shrink-0 rounded" />
          <div className="min-w-0">
            <p className="truncate text-[11px] font-bold text-ink">{String(c.title ?? 'Title')}</p>
            <p className="truncate text-[10px] text-ink-muted">{String(c.description ?? '')}</p>
          </div>
        </div>
      );
    }
    case 'KNOWLEDGE_CHECK':
    case 'QUIZ': {
      const questions = (c.questions as { question: string }[]) ?? [];
      return (
        <div className="rounded-lg border border-status-warning/30 bg-status-warningSubtle p-2.5">
          <div className="flex items-center gap-1.5 text-status-warning">
            <HelpCircle className="h-3.5 w-3.5" />
            <span className="text-[11px] font-bold">{block.type === 'QUIZ' ? 'Quiz' : 'Knowledge Check'}</span>
          </div>
          <p className="mt-1 text-[10px] text-ink-muted">{questions.length} question{questions.length === 1 ? '' : 's'}</p>
        </div>
      );
    }
    case 'NEXT_LESSON':
      return (
        <button className="flex w-full items-center justify-center gap-1.5 rounded-md bg-accent py-2 text-[11px] font-semibold text-white">
          {String(c.label ?? 'Continue')} <ArrowRight className="h-3 w-3" />
        </button>
      );
    default:
      return null;
  }
}

interface StudentPreviewProps {
  lessonTitle: string;
  blocks: LessonBlock[];
}

export const StudentPreview: React.FC<StudentPreviewProps> = ({ lessonTitle, blocks }) => {
  return (
    <div className="flex h-full flex-col">
      <h2 className="flex items-center gap-2 px-4 pt-4 text-sm font-bold text-ink">Student Preview</h2>
      <div className="flex flex-1 items-start justify-center overflow-y-auto p-4">
        <div className="w-full max-w-[220px] overflow-hidden rounded-[1.5rem] border-4 border-charcoal bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-charcoal px-3 py-2">
            <span className="text-[9px] font-bold text-accent">HOLCIM ACADEMY</span>
            <div className="h-3 w-3 rounded-full bg-white/20" />
          </div>
          <div className="max-h-[500px] space-y-3 overflow-y-auto p-3">
            <p className="text-xs font-bold text-ink">{lessonTitle || 'Untitled Lesson'}</p>
            {blocks.length === 0 ? (
              <p className="py-8 text-center text-[10px] text-ink-faint">Add blocks to see the preview</p>
            ) : (
              blocks
                .slice()
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((block) => <div key={block.id}>{renderBlock(block)}</div>)
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
