/* eslint-disable @typescript-eslint/no-explicit-any */
// API route for uploading images by collection

import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import cloudinary from '@/lib/cloudinary';

// ───────────────────────── POST /api/upload/:collection
export async function POST(request: Request, { params }: any) {
  const { collection } = await params;
  const allowed = ['flash', 'gallery'];
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
  const allowed = ['flash', 'gallery'];
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

  // Return items with captions and categories
  const items = await Promise.all(
    uniqueUrls.map(async (url) => {
      const caption = (await kv.hget('captions', url)) as string | null;
      let category: string | null = null;
      if (collection === 'flash') {
        category = (await kv.hget('flash-categories', url)) as string | null;
      }
      return { url, caption: caption || '', category: category || '' };
    })
  );

  return NextResponse.json({ items });
}

// ───────────────────────── PUT /api/upload/:collection?url=&caption=
export async function PUT(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const caption = searchParams.get('caption') || '';
  const category = searchParams.get('category');
  const collection = searchParams.get('collection');
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 });
  if (caption) {
    await kv.hset('captions', { [url]: caption });
  }
  if (collection === 'flash' && category) {
    const allowedCategories = ['Fauna Flash', 'Flora Flash', 'Sky Flash', 'Small Flash', 'Discount Flash'];
    if (allowedCategories.includes(category)) {
      await kv.hset('flash-categories', { [url]: category });
    }
  }
  return NextResponse.json({ ok: true });
}

// ───────────────────────── PATCH /api/upload/:collection (for reordering)
export async function PATCH(request: Request, { params }: any) {
  const { collection } = await params;
  const allowed = ['flash', 'gallery'];
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

    return NextResponse.json({ ok: true, message: 'Order updated successfully' });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

// ───────────────────────── DELETE /api/upload/:collection
export async function DELETE(request: Request, { params }: any) {
  const { collection } = await params;
  const allowed = ['flash', 'gallery'];
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
  }
  return NextResponse.json({ message: 'File deleted.' });
} 