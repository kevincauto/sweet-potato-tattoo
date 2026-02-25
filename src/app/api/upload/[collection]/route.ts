/* eslint-disable @typescript-eslint/no-explicit-any */
// API route for uploading images by collection

import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import cloudinary from '@/lib/cloudinary';
import { stripCloudinaryVersion } from '@/lib/cloudinaryUrl';
import { revalidatePath } from 'next/cache';

// ───────────────────────── POST /api/upload/:collection
export async function POST(request: Request, { params }: any) {
  const { collection } = await params;
  const allowed = ['flash', 'gallery', 'about'];
  if (!allowed.includes(collection)) {
    return NextResponse.json({ error: 'Invalid collection' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');
  const caption = searchParams.get('caption');
  const category = searchParams.get('category');
  if (!filename || !request.body) {
    return NextResponse.json({ message: 'No file to upload.' }, { status: 400 });
  }

  // Generate a unique filename to avoid conflicts
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 8);
  const fileExtension = filename.includes('.') ? filename.split('.').pop() : '';
  const baseName = filename.includes('.') ? filename.replace(/\.[^/.]+$/, '') : filename;
  const uniqueFilename = `${baseName}-${timestamp}-${randomId}${fileExtension ? '.' + fileExtension : ''}`;

  // Convert request body to buffer
  const arrayBuffer = await request.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Upload to Cloudinary
  const uploadResult = await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `sweet-potato-tattoo/${collection}`,
        public_id: uniqueFilename.replace(/\.[^/.]+$/, ''), // Remove extension for Cloudinary
        resource_type: 'image',
        overwrite: false,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(buffer);
  }) as any;

  const imageUrl = uploadResult.secure_url;

  // Check if this URL already exists in the list (shouldn't happen with unique names, but just in case)
  const existingUrls = await kv.lrange(`${collection}-images`, 0, -1);
  if (!existingUrls.includes(imageUrl)) {
    await kv.lpush(`${collection}-images`, imageUrl);
  }

  if (caption) {
    await kv.hset('captions', { [imageUrl]: caption });
  }
  // Save category for flash collection
  if (collection === 'flash' && category) {
    const allowedCategories = ['Fauna Flash', 'Flora Flash', 'Sky Flash', 'Small Flash', 'Discount Flash'];
    if (allowedCategories.includes(category)) {
      await kv.hset('flash-categories', { [imageUrl]: category });
    }
  }

  // Bust cached pages after mutations so the site updates quickly with ISR enabled.
  try {
    revalidatePath(collection === 'flash' ? '/' : '/gallery');
  } catch {}
  
  return NextResponse.json({ 
    url: imageUrl,
    pathname: uploadResult.public_id,
    size: uploadResult.bytes,
    uploadedAt: new Date(uploadResult.created_at),
  });
}

