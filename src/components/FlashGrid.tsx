"use client";

import { useState } from 'react';
import Image from 'next/image';
import GalleryModal from '@/components/GalleryModal';

interface BlobData {
  url: string;
  pathname?: string;
  size?: number;
  uploadedAt?: Date;
}

interface FlashGridProps {
  images: BlobData[];
  captionsMap: Record<string, string>;
}

export default function FlashGrid({ images, captionsMap }: FlashGridProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const openModal = (index: number) => {
    setSelectedImageIndex(index);
  };

  const closeModal = () => {
    setSelectedImageIndex(null);
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {images.map((blob: BlobData, index: number) => (
          <div 
            key={index} 
            className="relative group aspect-square overflow-hidden rounded-lg cursor-pointer"
            onClick={() => openModal(index)}
          >
            <Image
              src={blob.url}
              alt={`Flash image ${index + 1}`}
              fill
              className="object-cover transition-all duration-300 group-hover:scale-105 group-hover:brightness-50"
            />
            {captionsMap[blob.url] && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4">
                <p className="text-white text-sm text-center leading-relaxed drop-shadow-lg whitespace-pre-line">
                  {captionsMap[blob.url]}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedImageIndex !== null && (
        <GalleryModal
          allImages={images}
          allCaptions={captionsMap}
          currentIndex={selectedImageIndex}
          onClose={closeModal}
        />
      )}
    </>
  );
}
