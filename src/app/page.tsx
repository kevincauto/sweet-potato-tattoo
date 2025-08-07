import { kv } from '@vercel/kv';
import { list } from '@vercel/blob';
import NewsletterSection from '@/components/NewsletterSection';
import GalleryGrid from '@/components/GalleryGrid';

export default async function Home() {
  // Get gallery images in the correct order
  const imageUrls = await kv.lrange('gallery-images', 0, -1);
  const { blobs } = await list();
  
  // Create a map of URL to blob for quick lookup
  const blobMap = new Map(blobs.map(b => [b.url, b]));
  
  // Filter and order blobs according to the KV list order
  const existingBlobs = imageUrls
    .map(url => blobMap.get(url))
    .filter(blob => blob !== undefined);
  
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
            <GalleryGrid 
              images={existingBlobs}
              captionsMap={captionsMap}
            />
          </div>
        </div>
      </main>
    </>
  );
}
