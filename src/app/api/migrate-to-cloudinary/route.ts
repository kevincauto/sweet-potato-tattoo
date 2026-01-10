import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { list } from '@vercel/blob';
import cloudinary from '@/lib/cloudinary';

// Migration script to move images from Vercel Blob to Cloudinary
export async function POST(request: Request) {
  try {
    const { collection, dryRun = 'false' } = await request.json();
    const isDryRun = dryRun === 'true';
    
    if (!collection || !['flash', 'gallery'].includes(collection)) {
      return NextResponse.json({ error: 'Invalid collection. Use "flash" or "gallery"' }, { status: 400 });
    }

    // Get all image URLs from KV
    const imageUrls = await kv.lrange(`${collection}-images`, 0, -1);
    
    // Get all blobs from Vercel
    const { blobs } = await list();
    const blobMap = new Map(blobs.map(b => [b.url, b]));

    const results = {
      total: imageUrls.length,
      migrated: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[],
      newUrls: [] as string[],
    };

    const urlMapping: Record<string, string> = {}; // old URL -> new URL

    for (const oldUrl of imageUrls) {
      try {
        // Check if already migrated (starts with cloudinary.com)
        if (oldUrl.includes('cloudinary.com')) {
          results.skipped++;
          urlMapping[oldUrl] = oldUrl; // Keep existing URL
          continue;
        }

        // Get blob info
        const blob = blobMap.get(oldUrl);
        if (!blob) {
          results.failed++;
          results.errors.push(`Blob not found for: ${oldUrl}`);
          continue;
        }

        if (isDryRun) {
          results.migrated++;
          urlMapping[oldUrl] = `[DRY RUN] Would migrate: ${oldUrl}`;
          continue;
        }

        // Download image from Vercel Blob
        const imageResponse = await fetch(oldUrl);
        if (!imageResponse.ok) {
          throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
        }
        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

        // Extract filename from URL
        const urlParts = oldUrl.split('/');
        const filename = urlParts[urlParts.length - 1].split('?')[0];
        const baseName = filename.replace(/\.[^/.]+$/, '');

        // Upload to Cloudinary
        const uploadResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: `sweet-potato-tattoo/${collection}`,
              public_id: baseName,
              resource_type: 'image',
              overwrite: false,
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(imageBuffer);
        }) as any;

        const newUrl = uploadResult.secure_url;
        urlMapping[oldUrl] = newUrl;
        results.migrated++;

        // Update captions and categories to use new URL
        const caption = await kv.hget('captions', oldUrl);
        if (caption) {
          await kv.hdel('captions', oldUrl);
          await kv.hset('captions', { [newUrl]: caption });
        }

        if (collection === 'flash') {
          const category = await kv.hget('flash-categories', oldUrl);
          if (category) {
            await kv.hdel('flash-categories', oldUrl);
            await kv.hset('flash-categories', { [newUrl]: category });
          }
        }

      } catch (error: any) {
        results.failed++;
        results.errors.push(`${oldUrl}: ${error.message}`);
        console.error(`Error migrating ${oldUrl}:`, error);
      }
    }

    // Update KV list with new URLs (preserving order)
    if (!isDryRun && results.migrated > 0) {
      await kv.del(`${collection}-images`);
      // Replace old URLs with new URLs in the list, preserving order
      const finalUrls = imageUrls.map(url => {
        const newUrl = urlMapping[url];
        return newUrl && !newUrl.includes('[DRY RUN]') ? newUrl : url;
      }).filter(url => url && !url.includes('[DRY RUN]'));
      
      if (finalUrls.length > 0) {
        await kv.rpush(`${collection}-images`, ...finalUrls);
      }
    }
    
    results.newUrls = Object.values(urlMapping).filter(url => !url.includes('[DRY RUN]')) as string[];

    return NextResponse.json({
      collection,
      dryRun: isDryRun,
      results,
      message: isDryRun 
        ? 'Dry run completed. No changes made.' 
        : `Migration completed. ${results.migrated} images migrated.`,
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

