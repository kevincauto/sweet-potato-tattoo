"use client";

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface BlobData {
  url: string;
  pathname?: string;
  size?: number;
  uploadedAt?: Date;
}

interface GalleryModalProps {
  allImages: BlobData[];
  allCaptions: Record<string, string>;
  currentIndex: number;
  onClose: () => void;
  showBookingButton?: boolean;
}

export default function GalleryModal({ allImages, allCaptions, currentIndex, onClose, showBookingButton = false }: GalleryModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(currentIndex);

  const goToPrevious = useCallback(() => {
    setCurrentImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  }, [allImages.length]);

  const goToNext = useCallback(() => {
    setCurrentImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  }, [allImages.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [goToPrevious, goToNext, onClose]);

  const currentImage = allImages[currentImageIndex];
  const currentCaption = allCaptions[currentImage.url] || '';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-90"
      onClick={onClose}
    >
      {/* Modal Content container */}
      <div 
        className="relative flex flex-col w-full h-full max-w-6xl max-h-[95vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image container */}
        <div className="relative flex-1 w-full">
          <Image
            src={currentImage.url}
            alt={currentCaption || `Gallery image ${currentImageIndex + 1}`}
            fill
            className="object-contain"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>

        {/* Caption, Counter, and Booking Button */}
        <div className="flex-shrink-0 text-white p-3 text-center bg-black bg-opacity-20">
          {currentCaption && (
            <p className="text-sm leading-relaxed whitespace-pre-line mb-3">{currentCaption}</p>
          )}
          {showBookingButton && (
            <Link
              href="/booking"
              className="inline-block bg-[#7B894C] text-white text-center py-2 px-6 rounded-lg hover:bg-[#6A7A3F] transition-colors text-sm font-medium mb-3"
              onClick={(e) => e.stopPropagation()}
            >
              Book An Appointment
            </Link>
          )}
          {allImages.length > 1 && (
            <div className="text-xs text-gray-400 pt-1">
              {currentImageIndex + 1} / {allImages.length}
            </div>
          )}
        </div>
      </div>

      {/* Close Button */}
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute top-2 right-2 sm:top-4 sm:right-4 z-20 text-white text-4xl hover:text-gray-300 transition-opacity"
        aria-label="Close modal"
      >
        ×
      </button>

      {/* Prev Button */}
      {allImages.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 text-white text-3xl hover:text-gray-300 bg-black/30 hover:bg-black/50 rounded-full w-12 h-12 flex items-center justify-center transition-all"
          aria-label="Previous image"
        >
          ‹
        </button>
      )}
      
      {/* Next Button */}
      {allImages.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); goToNext(); }}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 text-white text-3xl hover:text-gray-300 bg-black/30 hover:bg-black/50 rounded-full w-12 h-12 flex items-center justify-center transition-all"
          aria-label="Next image"
        >
          ›
        </button>
      )}
    </div>
  );
}
