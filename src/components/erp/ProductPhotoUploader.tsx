'use client';

import { useState, useRef, type ChangeEvent } from 'react';
import Image from 'next/image';
import { uploadProductPhoto } from '@/lib/utils/uploader';
import {
  Upload,
  Camera,
  Trash2,
  Star,
  CheckCircle2,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';

interface ProductPhotoUploaderProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  entityType: 'DEALERSHIP' | 'LAND' | 'PROPERTY' | 'AUCTION';
  maxPhotos?: number;
  label?: string;
  helperText?: string;
}

export function ProductPhotoUploader({
  photos,
  onChange,
  entityType,
  maxPhotos = 10,
  label = 'Product Photos & Gallery',
  helperText = 'Upload multiple high-resolution photos. The first photo will be used as the primary showroom cover.',
}: ProductPhotoUploaderProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [compressionStatus, setCompressionStatus] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const handleFilesSelected = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxPhotos - photos.length;
    if (remainingSlots <= 0) {
      alert(`Maximum of ${maxPhotos} photos reached.`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    setIsProcessing(true);
    setCompressionStatus(`Compressing & processing ${filesToUpload.length} image(s)...`);

    try {
      const newUrls: string[] = [];

      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        setCompressionStatus(`Compressing image ${i + 1} of ${filesToUpload.length} (${file.name})...`);

        const result = await uploadProductPhoto(file, {
          entityType,
          isPrimary: photos.length === 0 && i === 0,
        });

        newUrls.push(result.url);
      }

      onChange([...photos, ...newUrls]);
    } catch (err) {
      console.error('Photo upload failed:', err);
      alert('Failed to upload some images. Please try again.');
    } finally {
      setIsProcessing(false);
      setCompressionStatus(null);
      // reset inputs
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    const updated = photos.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
  };

  const handleSetPrimary = (indexToPrimary: number) => {
    if (indexToPrimary === 0) return;
    const selected = photos[indexToPrimary];
    const rest = photos.filter((_, idx) => idx !== indexToPrimary);
    onChange([selected, ...rest]);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
            {label}{' '}
            <span className="font-normal text-slate-500">
              ({photos.length}/{maxPhotos})
            </span>
          </label>
          {helperText && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {helperText}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* File Picker */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFilesSelected}
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            disabled={isProcessing || photos.length >= maxPhotos}
          />

          {/* Camera Capture Input (Mobile friendly) */}
          <input
            type="file"
            ref={cameraInputRef}
            onChange={handleFilesSelected}
            accept="image/*"
            capture="environment"
            className="hidden"
            disabled={isProcessing || photos.length >= maxPhotos}
          />

          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={isProcessing || photos.length >= maxPhotos}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-50 transition-colors"
          >
            <Camera className="h-3.5 w-3.5 text-indigo-500" />
            <span>Take Photo</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing || photos.length >= maxPhotos}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition-colors shadow-2xs"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Upload Photos</span>
          </button>
        </div>
      </div>

      {/* Progress / Status Notice */}
      {isProcessing && (
        <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center gap-2 text-xs font-medium text-indigo-700 dark:text-indigo-300 animate-pulse">
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          <span>{compressionStatus || 'Compressing & uploading photos...'}</span>
        </div>
      )}

      {/* Photos Thumbnail Grid */}
      {photos.length === 0 ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center hover:border-indigo-500 dark:hover:border-indigo-500 cursor-pointer bg-slate-50/50 dark:bg-slate-900/50 transition-colors"
        >
          <ImageIcon className="h-8 w-8 text-slate-400 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
            No photos uploaded yet
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Click to browse files or tap &quot;Take Photo&quot; to capture live via camera. Auto-compressed for instant loading.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {photos.map((url, idx) => (
            <div
              key={`${url}-${idx}`}
              className={`relative group rounded-xl overflow-hidden border bg-slate-100 dark:bg-slate-800 aspect-square shadow-2xs transition-all ${
                idx === 0
                  ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <Image
                src={url}
                alt={`Photo ${idx + 1}`}
                fill
                unoptimized
                className="object-cover"
              />

              {/* Cover Badge */}
              {idx === 0 && (
                <div className="absolute top-1.5 left-1.5 z-10">
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-indigo-600 text-white shadow-xs flex items-center gap-1">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    Cover
                  </span>
                </div>
              )}

              {/* Hover Actions */}
              <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                {idx !== 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetPrimary(idx);
                    }}
                    title="Make Cover Photo"
                    className="p-1.5 rounded-lg bg-white/90 text-slate-900 hover:bg-white text-xs font-semibold shadow-xs"
                  >
                    <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemovePhoto(idx);
                  }}
                  title="Remove Photo"
                  className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 text-xs shadow-xs"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Index Number */}
              <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-mono">
                #{idx + 1}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
