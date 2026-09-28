import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getCourseApi,
  createCourseApi,
  updateCourseApi,
  changeCourseStatusApi,
  listModulesApi,
  createLessonApi,
  updateLessonApi,
  deleteLessonApi,
  reorderLessonsApi,
  getFinalQuizApi,
  updateFinalQuizConfigApi,
} from '../../services/courseBuilder.service';
import { CourseDifficulty, LessonSummary } from '../../types/courseBuilder.types';
import { CourseLessonsPanel } from '../../components/courseBuilder/CourseLessonsPanel';
import { FileUploadField } from '../../components/shared/FileUploadField';
import {
  ArrowLeft,
  AlertCircle,
  Info,
  ImageIcon,
  BookOpen,
  ClipboardList,
  Wand2,
  UploadCloud,
} from 'lucide-react';

export const CourseBuilderPage: React.FC = () => {
  const { courseId: routeCourseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [courseId, setCourseId] = useState<string | null>(routeCourseId ?? null);
  const isEditMode = Boolean(courseId);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<CourseDifficulty>('intermediate');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [totalXpReward, setTotalXpReward] = useState('');
  const [bannerRef, setBannerRef] = useState('');
  const [status, setStatus] = useState('draft');

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [moduleId, setModuleId] = useState<string | null>(null);
  const [lessons, setLessons] = useState<LessonSummary[]>([]);

  // Final quiz config (local mirror, saved via its own PUT)
  const [quizName, setQuizName] = useState('');
  const [quizXp, setQuizXp] = useState('');
  const [totalQuestions, setTotalQuestions] = useState('');
  const [passingScore, setPassingScore] = useState('');
  const [maxAttempts, setMaxAttempts] = useState('3');

  const { data: course, refetch: refetchCourse } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => getCourseApi(courseId as string),
    enabled: Boolean(courseId),
  });

  const { data: modules, refetch: refetchModules } = useQuery({
    queryKey: ['course-modules', courseId],
    queryFn: () => listModulesApi(courseId as string),
    enabled: Boolean(courseId),
  });

  const { data: finalQuiz, refetch: refetchQuiz } = useQuery({
    queryKey: ['final-quiz', courseId],
    queryFn: () => getFinalQuizApi(courseId as string),
    enabled: Boolean(courseId),
  });

  useEffect(() => {
    if (course) {
      setName(course.name);
      setDescription(course.description ?? '');
      setDifficulty(course.difficulty);
      setEstimatedDuration(String(course.estimatedDuration));
      setTotalXpReward(String(course.totalXpReward));
      setBannerRef(course.bannerRef ?? '');
      setStatus(course.status);
    }
  }, [course]);

  useEffect(() => {
    if (modules && modules.length > 0) {
      setModuleId(modules[0].moduleId);
      setLessons(modules[0].lessons ?? []);
    }
  }, [modules]);

  useEffect(() => {
    if (finalQuiz) {
      setQuizName(finalQuiz.quizName);
      setQuizXp(String(finalQuiz.xpReward));
      setTotalQuestions(String(finalQuiz.totalQuestions));
      setPassingScore(String(finalQuiz.passingScore));
      setMaxAttempts(String(finalQuiz.maxAttempts));
    }
  }, [finalQuiz]);

  const buildInput = () => ({
    name,
    description: description || undefined,
    difficulty,
    estimatedDuration: parseFloat(estimatedDuration) || 0,
    totalXpReward: parseInt(totalXpReward, 10) || 0,
    bannerRef: bannerRef || undefined,
  });

  const handleSaveDraft = async () => {
    setErrorMessage(null);
    setSaving(true);
    try {
      if (isEditMode && courseId) {
        await updateCourseApi(courseId, buildInput());
        await refetchCourse();
      } else {
        const created = await createCourseApi(buildInput());
        setCourseId(created.courseId);
        queryClient.invalidateQueries({ queryKey: ['content-creator-courses'] });
        navigate(`/staff/courses/${created.courseId}/edit`, { replace: true });
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save course');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!courseId) return;
    setErrorMessage(null);
    setSaving(true);
    try {
      await updateCourseApi(courseId, buildInput());
      await changeCourseStatusApi(courseId, 'published');
      await refetchCourse();
      queryClient.invalidateQueries({ queryKey: ['content-creator-courses'] });
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to publish course');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveQuizConfig = useCallback(async () => {
    if (!courseId) return;
    try {
      await updateFinalQuizConfigApi(courseId, {
        quizName,
        xpReward: parseInt(quizXp, 10) || 0,
        totalQuestions: parseInt(totalQuestions, 10) || 0,
        passingScore: parseInt(passingScore, 10) || 0,
        maxAttempts: parseInt(maxAttempts, 10) || 1,
      });
      await refetchQuiz();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save final quiz config');
    }
  }, [courseId, quizName, quizXp, totalQuestions, passingScore, maxAttempts, refetchQuiz]);

  const refreshLessons = async () => {
    const { data: fresh } = { data: await listModulesApi(courseId as string) };
    if (fresh.length > 0) {
      setModuleId(fresh[0].moduleId);
      setLessons(fresh[0].lessons ?? []);
    }
    refetchModules();
    refetchCourse();
  };

  const handleAddLesson = async (title: string) => {
    if (!courseId || !moduleId) return;
    await createLessonApi(courseId, moduleId, title);
    await refreshLessons();
  };

  const handleRenameLesson = async (lessonId: string, title: string) => {
    await updateLessonApi(lessonId, { title });
    await refreshLessons();
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!window.confirm('Delete this lesson? This cannot be undone.')) return;
    await deleteLessonApi(lessonId);
    await refreshLessons();
  };

  const handleReorderLessons = async (lessonIds: string[]) => {
    if (!courseId || !moduleId) return;
    await reorderLessonsApi(courseId, moduleId, lessonIds);
  };

  const lessonCount = lessons.length;
  const quizCount = finalQuiz?.questions.length ?? 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Breadcrumb + top actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <button onClick={() => navigate('/staff/courses')} className="flex items-center gap-1 hover:text-ink">
            <ArrowLeft className="h-3.5 w-3.5" /> Courses
          </button>
          <span>/</span>
          <span className="font-semibold text-ink">{isEditMode ? 'Edit Course' : 'Create Course'}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveDraft}
            disabled={saving || !name}
            className="rounded-md border border-surface-border bg-surface-card px-4 py-2 text-xs font-semibold text-accent transition hover:border-accent disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            onClick={handlePublish}
            disabled={saving || !isEditMode || status === 'published'}
            className="flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-accent-hover disabled:opacity-50"
          >
            <UploadCloud className="h-3.5 w-3.5" />
            {status === 'published' ? 'Published' : 'Publish'}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-ink">{isEditMode ? 'Edit Course' : 'Create Course'}</h1>
        <span
          className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
            status === 'published' ? 'bg-status-successSubtle text-status-success' : 'bg-status-warningSubtle text-status-warning'
          }`}
        >
          {status}
        </span>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-2.5 rounded-lg border border-status-danger/30 bg-status-dangerSubtle p-3.5 text-xs text-status-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        {/* Main column */}
        <div className="space-y-6">
          {/* Course Information */}
          <section className="rounded-xl border border-surface-border bg-surface-card p-6 shadow-card">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-ink">
              <Info className="h-4 w-4 text-accent" /> Course Information
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink">Course Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Cement Basics"
                  className="mt-1.5 w-full rounded-md border border-surface-border bg-surface px-3.5 py-2 text-xs text-ink focus:border-accent focus:bg-surface-card focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink">Course Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Describe the course objectives and content..."
                className="mt-1.5 w-full rounded-md border border-surface-border bg-surface px-3.5 py-2 text-xs text-ink focus:border-accent focus:bg-surface-card focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as CourseDifficulty)}
                  className="mt-1.5 w-full rounded-md border border-surface-border bg-surface px-3 py-2 text-xs font-medium text-ink focus:border-accent focus:bg-surface-card focus:outline-none"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink">Est. Duration (hrs)</label>
                <input
                  type="number"
                  step="0.5"
                  value={estimatedDuration}
                  onChange={(e) => setEstimatedDuration(e.target.value)}
                  className="mt-1.5 w-full rounded-md border border-surface-border bg-surface px-3.5 py-2 text-xs text-ink focus:border-accent focus:bg-surface-card focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink">Total XP Reward</label>
                <input
                  type="number"
                  value={totalXpReward}
                  onChange={(e) => setTotalXpReward(e.target.value)}
                  className="mt-1.5 w-full rounded-md border border-surface-border bg-surface px-3.5 py-2 text-xs text-ink focus:border-accent focus:bg-surface-card focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>
          </section>

          {/* Course Banner */}
          <section className="rounded-xl border border-surface-border bg-surface-card p-6 shadow-card">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-ink">
              <ImageIcon className="h-4 w-4 text-accent" /> Course Banner
            </h2>
            <div className="mx-auto max-w-sm">
              <FileUploadField
                accept="image/*"
                kind="image"
                currentUrl={bannerRef || undefined}
                placeholder="Drag & Drop Banner Image"
                helperText="or click to browse files (1200x400px recommended)"
                onUploaded={async (result) => {
                  setBannerRef(result.fileUrl);
                  if (courseId) {
                    try {
                      await updateCourseApi(courseId, { bannerRef: result.fileUrl });
                      await refetchCourse();
                    } catch (err) {
                      setErrorMessage(err instanceof Error ? err.message : 'Failed to save banner');
                    }
                  }
                }}
                onClear={() => setBannerRef('')}
              />
            </div>
          </section>

          {/* Course Lessons */}
          <section className="rounded-xl border border-surface-border bg-surface-card p-6 shadow-card">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-ink">
              <BookOpen className="h-4 w-4 text-accent" /> Course Lessons
            </h2>
            <CourseLessonsPanel
              courseId={courseId}
              lessons={lessons}
              onAdd={handleAddLesson}
              onRename={handleRenameLesson}
              onDelete={handleDeleteLesson}
              onReorder={handleReorderLessons}
            />
          </section>

          {/* Final Course Quiz */}
          <section className="rounded-xl border border-surface-border bg-surface-card p-6 shadow-card">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-ink">
              <ClipboardList className="h-4 w-4 text-accent" /> Final Course Quiz
            </h2>
            {!courseId ? (
              <div className="rounded-lg border border-dashed border-surface-border bg-surface p-6 text-center text-xs text-ink-muted">
                Save the course as a draft first to configure the final quiz.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-ink">Quiz Name</label>
                    <input
                      value={quizName}
                      onChange={(e) => setQuizName(e.target.value)}
                      onBlur={handleSaveQuizConfig}
                      className="mt-1.5 w-full rounded-md border border-surface-border bg-surface px-3.5 py-2 text-xs text-ink focus:border-accent focus:bg-surface-card focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-ink">XP Reward</label>
                    <input
                      type="number"
                      value={quizXp}
                      onChange={(e) => setQuizXp(e.target.value)}
                      onBlur={handleSaveQuizConfig}
                      className="mt-1.5 w-full rounded-md border border-surface-border bg-surface px-3.5 py-2 text-xs text-ink focus:border-accent focus:bg-surface-card focus:outline-none"
                    />
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-ink">Total Questions</label>
                    <input
                      type="number"
                      value={totalQuestions}
                      onChange={(e) => setTotalQuestions(e.target.value)}
                      onBlur={handleSaveQuizConfig}
                      className="mt-1.5 w-full rounded-md border border-surface-border bg-surface px-3.5 py-2 text-xs text-ink focus:border-accent focus:bg-surface-card focus:outline-none"
                    />
                  </div>
                  {/* Pass mark and attempts are platform rules, not per-course settings. */}
                  <div>
                    <p className="block text-xs font-semibold uppercase tracking-wider text-ink">Pass Mark</p>
                    <p className="mt-1.5 rounded-md border border-surface-border bg-surface px-3.5 py-2 text-xs font-medium text-ink-muted">
                      50% (fixed)
                    </p>
                  </div>
                  <div>
                    <p className="block text-xs font-semibold uppercase tracking-wider text-ink">Attempts</p>
                    <p className="mt-1.5 rounded-md border border-surface-border bg-surface px-3.5 py-2 text-xs font-medium text-ink-muted">
                      1 — HR grants more
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-[11px] text-ink-muted">
                  Learners take this after their last lesson; passing it completes the course. They earn the XP
                  reward in proportion to their score (e.g. 55% earns 55% of the XP).
                </p>
                {quizCount === 0 && (
                  <p className="mt-3 flex items-center gap-1.5 rounded-md bg-status-warningSubtle px-3 py-2 text-[11px] font-medium text-status-warning">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    Required — this course can&apos;t be published until the final quiz has at least one question.
                  </p>
                )}
                <button
                  onClick={() => navigate(`/staff/courses/${courseId}/final-quiz/build`)}
                  className="mt-5 flex items-center gap-2 rounded-md border border-surface-border px-4 py-2 text-xs font-semibold text-ink-muted transition hover:border-accent hover:text-accent"
                >
                  <Wand2 className="h-3.5 w-3.5" />
                  Build Final Quiz ({quizCount} question{quizCount === 1 ? '' : 's'})
                </button>
              </>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="sticky top-6 rounded-xl border border-surface-border bg-surface-card p-5 shadow-card">
            <h3 className="text-sm font-bold text-ink">Course Summary</h3>
            <dl className="mt-4 space-y-3 text-xs">
              <div>
                <dt className="font-medium uppercase tracking-wider text-ink-faint">Name</dt>
                <dd className="mt-0.5 font-semibold text-ink">{name || '—'}</dd>
              </div>
              <div className="flex gap-6">
                <div>
                  <dd className="text-xl font-bold text-accent">{lessonCount}</dd>
                  <dt className="text-[10px] text-ink-muted">Lessons</dt>
                </div>
                <div>
                  <dd className="text-xl font-bold text-accent">{quizCount}</dd>
                  <dt className="text-[10px] text-ink-muted">Quiz Qs</dt>
                </div>
              </div>
              <div>
                <dd className="text-xl font-bold text-ink">{totalXpReward || 0} XP</dd>
                <dt className="text-[10px] text-ink-muted">Total Course Reward</dt>
              </div>
            </dl>
            <div className="mt-4 border-t border-surface-border pt-4">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-ink-muted">Setup Progress</span>
                <span className="font-bold text-accent">{course?.setupProgress ?? 0}%</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface">
                <div className="h-full rounded-full bg-accent" style={{ width: `${course?.setupProgress ?? 0}%` }} />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
