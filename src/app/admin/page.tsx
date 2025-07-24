'use client';

import { useState, useEffect } from 'react';
import type {
  PutBlobResult,
  ListBlobResult,
  ListBlobResultBlob,
} from '@vercel/blob';
import Image from 'next/image';

export default function AdminPage() {
  const [collection, setCollection] = useState<'flash' | 'gallery'>('flash');
  const [blob, setBlob] = useState<PutBlobResult | null>(null);
  const [images, setImages] = useState<ListBlobResult['blobs']>([]);

  async function fetchImages(col: 'flash' | 'gallery' = collection) {
    const response = await fetch(`/api/upload/${col}`);
    if (response.ok) {
      const data = (await response.json()) as ListBlobResult;
      setImages(data.blobs);
    } else {
      setImages([]); // Clear images on error or if collection is empty
    }
  }

  useEffect(() => {
    fetchImages(collection);
  }, [collection]);

  async function handleDelete(url: string) {
    await fetch(`/api/upload/${collection}?url=${encodeURIComponent(url)}`, {
      method: 'DELETE',
    });
    fetchImages(collection);
  }

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-4xl font-bold text-center my-8">Admin</h1>
      {/* Collection toggle */}
      <div className="flex justify-center gap-4 mb-6">
        {['flash', 'gallery'].map((c) => (
          <button
            key={c}
            className={`px-4 py-2 rounded-lg border ${
              collection === c ? 'bg-blue-500 text-white' : 'bg-white'
            }`}
            onClick={() => setCollection(c as 'flash' | 'gallery')}
          >
            {c === 'flash' ? 'Available Flash' : 'Gallery'}
          </button>
        ))}
      </div>

      <form
        onSubmit={async (event) => {
          event.preventDefault();

          const files = (event.target as HTMLFormElement).file.files as FileList;
          if (!files || files.length === 0) return;

          for (const file of Array.from(files)) {
            const response = await fetch(
              `/api/upload/${collection}?filename=${encodeURIComponent(file.name)}`,
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
              alert(`Upload failed: ${errorText}`); // Also show an alert to make it obvious
            }
          }

          fetchImages(collection);
        }}
        className="mb-8"
      >
        <input
          name="file"
          type="file"
          multiple
          required
          className="border rounded-lg p-2 mr-2"
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded-lg">
          Upload
        </button>
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

      <h2 className="text-2xl font-bold mb-4">{collection === 'flash' ? 'Available Flash Images' : 'Gallery Images'}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image: ListBlobResultBlob) => (
          <div key={image.pathname} className="relative">
            <Image
              src={image.url}
              alt={image.pathname}
              width={300}
              height={200}
              className="rounded-lg object-cover w-full h-full"
            />
            <button
              onClick={() => handleDelete(image.url)}
              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </main>
  );
} 