'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';

interface ProductGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  photos: string[];
  initialIndex?: number;
}

export function ProductGalleryModal({
  isOpen,
  onClose,
  title,
  subtitle,
  photos,
  initialIndex = 0,
}: ProductGalleryModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }

  const handleNext = useCallback(() => {
    if (photos.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  }, [photos.length]);

  const handlePrev = useCallback(() => {
    if (photos.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  }, [photos.length]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleNext, handlePrev]);

  if (!isOpen) return null;

  const currentPhoto = photos[currentIndex] || photos[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/90 text-white z-10">
          <div>
            <h3 className="font-bold text-base text-slate-100">{title}</h3>
            {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-slate-800 text-slate-300">
              {photos.length > 0 ? `${currentIndex + 1} / ${photos.length}` : '0 / 0'}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Main Display */}
        <div className="relative flex-1 min-h-[350px] sm:min-h-[480px] bg-black flex items-center justify-center overflow-hidden">
          {currentPhoto ? (
            <Image
              src={currentPhoto}
              alt={`${title} - Photo ${currentIndex + 1}`}
              fill
              unoptimized
              className="object-contain"
            />
          ) : (
            <div className="text-center text-slate-500 py-12">
              <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No photos available</p>
            </div>
          )}

          {/* Left Arrow */}
          {photos.length > 1 && (
            <button
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white shadow-lg backdrop-blur-xs transition-transform hover:scale-110"
              title="Previous Photo"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {/* Right Arrow */}
          {photos.length > 1 && (
            <button
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white shadow-lg backdrop-blur-xs transition-transform hover:scale-110"
              title="Next Photo"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
        </div>

        {/* Thumbnail Selector Strip */}
        {photos.length > 1 && (
          <div className="p-3 bg-slate-950 border-t border-slate-800 overflow-x-auto flex items-center gap-2">
            {photos.map((p, idx) => (
              <button
                key={`${p}-${idx}`}
                onClick={() => setCurrentIndex(idx)}
                className={`relative w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                  currentIndex === idx
                    ? 'border-indigo-500 scale-105'
                    : 'border-slate-800 opacity-60 hover:opacity-100'
                }`}
              >
                <Image
                  src={p}
                  alt={`Thumbnail ${idx + 1}`}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
