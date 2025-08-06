"use client";

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

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
}

export default function GalleryModal({ allImages, allCaptions, currentIndex, onClose }: GalleryModalProps) {
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-80"
      onClick={onClose}
    >
      {/* Modal Content */}
      <div 
        className="relative flex flex-col max-w-4xl w-full max-h-[90vh] bg-[#1a1a1a] rounded-lg shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image Display Area */}
        <div className="relative flex-1 flex items-center justify-center overflow-hidden p-4">
          <Image
            src={currentImage.url}
            alt={currentCaption || `Gallery image ${currentImageIndex + 1}`}
            width={0}
            height={0}
            sizes="100vw"
            className="max-w-full max-h-full w-auto h-auto object-contain rounded"
            priority
          />
        </div>

        {/* Caption and Counter */}
        {(currentCaption || allImages.length > 0) && (
          <div className="flex-shrink-0 text-white p-4 border-t border-gray-700 flex justify-between items-center gap-4">
            <p className="text-sm leading-relaxed flex-grow">{currentCaption}</p>
            <div className="text-sm font-mono flex-shrink-0">
              {currentImageIndex + 1} / {allImages.length}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute top-4 right-4 z-20 text-white text-4xl hover:text-gray-300 transition-opacity"
        aria-label="Close modal"
      >
        ×
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
        className="absolute left-4 sm:left-8 top-1/2 transform -translate-y-1/2 z-10 text-white text-3xl hover:text-gray-300 transition-colors bg-black bg-opacity-30 hover:bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center"
        aria-label="Previous image"
      >
        ‹
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); goToNext(); }}
        className="absolute right-4 sm:right-8 top-1/2 transform -translate-y-1/2 z-10 text-white text-3xl hover:text-gray-300 transition-colors bg-black bg-opacity-30 hover:bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center"
        aria-label="Next image"
      >
        ›
      </button>
    </div>
  );
}