// ───────────────────────── GET /api/upload/:collection
export async function GET(_: Request, { params }: any) {
  const { collection } = await params;
  const allowed = ['flash', 'gallery', 'about'];
  if (!allowed.includes(collection)) return NextResponse.json({ blobs: [] });

  let urls: string[] = await kv.lrange(`${collection}-images`, 0, -1);
  
  // For flash collection, check for designs-images key as fallback (in case of prior rename)
  if (collection === 'flash' && urls.length === 0) {
    urls = await kv.lrange('designs-images', 0, -1);
    // If we found data in the designs key, migrate it back to flash
    if (urls.length > 0) {
      await kv.del('designs-images');
      await kv.rpush('flash-images', ...urls);
    }
  }
  
  if (urls.length === 0) return NextResponse.json({ items: [] });

  // Remove duplicates while preserving order (keep first occurrence)
  const uniqueUrls = urls.filter((url, index) => urls.indexOf(url) === index);
  
  // If we found duplicates, update the KV list
  if (uniqueUrls.length !== urls.length) {
    await kv.del(`${collection}-images`);
    if (uniqueUrls.length > 0) {
      await kv.rpush(`${collection}-images`, ...uniqueUrls);
    }
  }

  // Return items with captions, categories, schedules, and hidden status
  const items = await Promise.all(
    uniqueUrls.map(async (url) => {
      // Check caption with URL normalization (try multiple encoding variations)
      let caption = (await kv.hget('captions', url)) as string | null;
      if (!caption) {
        try {
          const decodedUrl = decodeURIComponent(url);
          caption = (await kv.hget('captions', decodedUrl)) as string | null;
        } catch {}
      }
      if (!caption) {
        try {
          const encodedUrl = encodeURI(url);
          caption = (await kv.hget('captions', encodedUrl)) as string | null;
        } catch {}
      }
      if (!caption) {
        try {
          const doubleEncoded = url.replace(/%20/g, '%2520');
          caption = (await kv.hget('captions', doubleEncoded)) as string | null;
        } catch {}
      }
      
      let category: string | null = null;
      let schedule: string | null = null;
      let hidden: string | null = null;
      let claimed: string | boolean | null = null;
      let rev: string | null = null;
      if (collection === 'flash') {
        category = (await kv.hget('flash-categories', url)) as string | null;
        
        // Check schedule with URL normalization (try multiple encoding variations)
        schedule = (await kv.hget('flash-schedules', url)) as string | null;
        if (!schedule) {
          try {
            const decodedUrl = decodeURIComponent(url);
            schedule = (await kv.hget('flash-schedules', decodedUrl)) as string | null;
          } catch {}
        }
        if (!schedule) {
          try {
            const encodedUrl = encodeURI(url);
            schedule = (await kv.hget('flash-schedules', encodedUrl)) as string | null;
          } catch {}
        }
        if (!schedule) {
          try {
            const doubleEncoded = url.replace(/%20/g, '%2520');
            schedule = (await kv.hget('flash-schedules', doubleEncoded)) as string | null;
          } catch {}
        }
        
        // Check hidden status with URL normalization (try both original and decoded)
        hidden = (await kv.hget('flash-hidden', url)) as string | null;
        if (!hidden) {
          try {
            const decodedUrl = decodeURIComponent(url);
            hidden = (await kv.hget('flash-hidden', decodedUrl)) as string | null;
          } catch {}
        }
        if (!hidden) {
          try {
            const encodedUrl = encodeURI(url);
            hidden = (await kv.hget('flash-hidden', encodedUrl)) as string | null;
          } catch {}
        }
        if (!hidden) {
          try {
            const doubleEncoded = url.replace(/%20/g, '%2520');
            hidden = (await kv.hget('flash-hidden', doubleEncoded)) as string | null;
          } catch {}
        }
        
        // Check claimed status with URL normalization (try multiple encoding variations)
        claimed = (await kv.hget('flash-claimed', url)) as string | boolean | null;
        if (!claimed) {
          try {
            const decodedUrl = decodeURIComponent(url);
            claimed = (await kv.hget('flash-claimed', decodedUrl)) as string | boolean | null;
          } catch {}
        }
        if (!claimed) {
          try {
            const encodedUrl = encodeURI(url);
            claimed = (await kv.hget('flash-claimed', encodedUrl)) as string | boolean | null;
          } catch {}
        }
        if (!claimed) {
          try {
            const doubleEncoded = url.replace(/%20/g, '%2520');
            claimed = (await kv.hget('flash-claimed', doubleEncoded)) as string | boolean | null;
          } catch {}
        }

        // Revision for image cache-busting (keyed by versionless Cloudinary URL)
        try {
          const stableUrl = stripCloudinaryVersion(url);
          rev = (await kv.hget('flash-image-rev', stableUrl)) as string | null;

          // Backfill: older claimed images might not have a rev yet. If the image is claimed and rev is missing,
          // generate one so the public site immediately busts Next/Image's cache.
          const isClaimed = claimed === true || claimed === 'true';
          if (isClaimed && (!rev || rev.length === 0)) {
            rev = Date.now().toString();
            await kv.hset('flash-image-rev', { [stableUrl]: rev });
          }
        } catch {}
      }
      return { url, caption: caption || '', category: category || '', schedule: schedule || '', hidden: hidden || '', claimed: claimed || '', rev: rev || '' };
    })
  );

  return NextResponse.json({ items });
}

