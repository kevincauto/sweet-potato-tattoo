"use client";

import { useState } from 'react';
import Image from 'next/image';
import GalleryModal from '@/components/GalleryModal';
import { cloudinaryLoader, getStableCloudinaryUrl } from '@/lib/cloudinaryUrl';

interface BlobData {
  url: string;
  pathname?: string;
  size?: number;
  uploadedAt?: Date;
  rev?: string;
}

interface GalleryGridProps {
  images: BlobData[];
  captionsMap: Record<string, string>;
}

export default function GalleryGrid({ images, captionsMap }: GalleryGridProps) {
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
            className="relative group aspect-[5/6] overflow-hidden rounded-lg cursor-pointer"
            onClick={() => openModal(index)}
          >
            <Image
              src={getStableCloudinaryUrl(blob.url, blob.rev)}
              loader={cloudinaryLoader}
              alt={`Gallery image ${index + 1}`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
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
