'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { stripCloudinaryVersion, withCacheBuster } from '@/lib/cloudinaryUrl';

// Helper function to convert ET ISO string to datetime-local format
// The datetime-local input will show the ET time directly (user needs to think in ET)
function convertETToLocalDateTime(etISO: string): string {
  const etDate = new Date(etISO);
  if (isNaN(etDate.getTime())) return '';
  
  // Extract date components from the ET date
  const year = etDate.getFullYear();
  const month = String(etDate.getMonth() + 1).padStart(2, '0');
  const day = String(etDate.getDate()).padStart(2, '0');
  const hours = String(etDate.getHours()).padStart(2, '0');
  const minutes = String(etDate.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Helper function to convert datetime-local input to ET ISO string
// We interpret the input as ET time (user should enter ET time)
function convertLocalDateTimeToET(localDateTime: string): string {
  try {
    const [datePart, timePart] = localDateTime.split('T');
    if (!datePart || !timePart) {
      throw new Error('Invalid datetime format');
    }
    
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);
    
    if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hours) || isNaN(minutes)) {
      throw new Error('Invalid date/time components');
    }
    
    // Create a date string in the format: YYYY-MM-DDTHH:mm:00
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
    
    // Create a date object from the input (treats as local timezone)
    const localDate = new Date(dateStr);
    
    if (isNaN(localDate.getTime())) {
      throw new Error('Invalid date');
    }
    
    // Get what this time represents in ET timezone
    const etTimeStr = localDate.toLocaleString('en-US', { 
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    // Parse the ET time string
    // Format: "MM/DD/YYYY, HH:mm:ss" or "M/D/YYYY, H:mm:ss"
    const parts = etTimeStr.split(', ');
    if (parts.length !== 2) {
      // Fallback: use the input directly as ET time
      return new Date(dateStr).toISOString();
    }
    
    const [datePartET, timePartET] = parts;
    if (!datePartET || !timePartET) {
      return new Date(dateStr).toISOString();
    }
    
    const [monthDayYear, time] = datePartET.split(' ');
    if (!monthDayYear || !time) {
      return new Date(dateStr).toISOString();
    }
    
    const [m, d, y] = monthDayYear.split('/');
    const [h, min, sec] = time.split(':');
    
    if (!m || !d || !y || !h || !min || !sec) {
      return new Date(dateStr).toISOString();
    }
    
    // Create ISO string for ET time
    // We'll store this as UTC, but it represents ET time
    // On server, we'll compare by converting current time to ET
    const etISO = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T${h.padStart(2, '0')}:${min.padStart(2, '0')}:${sec.padStart(2, '0')}Z`;
    return etISO;
  } catch (error) {
    console.error('Error converting datetime to ET:', error);
    // Fallback: return ISO string from input
    const [datePart, timePart] = localDateTime.split('T');
    if (datePart && timePart) {
      const [year, month, day] = datePart.split('-').map(Number);
      const [hours, minutes] = timePart.split(':').map(Number);
      return new Date(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`).toISOString();
    }
    return new Date().toISOString();
  }
}

interface ImgItem {
  url: string;
  caption?: string;
  category?: string;
  schedule?: string;
  hidden?: string | boolean; // 'true' or true if hidden indefinitely
  claimed?: string | boolean; // 'true' or true if claimed/booked
  rev?: string; // cache-buster revision for overwritten images
}

interface DraggableImageGridProps {
  images: ImgItem[];
  onReorder: (newOrder: ImgItem[]) => void;
  onDelete: (url: string) => void;
  onEditCaption: (url: string, caption: string) => void;
  onEditCategory?: (url: string, category: string) => void;
  onEditSchedule?: (url: string, schedule: string) => void;
  onToggleHidden?: (url: string, hidden: boolean) => void;
  onToggleClaimed?: (url: string, claimed: boolean) => void;
  editingUrl: string | null;
  setEditingUrl: (url: string | null) => void;
  tempCaption: string;
  setTempCaption: (caption: string) => void;
  collection: 'flash' | 'gallery';
  categories?: string[];
  showCategoryControl?: boolean;
}

