'use client';

import { useState, useEffect } from 'react';
import type {
  PutBlobResult,
  ListBlobResult,
  ListBlobResultBlob,
} from '@vercel/blob';
import Image from 'next/image';

export default function AdminPage() {
  const [blob, setBlob] = useState<PutBlobResult | null>(null);
  const [images, setImages] = useState<ListBlobResult['blobs']>([]);

  async function fetchImages() {
    const response = await fetch('/api/upload');
    const data = (await response.json()) as ListBlobResult;
    setImages(data.blobs);
  }

  useEffect(() => {
    fetchImages();
  }, []);

  async function handleDelete(url: string) {
    await fetch(`/api/upload?url=${url}`, {
      method: 'DELETE',
    });
    fetchImages();
  }

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-4xl font-bold text-center my-8">Admin</h1>

      <form
        onSubmit={async (event) => {
          event.preventDefault();

          const file = (event.target as HTMLFormElement).file.files?.[0];

          if (!file) {
            return;
          }

          const response = await fetch(`/api/upload?filename=${file.name}`, {
            method: 'POST',
            body: file,
          });

          const newBlob = (await response.json()) as PutBlobResult;

          setBlob(newBlob);
          fetchImages();
        }}
        className="mb-8"
      >
        <input
          name="file"
          type="file"
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

      <h2 className="text-2xl font-bold mb-4">Uploaded Images</h2>
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