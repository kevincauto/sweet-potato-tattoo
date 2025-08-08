"use client";

import { useMemo, useState } from 'react';
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
  categoriesMap?: Record<string, string>;
}

export default function FlashGrid({ images, captionsMap, categoriesMap = {} }: FlashGridProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const categoryOptions = ['All', 'Fauna Flash', 'Flora Flash', 'Sky Flash', 'Small Flash'];

  const viewItems = useMemo(() => {
    const withIndex = images.map((blob, index) => ({ blob, index }));
    const filtered = selectedCategory === 'All'
      ? withIndex
      : withIndex.filter(({ blob }) => (categoriesMap[blob.url] || '') === selectedCategory);
    return filtered;
  }, [images, selectedCategory, categoriesMap]);

  const openModal = (index: number) => {
    setSelectedImageIndex(index);
  };

  const closeModal = () => {
    setSelectedImageIndex(null);
  };

  return (
    <>
      {/* Filter control */}
      <div className="flex flex-col items-center mb-4">
        <div className="text-sm text-gray-700 mb-2">Filter By:</div>
        <div className="flex flex-wrap justify-center gap-2">
          {categoryOptions.map((opt) => {
            const isActive = selectedCategory === opt;
            return (
              <button
                key={opt}
                type="button"
                aria-pressed={isActive}
                onClick={() => setSelectedCategory(opt)}
                className={`px-3 py-1 rounded-full border text-sm transition-colors ${
                  isActive
                    ? 'bg-[#7B894C] text-white border-[#7B894C]'
                    : 'bg-white text-[#414141] border-gray-300 hover:bg-gray-50'
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {viewItems.map(({ blob, index }) => (
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