// ───────────────────────── PUT /api/upload/:collection?url=&caption=
export async function PUT(request: Request, { params }: any) {
  const { collection } = await params;
  const { searchParams } = new URL(request.url);
  let url = searchParams.get('url');
  // Only update captions when explicitly provided (otherwise unrelated updates would wipe captions).
  const captionParam = searchParams.get('caption'); // string | null (may be empty string to clear)
  const category = searchParams.get('category');
  const schedule = searchParams.get('schedule'); // ISO string or empty string to clear
  const hidden = searchParams.get('hidden'); // 'true' or 'false' or empty string to clear
  const claimed = searchParams.get('claimed'); // 'true' or 'false' or empty string to clear
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 });
  
  // Normalize URL to match how it's stored in the list (decode once to handle double-encoding)
  // The URL from query params might be double-encoded, but we store it in the same format as the list
  try {
    // Decode once to normalize (handles %2520 -> %20)
    url = decodeURIComponent(url);
  } catch {
    // If decoding fails, use original
  }
  if (captionParam !== null) await kv.hset('captions', { [url]: captionParam });
  if (collection === 'flash') {
    if (category) {
      const allowedCategories = ['Fauna Flash', 'Flora Flash', 'Sky Flash', 'Small Flash', 'Discount Flash'];
      if (allowedCategories.includes(category)) {
        await kv.hset('flash-categories', { [url]: category });
      }
    }
    // Handle schedule: if empty string, delete; otherwise save
    if (schedule !== null) {
      if (schedule === '') {
        await kv.hdel('flash-schedules', url);
      } else {
        await kv.hset('flash-schedules', { [url]: schedule });
      }
    }
    // Handle hidden: if 'true', save; if 'false' or empty, delete
    if (hidden !== null) {
      // Use the normalized URL (already decoded above)
      if (hidden === 'true') {
        await kv.hset('flash-hidden', { [url]: 'true' });
      } else {
        // Delete all URL encoding variations to ensure complete removal
        // First, get all keys from the hash to find matching variations
        const allHiddenKeys = await kv.hgetall('flash-hidden') as Record<string, any> | null;
        const variationsToDelete: string[] = [];
        
        if (allHiddenKeys) {
          // Find all keys that match this URL (in any encoding)
          const urlVariations = new Set<string>([url]);
          try {
            const decoded = decodeURIComponent(url);
            urlVariations.add(decoded);
            const encoded = encodeURI(decoded);
            urlVariations.add(encoded);
            const doubleEncoded = url.replace(/%20/g, '%2520');
            urlVariations.add(doubleEncoded);
          } catch {}
          
          // Find matching keys in the hash
          Object.keys(allHiddenKeys).forEach(key => {
            // Check if this key matches any of our URL variations
            if (urlVariations.has(key)) {
              variationsToDelete.push(key);
            }
            // Also check if keys are encoding variations of each other
            try {
              const keyDecoded = decodeURIComponent(key);
              if (urlVariations.has(keyDecoded) || urlVariations.has(key)) {
                variationsToDelete.push(key);
              }
            } catch {}
          });
        }
        
        // If no variations found, try the original URL and common variations
        if (variationsToDelete.length === 0) {
          variationsToDelete.push(url);
          try {
            const doubleEncoded = url.replace(/%20/g, '%2520');
            variationsToDelete.push(doubleEncoded);
            const singleEncoded = url.replace(/%2520/g, '%20');
            variationsToDelete.push(singleEncoded);
          } catch {}
        }
        
        // Delete all variations
        for (const variation of variationsToDelete) {
          await kv.hdel('flash-hidden', variation);
        }
      }
    }
    // Handle claimed: if 'true', save; if 'false' or empty, delete
    if (claimed !== null && collection === 'flash') {
      // Get all keys from the hash to find matching variations
      const allClaimedKeys = await kv.hgetall('flash-claimed') as Record<string, any> | null;
      const variationsToDelete: string[] = [];
      
      if (allClaimedKeys) {
        // Find all keys that match this URL (in any encoding)
        const urlVariations = new Set<string>([url]);
        try {
          const decoded = decodeURIComponent(url);
          urlVariations.add(decoded);
          const encoded = encodeURI(decoded);
          urlVariations.add(encoded);
          const doubleEncoded = url.replace(/%20/g, '%2520');
          urlVariations.add(doubleEncoded);
        } catch {}
        
        // Find matching keys in the hash
        Object.keys(allClaimedKeys).forEach(key => {
          // Check if this key matches any of our URL variations
          if (urlVariations.has(key)) {
            variationsToDelete.push(key);
          }
          // Also check if keys are encoding variations of each other
          try {
            const keyDecoded = decodeURIComponent(key);
            if (urlVariations.has(keyDecoded) || urlVariations.has(key)) {
              variationsToDelete.push(key);
            }
          } catch {}
        });
      }
      
      // If no variations found, try the original URL and common variations
      if (variationsToDelete.length === 0) {
        variationsToDelete.push(url);
        try {
          const doubleEncoded = url.replace(/%20/g, '%2520');
          variationsToDelete.push(doubleEncoded);
          const singleEncoded = url.replace(/%2520/g, '%20');
          variationsToDelete.push(singleEncoded);
        } catch {}
      }
      
      if (claimed === 'true') {
        await kv.hset('flash-claimed', { [url]: 'true' });
      } else {
        // Delete all variations
        for (const variation of variationsToDelete) {
          await kv.hdel('flash-claimed', variation);
        }
      }
    }
  }
  // Bust cached pages after mutations so the site updates quickly with ISR enabled.
  try {
    revalidatePath(collection === 'flash' ? '/' : '/gallery');
  } catch {}
  return NextResponse.json({ ok: true });
}

