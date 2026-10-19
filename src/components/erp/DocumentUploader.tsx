'use client';

import { useState, useRef, type ChangeEvent } from 'react';
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
  onChange: (url: string | undefined) => void;
  entityType: 'DEALERSHIP' | 'LAND' | 'PROPERTY' | 'AUCTION';
  label: string;
  helperText?: string;
  accept?: string;
}

export function DocumentUploader({
  documentUrl,
  onChange,
  entityType,
  label,
  helperText,
  accept = '.pdf,image/jpeg,image/png',
}: DocumentUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const result = await uploadDocumentFile(file, {
        entityType,
      });
      onChange(result.url);
    } catch (err) {
      console.error('Document upload failed:', err);
      alert('Failed to upload document. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    onChange(undefined);
  };

  const fileName = documentUrl ? documentUrl.split('/').pop() : '';

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
        <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 text-xs">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <FileText className="h-5 w-5 text-emerald-600 shrink-0" />
            <div className="truncate">
              <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                {fileName || 'Document Attached'}
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 dark:text-emerald-400">
                <CheckCircle className="h-3 w-3" />
                <span>Ready &amp; Verified</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={documentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300"
            >
              <ExternalLink className="h-3 w-3" />
              <span>View</span>
            </a>
            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
              title="Remove Document"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex-1 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-xl p-3 text-center transition-colors bg-white dark:bg-slate-900"
          >
            {isUploading ? (
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-indigo-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Uploading document...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                <Upload className="h-3.5 w-3.5 text-indigo-500" />
                <span>Attach Cadastral Plan or Legal Document (PDF / Scan)</span>
              </div>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
