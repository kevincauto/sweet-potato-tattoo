import { kv } from '@vercel/kv';
import { list } from '@vercel/blob';
import FlashGrid from '../../components/FlashGrid';

export const metadata = {
  title: 'Available Flash',
};

export default async function AvailableFlashPage() {
  // Get URLs from KV in the correct order
  let imageUrls = await kv.lrange('flash-images', 0, -1);
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

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-4xl font-light text-center my-8 text-[#414141]">Available Flash</h1>
      <FlashGrid 
        images={existingBlobs}
        captionsMap={captionsMap}
      />
    </main>
  );
}
