import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { FileUploadField } from '../shared/FileUploadField';

const label = 'block text-[11px] font-semibold uppercase tracking-wider text-ink-muted';
const input =
  'mt-1 w-full rounded-md border border-surface-border bg-surface px-3 py-2 text-xs text-ink focus:border-accent focus:bg-white focus:outline-none focus:ring-1 focus:ring-accent';

type Content = Record<string, unknown>;
interface EditorProps {
  content: Content;
  onChange: (content: Content) => void;
}

function field<T = string>(content: Content, key: string, fallback: T): T {
  return (content[key] as T) ?? fallback;
}

// --- MEDIA ---

export const HeroBannerEditor: React.FC<EditorProps> = ({ content, onChange }) => {
  const bannerImage = field<{ url?: string }>(content, 'bannerImage', {});
  return (
  <div className="space-y-3">
    <FileUploadField
      accept="image/*"
      kind="image"
      currentUrl={bannerImage.url}
      placeholder="Upload high-resolution banner"
      onUploaded={(result) => onChange({ ...content, bannerImage: { url: result.fileUrl } })}
      onClear={() => onChange({ ...content, bannerImage: {} })}
    />
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className={label}>Module Title</label>
        <input className={input} value={field(content, 'moduleTitle', '')} onChange={(e) => onChange({ ...content, moduleTitle: e.target.value })} />
      </div>
      <div>
        <label className={label}>Lesson Title</label>
        <input className={input} value={field(content, 'lessonTitle', '')} onChange={(e) => onChange({ ...content, lessonTitle: e.target.value })} />
      </div>
    </div>
  </div>
  );
};

export const VideoEditor: React.FC<EditorProps> = ({ content, onChange }) => {
  const sourceType = field<string>(content, 'sourceType', 'UPLOAD');
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {(['UPLOAD', 'URL'] as const).map((s) => (
          <button
            key={s}
            onClick={() => onChange({ ...content, sourceType: s })}
            className={`rounded px-3 py-1.5 text-[11px] font-bold ${sourceType === s ? 'bg-accent text-white' : 'border border-surface-border text-ink-muted'}`}
          >
            {s === 'UPLOAD' ? 'Upload Video' : 'YouTube URL'}
          </button>
        ))}
      </div>
      {sourceType === 'URL' ? (
        <div>
          <label className={label}>Video URL</label>
          <input className={input} value={field(content, 'videoUrl', '')} onChange={(e) => onChange({ ...content, videoUrl: e.target.value })} placeholder="https://..." />
        </div>
      ) : (
        <FileUploadField
          accept="video/*"
          kind="video"
          currentUrl={field(content, 'videoUrl', '')}
          placeholder="Click to upload video"
          onUploaded={(result) => onChange({ ...content, videoUrl: result.fileUrl })}
          onClear={() => onChange({ ...content, videoUrl: '' })}
        />
      )}
      <div>
        <label className={label}>Duration (e.g. 05:30)</label>
        <input className={input} value={field(content, 'duration', '')} onChange={(e) => onChange({ ...content, duration: e.target.value })} />
      </div>
      <div>
        <label className={label}>Transcript / Captions (optional)</label>
        <textarea
          className={input}
          rows={3}
          value={field(content, 'transcript', '')}
          onChange={(e) => onChange({ ...content, transcript: e.target.value })}
          placeholder="Paste video transcript here..."
        />
      </div>
    </div>
  );
};

