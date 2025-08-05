"use client";

import { useState } from 'react';
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

  const goToPrevious = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      goToPrevious();
    } else if (e.key === 'ArrowRight') {
      goToNext();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const currentImage = allImages[currentImageIndex];
  const currentCaption = allCaptions[currentImage.url] || '';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="relative max-w-4xl max-h-full">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-white text-2xl hover:text-gray-300 transition-colors"
          aria-label="Close modal"
        >
          ×
        </button>

        {/* Left arrow */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            goToPrevious();
          }}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 text-white text-3xl hover:text-gray-300 transition-colors bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center"
          aria-label="Previous image"
        >
          ‹
        </button>

        {/* Right arrow */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            goToNext();
          }}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 text-white text-3xl hover:text-gray-300 transition-colors bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center"
          aria-label="Next image"
        >
          ›
        </button>

        {/* Image container */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <Image
            src={currentImage.url}
            alt={`Gallery image ${currentImageIndex + 1}`}
            width={800}
            height={600}
            className="max-w-full max-h-[80vh] object-contain rounded-lg"
          />
          {currentCaption && (
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4 rounded-b-lg">
              <p className="text-sm leading-relaxed">{currentCaption}</p>
            </div>
          )}
        </div>

        {/* Image counter */}
        <div className="absolute bottom-4 left-4 text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
          {currentImageIndex + 1} / {allImages.length}
        </div>
      </div>
    </div>
  );
} 