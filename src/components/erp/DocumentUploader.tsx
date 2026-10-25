'use client';

import { useState, useRef, type ChangeEvent, type DragEvent, type MouseEvent } from 'react';
import { uploadDocumentFile } from '@/lib/utils/uploader';
import {
  FileText,
  Upload,
  Trash2,
  ExternalLink,
  Loader2,
  CheckCircle,
} from 'lucide-react';

interface DocumentUploaderProps {
  documentUrl?: string;
  onChange: (url: string | undefined, fileName?: string) => void;
  entityType: 'DEALERSHIP' | 'LAND' | 'PROPERTY' | 'AUCTION';
  label: string;
  helperText?: string;
  accept?: string;
  buttonText?: string;
  fileName?: string;
}

function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function DocumentUploader({
  documentUrl,
  onChange,
  entityType,
  label,
  helperText,
  accept = '.pdf,image/jpeg,image/png,image/webp',
  buttonText,
  fileName: propFileName,
}: DocumentUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [internalFileName, setInternalFileName] = useState('');
  const [internalFileSize, setInternalFileSize] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const processFile = async (file: File) => {
    setIsUploading(true);
    setInternalFileName(file.name);
    setInternalFileSize(formatFileSize(file.size));

    try {
      const result = await uploadDocumentFile(file, {
        entityType,
      });
      onChange(result.url, file.name);
    } catch (err) {
      console.error('Document upload failed:', err);
      alert('Failed to upload document. Please try again.');
      setInternalFileName('');
      setInternalFileSize('');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isUploading) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (isUploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleRemove = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setInternalFileName('');
    setInternalFileSize('');
    onChange(undefined, undefined);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleView = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!documentUrl) return;

    if (documentUrl.startsWith('data:')) {
      try {
        const [header, base64Data] = documentUrl.split(',');
        const mimeMatch = header.match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mime });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
      } catch (err) {
        console.error('Failed to open data URL blob:', err);
        const win = window.open('', '_blank');
        if (win) {
          win.document.write(
            `<iframe src="${documentUrl}" frameborder="0" style="position:fixed; top:0; left:0; bottom:0; right:0; width:100%; height:100%; border:none; margin:0; padding:0; overflow:hidden; z-index:999999;" allowfullscreen></iframe>`
          );
        }
      }
    } else {
      window.open(documentUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const displayFileName =
    propFileName ||
    internalFileName ||
    (documentUrl && !documentUrl.startsWith('data:')
      ? decodeURIComponent(documentUrl.split('/').pop()?.split('?')[0] || '')
      : 'Attached Legal Document');

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
        {label}
      </label>
      {helperText && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          {helperText}
        </p>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        className="hidden"
        disabled={isUploading}
      />

      {documentUrl ? (
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/60 dark:bg-emerald-950/30 text-xs shadow-2xs">
          <div className="flex items-center gap-3 overflow-hidden min-w-0">
            <div className="h-9 w-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
            </div>
            <div className="truncate min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
                  {displayFileName}
                </p>
                {internalFileSize && (
                  <span className="text-[10px] text-slate-500 font-mono shrink-0">
                    ({internalFileSize})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                <CheckCircle className="h-3 w-3 shrink-0" />
                <span>Ready &amp; Verified</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-3">
            <button
              type="button"
              onClick={handleView}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-2xs transition-colors cursor-pointer"
              title="View document"
            >
              <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
              <span>View</span>
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-100/60 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
              title="Remove Document"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`group relative flex flex-col items-center justify-center p-5 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 ring-2 ring-indigo-400'
              : 'border-slate-300 dark:border-slate-700 hover:border-indigo-500/80 bg-white dark:bg-slate-900/60 hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
          } ${isUploading ? 'pointer-events-none opacity-80' : ''}`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 py-2 text-indigo-600 dark:text-indigo-400">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
              <p className="text-xs font-semibold">Uploading &amp; verifying document...</p>
              <p className="text-[11px] text-slate-400">Storing in offline IndexedDB ledger</p>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center gap-1.5 py-1">
              <div className="h-9 w-9 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Upload className="h-4 w-4" />
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {buttonText || 'Attach Document (PDF or Scanned Image)'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Drag &amp; drop file here, or <span className="text-indigo-600 dark:text-indigo-400 font-semibold underline underline-offset-2">browse files</span> (PDF, PNG, JPG up to 25MB)
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