export const ImagesEditor: React.FC<EditorProps> = ({ content, onChange }) => {
  const images = field<{ url: string; caption?: string }[]>(content, 'images', []);
  return (
    <div className="space-y-2">
      {images.map((img, i) => (
        <div key={i} className="flex items-start gap-2">
          <div className="flex-1">
            <FileUploadField
              accept="image/*"
              kind="image"
              currentUrl={img.url}
              placeholder={`Image ${i + 1}`}
              onUploaded={(result) => {
                const next = [...images];
                next[i] = { ...next[i], url: result.fileUrl };
                onChange({ ...content, images: next });
              }}
            />
          </div>
          <button
            onClick={() => onChange({ ...content, images: images.filter((_, idx) => idx !== i) })}
            className="mt-1 text-ink-faint hover:text-status-danger"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange({ ...content, images: [...images, { url: '' }] })}
        className="flex items-center gap-1.5 text-[11px] font-semibold text-accent hover:text-accent-hover"
      >
        <Plus className="h-3.5 w-3.5" /> Add Image
      </button>
    </div>
  );
};

export const BannerImageEditor: React.FC<EditorProps> = ({ content, onChange }) => (
  <div className="space-y-3">
    <FileUploadField
      accept="image/*"
      kind="image"
      currentUrl={field(content, 'imageUrl', '')}
      placeholder="Drag & drop or click to upload"
      onUploaded={(result) => onChange({ ...content, imageUrl: result.fileUrl })}
      onClear={() => onChange({ ...content, imageUrl: '' })}
    />
    <div>
      <label className={label}>Caption (optional)</label>
      <input className={input} value={field(content, 'caption', '')} onChange={(e) => onChange({ ...content, caption: e.target.value })} />
    </div>
  </div>
);

export const PdfEditor: React.FC<EditorProps> = ({ content, onChange }) => (
  <div className="space-y-3">
    <FileUploadField
      accept="application/pdf"
      kind="file"
      currentUrl={field(content, 'fileUrl', '')}
      currentFileName={field(content, 'fileName', '')}
      placeholder="Drag & Drop PDF here"
      onUploaded={(result) =>
        onChange({ ...content, fileUrl: result.fileUrl, fileName: result.fileName, mimeType: result.mimeType, size: result.size })
      }
      onClear={() => onChange({ ...content, fileUrl: '', fileName: '' })}
    />
  </div>
);

// --- CONTENT ---

export const RichTextEditor: React.FC<EditorProps> = ({ content, onChange }) => (
  <div>
    <label className={label}>Paragraph</label>
    <textarea
      className={input}
      rows={5}
      value={field(content, 'html', '')}
      onChange={(e) => onChange({ ...content, html: e.target.value })}
      placeholder="Write the lesson content..."
    />
  </div>
);

export const CalloutEditor: React.FC<EditorProps> = ({ content, onChange }) => (
  <div className="space-y-3">
    <div>
      <label className={label}>Title</label>
      <input className={input} value={field(content, 'title', '')} onChange={(e) => onChange({ ...content, title: e.target.value })} />
    </div>
    <div>
      <label className={label}>Message</label>
      <textarea className={input} rows={3} value={field(content, 'message', '')} onChange={(e) => onChange({ ...content, message: e.target.value })} />
    </div>
    <div>
      <label className={label}>Style</label>
      <select className={input} value={field(content, 'type', 'info')} onChange={(e) => onChange({ ...content, type: e.target.value })}>
        <option value="info">Info</option>
        <option value="important">Important</option>
        <option value="warning">Warning</option>
      </select>
    </div>
  </div>
);

export const ImageTextEditor: React.FC<EditorProps> = ({ content, onChange }) => {
  const image = field<{ url?: string }>(content, 'image', {});
  return (
    <div className="space-y-3">
      <FileUploadField
        accept="image/*"
        kind="image"
        currentUrl={image.url}
        placeholder="Drag & drop image or click to select"
        onUploaded={(result) => onChange({ ...content, image: { url: result.fileUrl } })}
        onClear={() => onChange({ ...content, image: {} })}
      />
      <div>
        <label className={label}>Title</label>
        <input className={input} value={field(content, 'title', '')} onChange={(e) => onChange({ ...content, title: e.target.value })} />
      </div>
      <div>
        <label className={label}>Description</label>
        <textarea className={input} rows={3} value={field(content, 'description', '')} onChange={(e) => onChange({ ...content, description: e.target.value })} />
      </div>
      <div>
        <label className={label}>Image Position</label>
        <select className={input} value={field(content, 'imagePosition', 'left')} onChange={(e) => onChange({ ...content, imagePosition: e.target.value })}>
          <option value="left">Left</option>
          <option value="right">Right</option>
        </select>
      </div>
    </div>
  );
};

// --- ASSESSMENT ---

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  points: number;
  explanation?: string;
}

export function QuestionEditor({
  question,
  index,
  onChange,
  optionCount,
}: {
  question: Question;
  index: number;
  onChange: (q: Question) => void;
  optionCount: { min: number; exact?: number };
}) {
  const canRemoveOption = question.options.length > optionCount.min;
  const canAddOption = optionCount.exact ? question.options.length < optionCount.exact : question.options.length < 6;

  return (
    <div className="rounded-lg border border-surface-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">Question {index + 1}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-ink-faint">Points</span>
          <input
            type="number"
            className="w-16 rounded border border-surface-border bg-white px-2 py-1 text-xs text-ink"
            value={question.points}
            onChange={(e) => onChange({ ...question, points: parseInt(e.target.value, 10) || 0 })}
          />
        </div>
      </div>

      <input
        className={`${input} mt-2`}
        value={question.question}
        placeholder="What is the primary binding agent in cement?"
        onChange={(e) => onChange({ ...question, question: e.target.value })}
      />

      <div className="mt-3 space-y-2">
        {question.options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="radio"
              checked={question.correctAnswer === opt && opt !== ''}
              onChange={() => onChange({ ...question, correctAnswer: opt })}
              className="accent-accent"
              title="Mark as correct answer"
            />
            <input
              className="flex-1 rounded border border-surface-border bg-white px-2.5 py-1.5 text-xs text-ink focus:border-accent focus:outline-none"
              value={opt}
              placeholder={`Option ${i + 1}`}
              onChange={(e) => {
                const nextOptions = [...question.options];
                const wasCorrect = question.correctAnswer === opt;
                nextOptions[i] = e.target.value;
                onChange({ ...question, options: nextOptions, correctAnswer: wasCorrect ? e.target.value : question.correctAnswer });
              }}
            />
            {canRemoveOption && (
              <button
                onClick={() => onChange({ ...question, options: question.options.filter((_, idx) => idx !== i) })}
                className="text-ink-faint hover:text-status-danger"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
        {canAddOption && (
          <button
            onClick={() => onChange({ ...question, options: [...question.options, ''] })}
            className="flex items-center gap-1 text-[11px] font-semibold text-accent hover:text-accent-hover"
          >
            <Plus className="h-3 w-3" /> Add Option
          </button>
        )}
      </div>

      <div className="mt-3">
        <label className={label}>Explanation (shown after answer)</label>
        <textarea
          className={input}
          rows={2}
          value={question.explanation ?? ''}
          onChange={(e) => onChange({ ...question, explanation: e.target.value })}
          placeholder="e.g. Correct! Cement acts as the primary binding agent..."
        />
      </div>
    </div>
  );
}

export function makeEmptyQuestion(): Question {
  return { id: crypto.randomUUID(), question: '', options: ['', ''], correctAnswer: '', points: 10 };
}

export const KnowledgeCheckEditor: React.FC<EditorProps> = ({ content, onChange }) => {
  const questions = field<Question[]>(content, 'questions', []);

  const setQuestions = (next: Question[]) => onChange({ ...content, questions: next });

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-ink-faint">Exactly 3 questions required for a Knowledge Check.</p>
      {questions.map((q, i) => (
        <QuestionEditor
          key={q.id}
          question={q}
          index={i}
          optionCount={{ min: 2 }}
          onChange={(next) => setQuestions(questions.map((existing, idx) => (idx === i ? next : existing)))}
        />
      ))}
      {questions.length < 3 && (
        <button
          onClick={() => setQuestions([...questions, makeEmptyQuestion()])}
          className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-accent/40 py-2 text-xs font-semibold text-accent hover:border-accent hover:bg-accent/5"
        >
          <Plus className="h-4 w-4" /> Add Question ({questions.length}/3)
        </button>
      )}
      {questions.length === 3 && <p className="text-center text-[11px] font-medium text-status-success">3 of 3 questions added</p>}
    </div>
  );
};

export const QuizEditor: React.FC<EditorProps> = ({ content, onChange }) => {
  const questions = field<Question[]>(content, 'questions', []);
  const setQuestions = (next: Question[]) => onChange({ ...content, questions: next });

  return (
    <div className="space-y-3">
      {questions.map((q, i) => (
        <QuestionEditor
          key={q.id}
          question={q}
          index={i}
          optionCount={{ min: 2 }}
          onChange={(next) => setQuestions(questions.map((existing, idx) => (idx === i ? next : existing)))}
        />
      ))}
      <button
        onClick={() => setQuestions([...questions, makeEmptyQuestion()])}
        className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-accent/40 py-2 text-xs font-semibold text-accent hover:border-accent hover:bg-accent/5"
      >
        <Plus className="h-4 w-4" /> Add Question
      </button>
    </div>
  );
};

// --- LESSON FLOW ---

export const NextLessonEditor: React.FC<EditorProps> = ({ content, onChange }) => (
  <div className="space-y-3">
    <div>
      <label className={label}>Button Label</label>
      <input
        className={input}
        value={field(content, 'label', 'Continue')}
        onChange={(e) => onChange({ ...content, label: e.target.value })}
      />
    </div>
    <div>
      <label className={label}>Unlock Condition</label>
      <select
        className={input}
        value={field(content, 'unlockCondition', 'COMPLETE_ALL_BLOCKS')}
        onChange={(e) => onChange({ ...content, unlockCondition: e.target.value })}
      >
        <option value="COMPLETE_ALL_BLOCKS">Automatic (all content viewed)</option>
        <option value="PASS_KNOWLEDGE_CHECKS">Requires passing knowledge checks</option>
        <option value="MANUAL">Always unlocked</option>
      </select>
    </div>
  </div>
);

export const BLOCK_EDITOR_MAP: Record<string, React.FC<EditorProps>> = {
  HERO_BANNER: HeroBannerEditor,
  VIDEO: VideoEditor,
  IMAGES: ImagesEditor,
  BANNER_IMAGE: BannerImageEditor,
  PDF: PdfEditor,
  RICH_TEXT: RichTextEditor,
  CALLOUT: CalloutEditor,
  IMAGE_TEXT: ImageTextEditor,
  KNOWLEDGE_CHECK: KnowledgeCheckEditor,
  QUIZ: QuizEditor,
  NEXT_LESSON: NextLessonEditor,
};
