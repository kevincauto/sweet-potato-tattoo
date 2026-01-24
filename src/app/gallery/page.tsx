import { kv } from '@vercel/kv';
import NewsletterSection from '@/components/NewsletterSection';
import GalleryGrid from '@/components/GalleryGrid';
import FlashCTA from '@/components/FlashCTA';
import { stripCloudinaryVersion } from '@/lib/cloudinaryUrl';

export const metadata = {
  title: 'Gallery',
};

// Ensure fresh data on every request in production
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function GalleryPage() {
  // Get gallery images in the correct order
  const imageUrls = await kv.lrange('gallery-images', 0, -1);
  // Get flash images for CTA background
  const flashUrls = await kv.lrange('flash-images', 0, -1);

  // Pull per-image revision cache-busters (only used for overwritten/claimed images; harmless for gallery)
  const revRaw = (await kv.hgetall('flash-image-rev')) as Record<string, string> | null;
  const revMap = revRaw ?? {};
  
  // Convert URLs to BlobData format (components only need url property)
  const existingBlobs = imageUrls.map((url) => {
    const stableUrl = stripCloudinaryVersion(url);
    const rev = revMap[stableUrl];
    return { url, rev };
  });
  
  const captionsRaw = (await kv.hgetall('captions')) as Record<string, string> | null;
  const captionsMap = captionsRaw ?? {};

  return (
    <>
      {/* Newsletter section - right after navigation */}
      <NewsletterSection priority />
      
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
      
      {/* Flash CTA - full-bleed under gallery, above footer */}
      <FlashCTA imageUrls={flashUrls} variant="to-flash" />
    </>
  );
}

