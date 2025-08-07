'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { PutBlobResult } from '@vercel/blob';
import Link from 'next/link';
import DraggableImageGrid from '../../../components/DraggableImageGrid';

export default function FlashAdminPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [blob, setBlob] = useState<PutBlobResult | null>(null);
  interface ImgItem { url: string; caption?: string }
  const [images, setImages] = useState<ImgItem[]>([]);
  const [editingUrl, setEditingUrl] = useState<string | null>(null);
  const [tempCaption, setTempCaption] = useState('');

  const fetchImages = useCallback(async () => {
    const response = await fetch('/api/upload/flash');
    if (response.ok) {
      const data = (await response.json()) as { items: ImgItem[] };
      setImages(data.items);
    } else {
      setImages([]); // Clear images on error or if collection is empty
    }
  }, []);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  async function handleDelete(url: string) {
    try {
      const response = await fetch(`/api/upload/flash?url=${encodeURIComponent(url)}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Remove the image from local state instead of refetching
        setImages(prevImages => prevImages.filter(img => img.url !== url));
      } else {
        console.error('Failed to delete image');
        alert('Failed to delete image. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Error deleting image. Please try again.');
    }
  }

  async function handleEditCaption(url: string, caption: string) {
    await fetch(
      `/api/upload/flash?url=${encodeURIComponent(url)}&caption=${encodeURIComponent(caption)}`,
      { method: 'PUT' }
    );
    setImages((imgs) =>
      imgs.map((it) =>
        it.url === url ? { ...it, caption } : it
      )
    );
  }

  function handleReorder(newOrder: ImgItem[]) {
    setImages(newOrder);
  }

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-4xl font-bold text-center my-8">Flash Admin</h1>
      
      {/* Navigation */}
      <div className="flex justify-center gap-4 mb-6">
        <Link 
          href="/admin/flash" 
          className="px-4 py-2 rounded-lg border bg-blue-500 text-white"
        >
          Available Flash
        </Link>
        <Link 
          href="/admin/gallery" 
          className="px-4 py-2 rounded-lg border bg-white text-black hover:bg-gray-100"
        >
          Gallery
        </Link>
        <Link 
          href="/admin/faq" 
          className="px-4 py-2 rounded-lg border bg-white text-black hover:bg-gray-100"
        >
          FAQ
        </Link>
      </div>
      
      <form
        onSubmit={async (event) => {
          event.preventDefault();

          const form = event.target as HTMLFormElement;
          const files = form.file.files as FileList;

          if (!files || files.length === 0) return;

          for (const file of Array.from(files)) {
            const response = await fetch(
              `/api/upload/flash?filename=${encodeURIComponent(file.name)}`,
              {
                method: 'POST',
                body: file,
              }
            );

            if (response.ok) {
              const newBlob = (await response.json()) as PutBlobResult;
              setBlob(newBlob);
            } else {
              const errorText = await response.text();
              console.error('Upload failed:', errorText);
              alert(`Upload failed: ${errorText}`);
            }
          }

          fetchImages();
        }}
        className="mb-8"
      >
        <div className="flex items-center gap-2 mb-4">
          <input
            name="file"
            type="file"
            multiple
            required
            className="border rounded-lg p-2 flex-1"
            ref={fileRef}
          />
          <button
            type="submit"
            className="bg-blue-500 text-white p-2 rounded-lg px-6"
            onClick={(e) => {
              const files = fileRef.current?.files;
              if (!files || files.length === 0) {
                e.preventDefault();
                fileRef.current?.click();
              }
            }}
          >
            Upload
          </button>
        </div>
      </form>
      {blob && (
        <div className="mb-4">
          Blob url:{' '}
          <a
            href={blob.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            {blob.url}
          </a>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Available Flash Images</h2>
        <p className="text-sm text-gray-600">Drag and drop to reorder images</p>
      </div>
      
      <DraggableImageGrid
        images={images}
        onReorder={handleReorder}
        onDelete={handleDelete}
        onEditCaption={handleEditCaption}
        editingUrl={editingUrl}
        setEditingUrl={setEditingUrl}
        tempCaption={tempCaption}
        setTempCaption={setTempCaption}
        collection="flash"
      />
    </main>
  );
}
