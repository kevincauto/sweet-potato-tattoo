/* eslint-disable @typescript-eslint/no-explicit-any */
import { kv } from '@vercel/kv';
import { list } from '@vercel/blob';
import Image from 'next/image';

export const metadata = {
  title: 'Gallery',
};

export default async function GalleryPage() {
  // Get URLs from KV
  const imageUrls = await kv.lrange('gallery-images', 0, -1);
  
  // Get all blobs and filter to only those that exist in both KV and blob storage
  const { blobs } = await list();
  const existingBlobs = blobs.filter((b) => imageUrls.includes(b.url));
  
  // Get captions for existing blobs
  const captionsRaw = (await kv.hgetall<any>('captions')) as Record<string, string> | null;
  const captionsMap = captionsRaw ?? {};

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-4xl font-bold text-center my-8">Gallery</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {existingBlobs.map((blob, index) => (
          <div key={index} className="w-full h-auto flex flex-col items-center">
            <Image
              src={blob.url}
              alt={`Gallery image ${index + 1}`}
              width={600}
              height={800}
              className="rounded-lg object-cover w-full"
            />
            {captionsMap[blob.url] && (
              <p className="mt-1 text-sm text-center whitespace-pre-line">{captionsMap[blob.url]}</p>
            )}
          </div>
        ))}
      </div>
    </main>
  );
} 