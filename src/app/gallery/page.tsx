/* eslint-disable @typescript-eslint/no-explicit-any */
import Image from 'next/image';

export const metadata = {
  title: 'Gallery',
};

export default async function GalleryPage() {
  // Use the API route instead of directly querying KV to ensure consistency with admin
  const response = await fetch('/api/upload/gallery', {
    cache: 'no-store' // Disable caching to get fresh data
  });
  
  let items: { url: string; caption: string }[] = [];
  if (response.ok) {
    const data = await response.json();
    items = data.items || [];
  }

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-4xl font-bold text-center my-8">Gallery</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((item, index) => (
          <div key={index} className="w-full h-auto flex flex-col items-center">
            <Image
              src={item.url}
              alt={`Gallery image ${index + 1}`}
              width={600}
              height={800}
              className="rounded-lg object-cover w-full"
            />
            {item.caption && (
              <p className="mt-1 text-sm text-center whitespace-pre-line">{item.caption}</p>
            )}
          </div>
        ))}
      </div>
    </main>
  );
} 