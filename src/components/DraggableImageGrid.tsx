'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';

interface ImgItem {
  url: string;
  caption?: string;
}

interface DraggableImageGridProps {
  images: ImgItem[];
  onReorder: (newOrder: ImgItem[]) => void;
  onDelete: (url: string) => void;
  onEditCaption: (url: string, caption: string) => void;
  editingUrl: string | null;
  setEditingUrl: (url: string | null) => void;
  tempCaption: string;
  setTempCaption: (caption: string) => void;
  collection: 'flash' | 'gallery';
}

export default function DraggableImageGrid({
  images,
  onReorder,
  onDelete,
  onEditCaption,
  editingUrl,
  setEditingUrl,
  tempCaption,
  setTempCaption,
  collection
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

    onReorder(newImages);
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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {images.map((image, index) => (
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
            src={image.url}
            alt={image.caption ?? 'image'}
            width={300}
            height={200}
            className="rounded-lg object-cover w-full" 
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
          <button
            onClick={() => onDelete(image.url)}
            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full z-10"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}
