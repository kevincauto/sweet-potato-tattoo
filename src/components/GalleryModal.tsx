"use client";

import { useState } from 'react';
import Image from 'next/image';

interface GalleryModalProps {
  imageUrl: string;
  caption: string;
  index: number;
}

export default function GalleryModal({ imageUrl, caption, index }: GalleryModalProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      {/* Gallery image with hover effects */}
      <div 
        className="relative group aspect-square overflow-hidden rounded-lg cursor-pointer"
        onClick={openModal}
      >
        <Image
          src={imageUrl}
          alt={`Gallery image ${index + 1}`}
          fill
          className="object-cover transition-all duration-300 group-hover:scale-105 group-hover:brightness-50"
        />
        {caption && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4">
            <p className="text-white text-sm text-center leading-relaxed drop-shadow-lg">
              {caption}
            </p>
          </div>
        )}
      </div>

      {/* Modal for enlarged image */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75"
          onClick={closeModal}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-10 text-white text-2xl hover:text-gray-300 transition-colors"
              aria-label="Close modal"
            >
              ×
            </button>
            <div className="relative">
              <Image
                src={imageUrl}
                alt={`Enlarged gallery image ${index + 1}`}
                width={800}
                height={600}
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              />
              {caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4 rounded-b-lg">
                  <p className="text-sm leading-relaxed">{caption}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
} 