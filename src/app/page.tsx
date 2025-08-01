import { kv } from '@vercel/kv';
import { list } from '@vercel/blob';
import Image from 'next/image';
import NewsletterSignup from './components/NewsletterSignup';

export default async function Home() {
  // Get gallery images
  const imageUrls = await kv.lrange('gallery-images', 0, -1);
  const { blobs } = await list();
  const existingBlobs = blobs.filter((b) => imageUrls.includes(b.url));
  const captionsRaw = (await kv.hgetall('captions')) as Record<string, string> | null;
  const captionsMap = captionsRaw ?? {};

  return (
    <main className="flex flex-1 flex-col items-center justify-center p-4">
      <div className="w-full max-w-6xl text-center">
        {/* Newsletter signup */}
        <NewsletterSignup />
        
        {/* Gallery section */}
        <div className="mt-12">
          <h2 className="text-3xl font-bold mb-6 text-[#414141]">Gallery</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {existingBlobs.map((blob, index) => (
              <div key={index} className="w-full h-auto flex flex-col items-center">
                <Image
                  src={blob.url}
                  alt={`Gallery image ${index + 1}`}
                  width={400}
                  height={500}
                  className="rounded-lg object-cover w-full"
                />
                {captionsMap[blob.url] && (
                  <p className="mt-1 text-sm text-center whitespace-pre-line text-[#414141]">{captionsMap[blob.url]}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
