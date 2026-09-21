import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  getFinalQuizApi,
  addFinalQuizQuestionApi,
  updateFinalQuizQuestionApi,
  deleteFinalQuizQuestionApi,
  reorderFinalQuizQuestionsApi,
} from '../../services/courseBuilder.service';
import { FinalQuizQuestion } from '../../types/courseBuilder.types';
import { QuestionEditor, Question } from '../../components/lessonBuilder/BlockEditors';
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
import { ArrowLeft, AlertCircle, GripVertical, Trash2, Plus, Save } from 'lucide-react';

function emptyDraft(): Question {
  return { id: 'draft', question: '', options: ['', '', '', ''], correctAnswer: '', points: 10 };
}

function SortableQuestionCard({
  question,
  index,
  onChange,
  onDelete,
}: {
  question: FinalQuizQuestion;
  index: number;
  onChange: (q: Question) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: question.id });
  const style: React.CSSProperties = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-2">
      <button {...attributes} {...listeners} className="mt-4 cursor-grab text-ink-faint hover:text-ink-muted">
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1">
        <QuestionEditor question={question} index={index} optionCount={{ min: 4, exact: 4 }} onChange={onChange} />
      </div>
      <button onClick={onDelete} className="mt-4 text-ink-faint hover:text-status-danger" title="Delete question">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

export const FinalQuizBuilderPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<FinalQuizQuestion[]>([]);
  const [draft, setDraft] = useState<Question | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const { data: finalQuiz } = useQuery({
    queryKey: ['final-quiz-detail', courseId],
    queryFn: () => getFinalQuizApi(courseId as string),
    enabled: Boolean(courseId),
  });

  useEffect(() => {
    if (finalQuiz) setQuestions(finalQuiz.questions);
  }, [finalQuiz]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !courseId) return;
    const oldIndex = questions.findIndex((q) => q.id === active.id);
    const newIndex = questions.findIndex((q) => q.id === over.id);
    const reordered = arrayMove(questions, oldIndex, newIndex);
    setQuestions(reordered);
    try {
      await reorderFinalQuizQuestionsApi(courseId, reordered.map((q) => q.id));
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to reorder questions');
    }
  };

  const handleQuestionChange = (questionId: string, next: Question) => {
    setQuestions((prev) => prev.map((q) => (q.id === questionId ? { ...q, ...next } : q)));
    if (!courseId) return;
    if (saveTimers.current[questionId]) clearTimeout(saveTimers.current[questionId]);
    saveTimers.current[questionId] = setTimeout(async () => {
      try {
        await updateFinalQuizQuestionApi(courseId, questionId, {
          question: next.question,
          options: next.options,
          correctAnswer: next.correctAnswer,
          points: next.points,
          explanation: next.explanation,
        });
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Failed to save question');
      }
    }, 700);
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!courseId || !window.confirm('Delete this question?')) return;
    try {
      const updated = await deleteFinalQuizQuestionApi(courseId, questionId);
      setQuestions(updated);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to delete question');
    }
  };

  const handleSaveDraft = async () => {
    if (!courseId || !draft) return;
    setErrorMessage(null);
    try {
      const updated = await addFinalQuizQuestionApi(courseId, {
        question: draft.question,
        options: draft.options,
        correctAnswer: draft.correctAnswer,
        points: draft.points,
        explanation: draft.explanation,
      });
      setQuestions(updated);
      setDraft(null);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to add question — check all 4 options and the correct answer are filled in.');
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(`/staff/courses/${courseId}/edit`)}
          className="flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Course
        </button>
        <span className="text-xs font-semibold text-ink-muted">{questions.length} question{questions.length === 1 ? '' : 's'}</span>
      </div>

      <div>
        <h1 className="text-xl font-bold tracking-tight text-ink">Build Final Quiz</h1>
        <p className="mt-1 text-xs text-ink-muted">
          {finalQuiz?.quizName || 'Final course quiz'} — every question requires exactly 4 options.
        </p>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-2.5 rounded-lg border border-status-danger/30 bg-status-dangerSubtle p-3.5 text-xs text-status-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {questions.map((q, i) => (
              <SortableQuestionCard
                key={q.id}
                question={q}
                index={i}
                onChange={(next) => handleQuestionChange(q.id, next)}
                onDelete={() => handleDeleteQuestion(q.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {draft ? (
        <div className="rounded-lg border-2 border-accent/30 bg-accent/5 p-1">
          <QuestionEditor question={draft} index={questions.length} optionCount={{ min: 4, exact: 4 }} onChange={setDraft} />
          <div className="flex items-center gap-2 p-3">
            <button
              onClick={handleSaveDraft}
              className="flex items-center gap-1.5 rounded-md bg-accent px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover"
            >
              <Save className="h-3.5 w-3.5" /> Save Question
            </button>
            <button onClick={() => setDraft(null)} className="rounded-md border border-surface-border px-3.5 py-1.5 text-xs font-semibold text-ink-muted hover:text-ink">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setDraft(emptyDraft())}
          className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-accent/40 py-3 text-xs font-semibold text-accent transition hover:border-accent hover:bg-accent/5"
        >
          <Plus className="h-4 w-4" /> Add Question
        </button>
      )}
    </div>
  );
};