// ───────────────────────── PATCH /api/upload/:collection (for reordering)
export async function PATCH(request: Request, { params }: any) {
  const { collection } = await params;
  const allowed = ['flash', 'gallery', 'about'];
  if (!allowed.includes(collection)) {
    return NextResponse.json({ error: 'Invalid collection' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { urls, action } = body as { urls?: string[]; action?: 'shuffle' };
    
    if (action === 'shuffle') {
      const existing = await kv.lrange(`${collection}-images`, 0, -1);
      // Fisher-Yates shuffle
      for (let i = existing.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [existing[i], existing[j]] = [existing[j], existing[i]];
      }
      await kv.del(`${collection}-images`);
      if (existing.length > 0) {
        await kv.rpush(`${collection}-images`, ...existing);
      }
      try {
        revalidatePath(collection === 'flash' ? '/' : '/gallery');
      } catch {}
      return NextResponse.json({ ok: true, message: 'Shuffled once' });
    }

    if (!Array.isArray(urls)) {
      return NextResponse.json({ error: 'urls array required' }, { status: 400 });
    }

    // Delete the existing list and recreate it with the new order
    await kv.del(`${collection}-images`);
    if (urls.length > 0) {
      await kv.rpush(`${collection}-images`, ...urls);
    }

    try {
      revalidatePath(collection === 'flash' ? '/' : '/gallery');
    } catch {}
    return NextResponse.json({ ok: true, message: 'Order updated successfully' });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

// ───────────────────────── DELETE /api/upload/:collection
export async function DELETE(request: Request, { params }: any) {
  const { collection } = await params;
  const allowed = ['flash', 'gallery', 'about'];
  if (!allowed.includes(collection)) {
    return NextResponse.json({ error: 'Invalid collection' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  if (!url) return NextResponse.json({ message: 'No url to delete.' }, { status: 400 });

  // Extract public_id from Cloudinary URL
  // Cloudinary URLs format: https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{public_id}.{format}
  try {
    const urlParts = url.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');
    if (uploadIndex !== -1 && uploadIndex < urlParts.length - 1) {
      // Get the public_id (everything after 'upload' minus the version if present)
      const afterUpload = urlParts.slice(uploadIndex + 1);
      // Remove version (v1234567890) if present and get the rest
      const publicIdParts = afterUpload.filter(part => !part.match(/^v\d+$/));
      const publicId = publicIdParts.join('/').replace(/\.[^/.]+$/, ''); // Remove file extension
      
      await cloudinary.uploader.destroy(publicId);
    }
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    // Continue to remove from KV even if Cloudinary delete fails
  }

  await kv.lrem(`${collection}-images`, 0, url);
  await kv.hdel('captions', url);
  if (collection === 'flash') {
    await kv.hdel('flash-categories', url);
    await kv.hdel('flash-schedules', url);
    await kv.hdel('flash-hidden', url);
  }

  try {
    revalidatePath(collection === 'flash' ? '/' : '/gallery');
  } catch {}
  return NextResponse.json({ message: 'File deleted.' });
} 