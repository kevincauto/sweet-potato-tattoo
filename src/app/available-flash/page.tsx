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
  
  // Filter flash URLs to only include existing blobs (same filtering as FlashGrid)
  const existingFlashUrls = imageUrls
    .filter(url => blobMap.has(url));
  
  // Get captions for existing blobs
  const captionsRaw = (await kv.hgetall('captions')) as Record<string, string> | null;
  const captionsMap = captionsRaw ?? {};

  // Get categories for flash images (url -> category)
  const categoriesRaw = (await kv.hgetall('flash-categories')) as Record<string, string> | null;
  const categoriesMap = categoriesRaw ?? {};

  return (
    <main className="container mx-auto p-4">
      {/* Under Construction Banner */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Under Construction:</strong> This section may not be up to date. Please view my Instagram flash stories <a 
                href="https://www.instagram.com/sweetpotatotat/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="underline font-semibold">HERE</a> for now.
              </p>
          </div>
        </div>
      </div>
      
      <h1 className="text-4xl font-light text-center my-8 text-[#414141]">Available Flash</h1>
      <FlashGrid 
        images={existingBlobs}
        captionsMap={captionsMap}
        categoriesMap={categoriesMap}
      />
      {/* Full-bleed CTA below the grid */}
      <div className="mt-8">
        <FlashCTA imageUrls={existingFlashUrls} variant="to-booking" />
      </div>
    </main>
  );
}
