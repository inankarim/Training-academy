import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, Trash2, Plus, X, Check } from 'lucide-react';
import { LessonSummary } from '../../types/courseBuilder.types';

interface CourseLessonsPanelProps {
  courseId: string | null;
  lessons: LessonSummary[];
  onAdd: (title: string) => Promise<void>;
  onRename: (lessonId: string, title: string) => Promise<void>;
  onDelete: (lessonId: string) => Promise<void>;
  onReorder: (lessonIds: string[]) => Promise<void>;
}

function SortableLessonRow({
  lesson,
  index,
  onOpen,
  onRename,
  onDelete,
}: {
  lesson: LessonSummary;
  index: number;
  onOpen: () => void;
  onRename: (title: string) => Promise<void>;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lesson.lessonId });
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(lesson.title);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-md border border-surface-border bg-surface-card px-3 py-2.5"
    >
      <button {...attributes} {...listeners} className="cursor-grab text-ink-faint hover:text-ink-muted" title="Drag to reorder">
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface text-[11px] font-bold text-ink-muted">
        {String(index + 1).padStart(2, '0')}
      </span>

      {editing ? (
        <>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 rounded border border-accent px-2 py-1 text-xs text-ink focus:outline-none"
          />
          <button
            onClick={async () => {
              if (title.trim()) await onRename(title.trim());
              setEditing(false);
            }}
            className="text-status-success hover:opacity-70"
          >
            <Check className="h-4 w-4" />
          </button>
          <button onClick={() => { setTitle(lesson.title); setEditing(false); }} className="text-ink-faint hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </>
      ) : (
        <>
          <button onClick={onOpen} className="flex-1 truncate text-left text-xs font-medium text-ink hover:text-accent">
            {lesson.title}
          </button>
          <span className="text-[10px] text-ink-faint">{lesson.blockCount} blocks</span>
          <button onClick={() => setEditing(true)} className="text-ink-faint hover:text-accent" title="Rename">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={onDelete} className="text-ink-faint hover:text-status-danger" title="Delete lesson">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </>
      )}
    </div>
  );
}

export const CourseLessonsPanel: React.FC<CourseLessonsPanelProps> = ({
  courseId,
  lessons,
  onAdd,
  onRename,
  onDelete,
  onReorder,
}) => {
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [localLessons, setLocalLessons] = useState(lessons);

  React.useEffect(() => setLocalLessons(lessons), [lessons]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = localLessons.findIndex((l) => l.lessonId === active.id);
    const newIndex = localLessons.findIndex((l) => l.lessonId === over.id);
    const reordered = arrayMove(localLessons, oldIndex, newIndex);
    setLocalLessons(reordered);
    await onReorder(reordered.map((l) => l.lessonId));
  };

  if (!courseId) {
    return (
      <div className="rounded-lg border border-dashed border-surface-border bg-surface p-6 text-center text-xs text-ink-muted">
        Save the course as a draft first to start adding lessons.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={localLessons.map((l) => l.lessonId)} strategy={verticalListSortingStrategy}>
          {localLessons.map((lesson, index) => (
            <SortableLessonRow
              key={lesson.lessonId}
              lesson={lesson}
              index={index}
              onOpen={() => navigate(`/staff/courses/${courseId}/lessons/${lesson.lessonId}/build`)}
              onRename={(title) => onRename(lesson.lessonId, title)}
              onDelete={() => onDelete(lesson.lessonId)}
            />
          ))}
        </SortableContext>
      </DndContext>

      {adding ? (
        <div className="flex items-center gap-2 rounded-md border border-accent bg-surface-card px-3 py-2.5">
          <input
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Lesson title..."
            className="flex-1 text-xs text-ink focus:outline-none"
            onKeyDown={async (e) => {
              if (e.key === 'Enter' && newTitle.trim()) {
                await onAdd(newTitle.trim());
                setNewTitle('');
                setAdding(false);
              }
            }}
          />
          <button
            onClick={async () => {
              if (newTitle.trim()) {
                await onAdd(newTitle.trim());
                setNewTitle('');
              }
              setAdding(false);
            }}
            className="text-status-success hover:opacity-70"
          >
            <Check className="h-4 w-4" />
          </button>
          <button onClick={() => setAdding(false)} className="text-ink-faint hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-accent/40 py-2.5 text-xs font-semibold text-accent transition hover:border-accent hover:bg-accent/5"
        >
          <Plus className="h-4 w-4" />
          Add Lesson
        </button>
      )}
    </div>
  );
};
