import { kv } from '@vercel/kv';
import Image from 'next/image';

export const metadata = {
  title: 'Gallery',
};

export default async function GalleryPage() {
  const imageUrls = await kv.lrange('images', 0, -1);

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-4xl font-bold text-center my-8">Gallery</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {imageUrls.map((url, index) => (
          <div key={index} className="w-full h-auto">
            <Image
              src={url as string}
              alt={`Gallery image ${index + 1}`}
              width={600}
              height={800}
              className="rounded-lg object-cover w-full h-full"
            />
          </div>
        ))}
      </div>
    </main>
  );
} 