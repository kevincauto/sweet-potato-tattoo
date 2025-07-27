/* eslint-disable @typescript-eslint/no-explicit-any */
import { kv } from '@vercel/kv';
import Image from 'next/image';

export const metadata = {
  title: 'Gallery',
};

export default async function GalleryPage() {
  const imageUrls = await kv.lrange('gallery-images', 0, -1);
  const captionsRaw = (await kv.hgetall<any>('captions')) as Record<string, string> | null;
  const captionsMap = captionsRaw ?? {};

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-4xl font-bold text-center my-8">Gallery</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {imageUrls.map((url, index) => (
          <div key={index} className="w-full h-auto flex flex-col items-center">
            <Image
              src={url as string}
              alt={`Gallery image ${index + 1}`}
              width={600}
              height={800}
              className="rounded-lg object-cover w-full"
            />
            {captionsMap[url as string] && (
              <p className="mt-1 text-sm text-center whitespace-pre-line">{captionsMap[url as string]}</p>
            )}
          </div>
        ))}
      </div>
    </main>
  );
} 