export default function DraggableImageGrid({
  images,
  onReorder,
  onDelete,
  onEditCaption,
  onEditCategory,
  onEditSchedule,
  onToggleHidden,
  onToggleClaimed,
  editingUrl,
  setEditingUrl,
  tempCaption,
  setTempCaption,
  collection,
  categories = [],
  showCategoryControl = false
}: DraggableImageGridProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragRef = useRef<HTMLDivElement | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.outerHTML);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newImages = [...images];
    const [draggedItem] = newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, draggedItem);

    handleReorder(newImages);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const saveOrder = async (newOrder: ImgItem[]) => {
    try {
      const response = await fetch(`/api/upload/${collection}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          urls: newOrder.map(item => item.url)
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save order');
      }
    } catch (error) {
      console.error('Error saving order:', error);
      alert('Failed to save the new order. Please try again.');
    }
  };

  const handleReorder = (newOrder: ImgItem[]) => {
    onReorder(newOrder);
    saveOrder(newOrder);
  };

  const handleDeleteClick = (url: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this image? This action cannot be undone.'
    );
    
    if (confirmed) {
      onDelete(url);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {images?.map((image, index) => (
        <div
          key={image.url}
          ref={dragRef}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
          className={`relative flex flex-col items-center cursor-move transition-all duration-200 ${
            draggedIndex === index ? 'opacity-50 scale-95' : ''
          } ${
            dragOverIndex === index && draggedIndex !== index ? 'border-2 border-blue-500 border-dashed' : ''
          }`}
        >
          <div className="absolute top-2 left-2 bg-gray-800 bg-opacity-75 text-white text-xs px-2 py-1 rounded z-10">
            {index + 1}
          </div>
          <Image
            key={`${image.url}-${image.rev ?? ''}`}
            // Admin: avoid Vercel Image Optimization usage (keep `unoptimized`),
            // but still force refresh after an overwrite by appending `rev`.
            // Use the versioned URL here (don’t strip Cloudinary version) to avoid
            // any potential versionless redirect caching behavior.
            src={withCacheBuster(image.url, image.rev)}
            alt={image.caption ?? 'image'}
            width={300}
            height={200}
            className="rounded-lg object-cover w-full" 
            // Keep admin thumbnails out of Vercel Image Optimization quota.
            unoptimized
          />
          {editingUrl === image.url ? (
            <textarea
              value={tempCaption}
              rows={3}
              autoFocus
              onChange={(e) => setTempCaption(e.target.value)}
              onBlur={() => {
                onEditCaption(image.url, tempCaption);
                setEditingUrl(null);
              }}
              className="text-xs w-full mt-1 bg-transparent border rounded p-1"
            />
          ) : (
            <p
              className="text-xs text-center mt-1 whitespace-pre-line cursor-pointer"
              title={image.caption}
              onClick={() => {
                setEditingUrl(image.url);
                setTempCaption(image.caption || '');
              }}
            >
              {image.caption || 'Add caption'}
            </p>
          )}
          {/* Copy URL button */}
          <div className="w-full mt-1">
            <button
              onClick={(e) => {
                // Copy a versionless URL so the link always resolves to the latest (overwritten) asset.
                navigator.clipboard.writeText(stripCloudinaryVersion(image.url));

                // Optional: Show a brief confirmation
                const button = e.currentTarget;
                const originalText = button.textContent;
                button.textContent = 'Copied!';
                setTimeout(() => {
                  button.textContent = originalText;
                }, 1000);
              }}
              className="w-full bg-gray-500 text-white text-[10px] px-2 py-1 rounded hover:bg-gray-600 transition-colors"
              title="Copy image URL to clipboard"
            >
              Copy Image URL
            </button>
          </div>
          {/* Category control for flash collection */}
          {showCategoryControl && collection === 'flash' && (
            <div className="w-full mt-1">
              <select
                className="w-full text-[11px] border rounded p-1"
                value={image.category || ''}
                onChange={(e) => onEditCategory && onEditCategory(image.url, e.target.value)}
              >
                <option value="">No category</option>
                {categories.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          )}
          {/* Schedule control for flash collection */}
          {collection === 'flash' && onEditSchedule && (
            <div className="w-full mt-1">
              <label className="text-[10px] text-gray-600 block mb-1">
                Hide image until (Eastern Time):
              </label>
              <input
                type="datetime-local"
                className="w-full text-[11px] border rounded p-1"
                value={image.schedule ? convertETToLocalDateTime(image.schedule) : ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value) {
                    // Convert datetime-local input to ET ISO string
                    // Note: datetime-local is in user's local time, but we interpret as ET
                    const etISO = convertLocalDateTimeToET(value);
                    onEditSchedule(image.url, etISO);
                  } else {
                    // Clear schedule
                    onEditSchedule(image.url, '');
                  }
                }}
                onBlur={(e) => {
                  // Also save on blur (when user clicks away)
                  const value = e.target.value;
                  if (value) {
                    const etISO = convertLocalDateTimeToET(value);
                    onEditSchedule(image.url, etISO);
                  }
                }}
                title="Enter time in Eastern Time (ET/EDT). The picker shows your local time, but enter the ET time you want. Changes save automatically when you select a date/time."
              />
              {image.schedule && (
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[9px] text-green-600" title={`Scheduled until: ${image.schedule}`}>
                    ✓ Scheduled until {image.schedule ? new Date(image.schedule).toLocaleString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : ''} ET
                  </span>
                  <button
                    type="button"
                    onClick={() => onEditSchedule(image.url, '')}
                    className="text-[9px] text-red-600 hover:text-red-800"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          )}
          {/* Hide indefinitely control for flash collection */}
          {collection === 'flash' && onToggleHidden && (
            <div className="w-full mt-1 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                id={`hidden-${image.url}`}
                checked={image.hidden === 'true' || image.hidden === true}
                onChange={(e) => {
                  e.stopPropagation();
                  onToggleHidden(image.url, e.target.checked);
                }}
                className="w-4 h-4 text-[#7B894C] border-gray-300 rounded focus:ring-[#7B894C] cursor-pointer"
              />
              <label
                htmlFor={`hidden-${image.url}`}
                className="text-[10px] text-gray-600 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                }}
                title="Hide this image from the live site indefinitely. The image URL will still work for emails/links, but it won't appear on the home page."
              >
                Hide indefinitely (keeps URL active)
              </label>
            </div>
          )}
          {/* Claimed control for flash collection */}
          {collection === 'flash' && onToggleClaimed && (
            <div className="w-full mt-1" onClick={(e) => e.stopPropagation()}>
              {image.claimed === 'processing' ? (
                <button
                  type="button"
                  disabled
                  className="w-full bg-gray-300 text-gray-700 px-3 py-2 rounded-lg text-xs cursor-not-allowed flex items-center justify-center gap-2"
                  title="Processing..."
                >
                  <span className="inline-block h-3 w-3 rounded-full border-2 border-gray-500 border-t-transparent animate-spin" />
                  Processing…
                </button>
              ) : image.claimed === 'true' || image.claimed === true ? (
                <div className="space-y-1">
                  <div className="text-[10px] text-gray-600 text-center py-1">
                    ✓ Design is marked as claimed
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleClaimed(image.url, false);
                    }}
                    className="w-full bg-white text-red-700 border border-red-300 px-3 py-2 rounded-lg text-xs hover:bg-red-50 transition-colors"
                    title="Mark this design as unclaimed (availability). Note: this does not remove the diagonal stripe overlay from the image."
                  >
                    Mark as unclaimed
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleClaimed(image.url, true);
                  }}
                  className="w-full bg-[#7B894C] text-white px-3 py-2 rounded-lg text-xs hover:bg-[#6A7A3F] transition-colors"
                  title="Mark this design as claimed. This will permanently edit the image by adding a diagonal stripe overlay and cannot be undone."
                >
                  Mark design as claimed
                </button>
              )}
            </div>
          )}
          <button
            onClick={() => handleDeleteClick(image.url)}
            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full z-10 hover:bg-red-600 transition-colors"
            title="Delete image"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}
