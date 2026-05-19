import { useEffect, useCallback } from 'react';
import type { ApartmentImage } from './api';
import AuthenticatedImage from './AuthenticatedImage';

interface ImageLightboxProps {
  images: ApartmentImage[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

export default function ImageLightbox({
  images,
  index,
  onClose,
  onIndexChange,
}: ImageLightboxProps) {
  const goPrev = useCallback(() => {
    onIndexChange((index - 1 + images.length) % images.length);
  }, [index, images.length, onIndexChange]);

  const goNext = useCallback(() => {
    onIndexChange((index + 1) % images.length);
  }, [index, images.length, onIndexChange]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goPrev();
      if (e.key === 'ArrowLeft') goNext();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose, goPrev, goNext]);

  if (images.length === 0) return null;

  const current = images[index];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-5 left-5 z-10 text-white/80 hover:text-white text-2xl font-bold w-10 h-10 rounded-full bg-white/10 flex items-center justify-center transition"
        aria-label="סגור"
      >
        ✕
      </button>

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white bg-white/10 hover:bg-white/20 w-12 h-12 rounded-full text-2xl font-bold transition"
            aria-label="תמונה הבאה"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white bg-white/10 hover:bg-white/20 w-12 h-12 rounded-full text-2xl font-bold transition"
            aria-label="תמונה קודמת"
          >
            ›
          </button>
        </>
      )}

      <div
        className="max-w-[min(92vw,1100px)] max-h-[85vh] flex flex-col items-center gap-3 px-16"
        onClick={(e) => e.stopPropagation()}
      >
        <AuthenticatedImage
          path={current.url}
          alt={current.originalFilename}
          className="max-h-[78vh] w-auto max-w-full object-contain rounded-2xl shadow-2xl"
        />
        <p className="text-white/70 text-xs font-medium">
          {index + 1} / {images.length} — {current.originalFilename}
        </p>
      </div>
    </div>
  );
}
