import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  getLessonApi,
  updateLessonApi,
  getBlockTypesApi,
  addBlockApi,
  updateBlockApi,
  deleteBlockApi,
  reorderBlocksApi,
} from '../../services/courseBuilder.service';
import { LessonBlock } from '../../types/courseBuilder.types';
import { ContentLibrary } from '../../components/lessonBuilder/ContentLibrary';
import { LessonCanvas } from '../../components/lessonBuilder/LessonCanvas';
import { StudentPreview } from '../../components/lessonBuilder/StudentPreview';
import { ArrowLeft, AlertCircle, UploadCloud, Library, Info as InfoIcon } from 'lucide-react';
import clsx from 'clsx';

export const LessonBuilderPage: React.FC = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();

  const [leftTab, setLeftTab] = useState<'info' | 'library'>('info');
  const [blocks, setBlocks] = useState<LessonBlock[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('draft');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState(false);

  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const pendingContent = useRef<Record<string, Record<string, unknown>>>({});

  const { data: lesson } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => getLessonApi(lessonId as string),
    enabled: Boolean(lessonId),
  });

  const { data: blockTypes = [] } = useQuery({
    queryKey: ['block-types'],
    queryFn: getBlockTypesApi,
  });

  useEffect(() => {
    if (lesson) {
      setTitle(lesson.title);
      setDescription(lesson.description ?? '');
      setStatus(lesson.status);
      setBlocks(lesson.blocks);
      setHasUnpublishedChanges(lesson.hasUnpublishedChanges);
    }
  }, [lesson]);

  const handleAddBlock = async (type: string) => {
    if (!lessonId) return;
    try {
      const previousIds = new Set(blocks.map((b) => b.id));
      const updated = await addBlockApi(lessonId, type);
      setBlocks(updated);
      setHasUnpublishedChanges(true);
      const newBlock = updated.find((b) => !previousIds.has(b.id));
      if (newBlock) setExpandedId(newBlock.id);
      setLeftTab('info');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to add block');
    }
  };

  const handleContentChange = useCallback(
    (blockId: string, content: Record<string, unknown>) => {
      setBlocks((prev) => prev.map((b) => (b.id === blockId ? { ...b, content } : b)));
      setHasUnpublishedChanges(true);
      if (!lessonId) return;
      if (saveTimers.current[blockId]) clearTimeout(saveTimers.current[blockId]);
      pendingContent.current[blockId] = content;
      saveTimers.current[blockId] = setTimeout(async () => {
        delete saveTimers.current[blockId];
        delete pendingContent.current[blockId];
        try {
          await updateBlockApi(lessonId, blockId, { content });
        } catch (err) {
          setErrorMessage(err instanceof Error ? err.message : 'Failed to save block');
        }
      }, 700);
    },
    [lessonId],
  );

  // Publishing snapshots whatever is saved server-side, so any edit still
  // waiting on the 700ms auto-save debounce must be written first — otherwise
  // the last few keystrokes would silently miss the published version.
  const flushPendingSaves = async () => {
    if (!lessonId) return;
    const entries = Object.entries(pendingContent.current);
    entries.forEach(([blockId]) => clearTimeout(saveTimers.current[blockId]));
    saveTimers.current = {};
    pendingContent.current = {};
    await Promise.all(entries.map(([blockId, content]) => updateBlockApi(lessonId, blockId, { content })));
  };

  const handleToggleLock = async (blockId: string, locked: boolean) => {
    if (!lessonId) return;
    const target = blocks.find((b) => b.id === blockId);
    if (!target) return;
    const nextStyle = { ...target.style, lockUntilPrevious: locked };
    setBlocks((prev) => prev.map((b) => (b.id === blockId ? { ...b, style: nextStyle } : b)));
    setHasUnpublishedChanges(true);
    try {
      await updateBlockApi(lessonId, blockId, { style: nextStyle });
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update block visibility');
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    if (!lessonId || !window.confirm('Delete this content block?')) return;
    try {
      const updated = await deleteBlockApi(lessonId, blockId);
      setBlocks(updated);
      setHasUnpublishedChanges(true);
      if (expandedId === blockId) setExpandedId(null);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to delete block');
    }
  };

  const handleReorder = async (blockIds: string[]) => {
    if (!lessonId) return;
    setBlocks((prev) => {
      const byId = new Map(prev.map((b) => [b.id, b]));
      return blockIds.map((id, index) => ({ ...byId.get(id)!, sortOrder: index + 1 }));
    });
    setHasUnpublishedChanges(true);
    try {
      const updated = await reorderBlocksApi(lessonId, blockIds);
      setBlocks(updated);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to reorder blocks');
    }
  };

  const persistLessonInfo = async (nextStatus?: string) => {
    if (!lessonId) return;
    setSaving(true);
    setErrorMessage(null);
    try {
      if (nextStatus === 'published') await flushPendingSaves();
      const updated = await updateLessonApi(lessonId, {
        title,
        description,
        ...(nextStatus ? { status: nextStatus } : {}),
      });
      setStatus(updated.status);
      setHasUnpublishedChanges(updated.hasUnpublishedChanges);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save lesson');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-surface">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-surface-border bg-surface-card px-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/staff/courses/${courseId}/edit`)}
            className="flex items-center gap-1 text-xs font-medium text-ink-muted hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Courses
          </button>
          <span className="text-ink-faint">/</span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-accent">Lesson Builder</p>
            <p className="text-sm font-bold text-ink">{title || 'Untitled Lesson'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => persistLessonInfo()}
            disabled={saving}
            className="rounded-md border border-surface-border bg-surface-card px-3.5 py-1.5 text-xs font-semibold text-ink-muted transition hover:border-accent hover:text-accent disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            onClick={() => persistLessonInfo('published')}
            disabled={saving || (status === 'published' && !hasUnpublishedChanges)}
            className="flex items-center gap-1.5 rounded-md bg-accent px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-accent-hover disabled:opacity-50"
          >
            <UploadCloud className="h-3.5 w-3.5" />
            {status !== 'published' ? 'Publish' : hasUnpublishedChanges ? 'Publish changes' : 'Published'}
          </button>
        </div>
      </header>

      {errorMessage && (
        <div className="flex items-start gap-2.5 border-b border-status-danger/30 bg-status-dangerSubtle px-5 py-2.5 text-xs text-status-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Three-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel: Lesson Info / Content Library toggle */}
        <div className="flex w-72 shrink-0 flex-col border-r border-surface-border bg-surface-card">
          <div className="flex border-b border-surface-border">
            <button
              onClick={() => setLeftTab('info')}
              className={clsx(
                'flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[11px] font-bold uppercase tracking-wider',
                leftTab === 'info' ? 'border-b-2 border-accent text-accent' : 'text-ink-muted hover:text-ink',
              )}
            >
              <InfoIcon className="h-3.5 w-3.5" /> Lesson Info
            </button>
            <button
              onClick={() => setLeftTab('library')}
              className={clsx(
                'flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[11px] font-bold uppercase tracking-wider',
                leftTab === 'library' ? 'border-b-2 border-accent text-accent' : 'text-ink-muted hover:text-ink',
              )}
            >
              <Library className="h-3.5 w-3.5" /> Content Library
            </button>
          </div>

          {leftTab === 'info' ? (
            <div className="space-y-4 overflow-y-auto p-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Lesson Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full rounded-md border border-surface-border bg-surface px-3 py-2 text-xs text-ink focus:border-accent focus:bg-surface-card focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="mt-1 w-full rounded-md border border-surface-border bg-surface px-3 py-2 text-xs text-ink focus:border-accent focus:bg-surface-card focus:outline-none"
                />
              </div>
              <div className="rounded-md border border-surface-border bg-surface p-3">
                <p className="text-[11px] font-semibold text-ink">Status</p>
                <span
                  className={clsx(
                    'mt-1 inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase',
                    status === 'published' ? 'bg-status-successSubtle text-status-success' : 'bg-status-warningSubtle text-status-warning',
                  )}
                >
                  {status}
                </span>
                {status !== 'published' && (
                  <p className="mt-1.5 text-[11px] text-ink-muted">Hidden from learners until you publish.</p>
                )}
                {status === 'published' && hasUnpublishedChanges && (
                  <p className="mt-1.5 text-[11px] font-medium text-status-warning">
                    Unpublished changes — learners still see the last published version.
                  </p>
                )}
              </div>
              <div className="rounded-md border border-surface-border bg-surface p-3 text-[11px] text-ink-muted">
                {blocks.length} block{blocks.length === 1 ? '' : 's'} added
              </div>
            </div>
          ) : (
            <ContentLibrary blockTypes={blockTypes} onAddBlock={handleAddBlock} />
          )}
        </div>

        {/* Middle: Canvas */}
        <main className="flex-1 overflow-y-auto p-6">
          <LessonCanvas
            blocks={blocks}
            blockTypes={blockTypes}
            expandedId={expandedId}
            onToggleExpand={(id) => setExpandedId((cur) => (cur === id ? null : id))}
            onReorder={handleReorder}
            onDelete={handleDeleteBlock}
            onContentChange={handleContentChange}
            onToggleLock={handleToggleLock}
            onOpenLibrary={() => setLeftTab('library')}
          />
        </main>

        {/* Right: Student Preview */}
        <aside className="w-72 shrink-0 border-l border-surface-border bg-surface-card">
          <StudentPreview lessonTitle={title} blocks={blocks} />
        </aside>
      </div>
    </div>
  );
};
