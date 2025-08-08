import { kv } from '@vercel/kv';
import { list } from '@vercel/blob';
import FlashGrid from '../../components/FlashGrid';
import FlashCTA from '../../components/FlashCTA';

export const metadata = {
  title: 'Available Flash',
};

// Ensure fresh data on every request in production
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function AvailableFlashPage() {
  // Get URLs from KV in the correct order
  let imageUrls = await kv.lrange('flash-images', 0, -1);

  // Fallback: if flash is empty, pull from any previous designs key and migrate back to flash
  if (imageUrls.length === 0) {
    const designsUrls = await kv.lrange('designs-images', 0, -1);
    if (designsUrls.length > 0) {
      await kv.del('flash-images');
      await kv.rpush('flash-images', ...designsUrls);
      imageUrls = designsUrls;
    }
  }

  // Legacy fallback (very old key)
  if (imageUrls.length === 0) {
    imageUrls = await kv.lrange('images', 0, -1);
  }
  
  // Get all blobs and create a map for quick lookup
  const { blobs } = await list();
  const blobMap = new Map(blobs.map(b => [b.url, b]));
  
  // Filter and order blobs according to the KV list order
  const existingBlobs = imageUrls
    .map(url => blobMap.get(url))
    .filter(blob => blob !== undefined);
  
  // Get captions for existing blobs
  const captionsRaw = (await kv.hgetall('captions')) as Record<string, string> | null;
  const captionsMap = captionsRaw ?? {};

  // Get categories for flash images (url -> category)
  const categoriesRaw = (await kv.hgetall('flash-categories')) as Record<string, string> | null;
  const categoriesMap = categoriesRaw ?? {};

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-4xl font-light text-center my-8 text-[#414141]">Available Flash</h1>
      <FlashGrid 
        images={existingBlobs}
        captionsMap={captionsMap}
        categoriesMap={categoriesMap}
      />
      {/* Full-bleed CTA below the grid */}
      <div className="mt-8">
        <FlashCTA imageUrls={imageUrls} variant="to-booking" />
      </div>
    </main>
  );
}
