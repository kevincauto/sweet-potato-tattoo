"use client";

import { useMemo, useState } from 'react';
import Image from 'next/image';
import GalleryModal from '@/components/GalleryModal';
import FlashCTA from '@/components/FlashCTA';
import { cloudinaryLoader, getStableCloudinaryUrl } from '@/lib/cloudinaryUrl';

interface BlobData {
  url: string;
  pathname?: string;
  size?: number;
  uploadedAt?: Date;
  rev?: string;
}

interface FlashGridProps {
  images: BlobData[];
  captionsMap: Record<string, string>;
  categoriesMap?: Record<string, string>;
  allImageUrls?: string[]; // All image URLs for the FlashCTA banner
  claimedMap?: Record<string, string | boolean>; // Map of claimed image URLs
}

export default function FlashGrid({ images, captionsMap, categoriesMap = {}, allImageUrls = [], claimedMap = {} }: FlashGridProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Internal category names (as stored in database)
  const internalCategories = ['All', 'Fauna Flash', 'Flora Flash', 'Sky Flash', 'Small Flash', 'Discount Flash'];
  
  // Display names for user-facing buttons
  const getDisplayName = (category: string): string => {
    const displayMap: Record<string, string> = {
      'All': 'All',
      'Fauna Flash': 'Animal Flash',
      'Flora Flash': 'Plant Flash',
      'Sky Flash': 'Sky Flash',
      'Small Flash': 'Small Flash',
      'Discount Flash': 'Discount Flash'
    };
    return displayMap[category] || category;
  };
  
  const categoryOptions = internalCategories;

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
      <div className="flex flex-col items-center mb-8">
        <div className="text-xl font-semibold text-[#7B894C] mb-4">Filter by Flash Category:</div>
        <div className="flex flex-wrap justify-center gap-3">
          {categoryOptions.map((opt) => {
            const isActive = selectedCategory === opt;
            return (
              <button
                key={opt}
                type="button"
                aria-pressed={isActive}
                onClick={() => setSelectedCategory(opt)}
                className={`px-5 py-2 rounded-full border text-base font-medium transition-colors ${
                  isActive
                    ? 'bg-[#7B894C] text-white border-[#7B894C]'
                    : 'bg-white text-[#414141] border-gray-300 hover:bg-gray-50'
                }`}
              >
                {getDisplayName(opt)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-6">
        {(() => {
          const chunks: Array<{ type: 'images' | 'banner'; items: typeof viewItems }> = [];
          const chunkSize = 24;
          
          // Split viewItems into chunks of 24
          for (let i = 0; i < viewItems.length; i += chunkSize) {
            const chunk = viewItems.slice(i, i + chunkSize);
            chunks.push({ type: 'images', items: chunk });
            
            // Add banner after each chunk only if there are at least 24 more images after it
            const remainingImages = viewItems.length - (i + chunkSize);
            if (remainingImages >= 24) {
              chunks.push({ type: 'banner', items: [] });
            }
          }
          
          return chunks.map((chunk, chunkIndex) => {
            if (chunk.type === 'banner') {
              return (
                <FlashCTA 
                  key={`banner-${chunkIndex}`} 
                  imageUrls={allImageUrls} 
                  variant="to-booking"
                  useStaticBackground={true}
                />
              );
            }
            
            return (
              <div 
                key={`images-${chunkIndex}`}
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
              >
                {chunk.items.map(({ blob, index }) => {
                  // Check if image is claimed (handle both boolean true and string 'true')
                  // Also check URL encoding variations
                  const urlVariations = new Set<string>([blob.url]);
                  try {
                    const decoded = decodeURIComponent(blob.url);
                    urlVariations.add(decoded);
                    urlVariations.add(encodeURI(decoded));
                  } catch {}
                  try {
                    const doubleEncoded = blob.url.replace(/%20/g, '%2520');
                    urlVariations.add(doubleEncoded);
                  } catch {}
                  
                  const isClaimed = Array.from(urlVariations).some(url => 
                    claimedMap[url] === true || claimedMap[url] === 'true'
                  );
                  
                  return (
                    <div 
                      key={index} 
                      className="relative group aspect-[5/6] overflow-hidden rounded-lg cursor-pointer"
                      onClick={() => openModal(index)}
                    >
                      <Image
                        src={getStableCloudinaryUrl(blob.url, blob.rev)}
                        loader={cloudinaryLoader}
                        alt={`Flash image ${index + 1}`}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover transition-all duration-300 group-hover:scale-105 group-hover:brightness-50"
                      />
                      {/* No CSS overlay needed - claimed images have overlay baked into the image */}
                      {captionsMap[blob.url] && !isClaimed && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4">
                          <p className="text-white text-sm text-center leading-relaxed drop-shadow-lg whitespace-pre-line">
                            {captionsMap[blob.url]}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          });
        })()}
      </div>

      {/* Modal */}
      {selectedImageIndex !== null && (
        (() => {
          const selected = images[selectedImageIndex];
          const url = selected?.url;

          // Determine claimed status for the selected image (handle URL encoding variations)
          const urlVariations = new Set<string>(url ? [url] : []);
          if (url) {
            try {
              const decoded = decodeURIComponent(url);
              urlVariations.add(decoded);
              urlVariations.add(encodeURI(decoded));
            } catch {}
            try {
              const doubleEncoded = url.replace(/%20/g, '%2520');
              urlVariations.add(doubleEncoded);
            } catch {}
          }

          const isClaimed = Array.from(urlVariations).some((u) => claimedMap[u] === true || claimedMap[u] === 'true');

          return (
        <GalleryModal
          allImages={images}
          allCaptions={captionsMap}
          currentIndex={selectedImageIndex}
          onClose={closeModal}
              ctaVariant={isClaimed ? 'email' : 'booking'}
        />
          );
        })()
      )}
    </>
  );
}
