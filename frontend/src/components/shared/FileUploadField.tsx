import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, X, AlertCircle } from 'lucide-react';
import { uploadMediaApi, UploadedMedia } from '../../services/courseBuilder.service';

interface FileUploadFieldProps {
  accept: string; // e.g. 'image/*', 'video/*', 'application/pdf'
  kind: 'image' | 'video' | 'file';
  currentUrl?: string;
  currentFileName?: string;
  placeholder: string;
  helperText?: string;
  onUploaded: (result: UploadedMedia) => void;
  onClear?: () => void;
}

export const FileUploadField: React.FC<FileUploadFieldProps> = ({
  accept,
  kind,
  currentUrl,
  currentFileName,
  placeholder,
  helperText,
  onUploaded,
  onClear,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const result = await uploadMediaApi(file);
      onUploaded(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (currentUrl && !uploading) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-2.5 rounded-lg border border-surface-border bg-surface p-2.5">
          {kind === 'image' ? (
            <img src={currentUrl} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
          ) : kind === 'video' ? (
            <video src={currentUrl} className="h-10 w-16 shrink-0 rounded bg-charcoal object-cover" muted />
          ) : (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-accent/10 text-accent">
              <FileText className="h-4 w-4" />
            </span>
          )}
          <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-ink">{currentFileName || currentUrl}</span>
          <button
            onClick={() => inputRef.current?.click()}
            className="shrink-0 rounded border border-surface-border px-2 py-1 text-[10px] font-semibold text-ink-muted hover:border-accent hover:text-accent"
          >
            Replace
          </button>
          {onClear && (
            <button onClick={onClear} className="shrink-0 text-ink-faint hover:text-status-danger">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed p-5 text-center transition ${
          dragOver ? 'border-accent bg-accent/5' : 'border-surface-border bg-surface hover:border-accent/50'
        }`}
      >
        {uploading ? (
          <>
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            <span className="text-[11px] text-ink-muted">Uploading...</span>
          </>
        ) : (
          <>
            <UploadCloud className="h-5 w-5 text-ink-faint" />
            <span className="text-[11px] font-medium text-ink-muted">{placeholder}</span>
            {helperText && <span className="text-[10px] text-ink-faint">{helperText}</span>}
          </>
        )}
      </div>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
      {error && (
        <p className="flex items-center gap-1 text-[10px] text-status-danger">
          <AlertCircle className="h-3 w-3" /> {error}
        </p>
      )}
    </div>
  );
};
