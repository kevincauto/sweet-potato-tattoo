import { kv } from '@vercel/kv';
import { list } from '@vercel/blob';
import Image from 'next/image';
import NewsletterSection from '@/components/NewsletterSection';
import GalleryModal from '@/components/GalleryModal';

export default async function Home() {
  // Get gallery images
  const imageUrls = await kv.lrange('gallery-images', 0, -1);
  const { blobs } = await list();
  const existingBlobs = blobs.filter((b) => imageUrls.includes(b.url));
  const captionsRaw = (await kv.hgetall('captions')) as Record<string, string> | null;
  const captionsMap = captionsRaw ?? {};

  return (
    <>
      {/* Newsletter section - right after navigation */}
      <NewsletterSection />
      
      {/* Gallery section */}
      <main className="flex flex-1 flex-col items-center justify-center p-4">
        <div className="w-full max-w-6xl text-center">
          <div className="mb-12">
            <h2 className="text-3xl font-light mb-6 text-[#414141]">Gallery</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {existingBlobs.map((blob, index) => (
                <GalleryModal 
                  key={index}
                  imageUrl={blob.url}
                  caption={captionsMap[blob.url] || ''}
                  index={index}
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
