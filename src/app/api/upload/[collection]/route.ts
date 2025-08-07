/* eslint-disable @typescript-eslint/no-explicit-any */
// API route for uploading images by collection

import { NextResponse } from 'next/server';
import { put, del, list } from '@vercel/blob';
import { kv } from '@vercel/kv';

// ───────────────────────── POST /api/upload/:collection
export async function POST(request: Request, { params }: any) {
  const { collection } = params;
  const allowed = ['designs', 'gallery'];
  if (!allowed.includes(collection)) {
    return NextResponse.json({ error: 'Invalid collection' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');
  const caption = searchParams.get('caption');
  if (!filename || !request.body) {
    return NextResponse.json({ message: 'No file to upload.' }, { status: 400 });
  }

  // Generate a unique filename to avoid conflicts
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 8);
  const fileExtension = filename.includes('.') ? filename.split('.').pop() : '';
  const baseName = filename.includes('.') ? filename.replace(/\.[^/.]+$/, '') : filename;
  const uniqueFilename = `${baseName}-${timestamp}-${randomId}${fileExtension ? '.' + fileExtension : ''}`;

  const blob = await put(uniqueFilename, request.body, {
    access: 'public',
  });

  // Check if this URL already exists in the list (shouldn't happen with unique names, but just in case)
  const existingUrls = await kv.lrange(`${collection}-images`, 0, -1);
  if (!existingUrls.includes(blob.url)) {
    await kv.lpush(`${collection}-images`, blob.url);
  }

  if (caption) {
    await kv.hset('captions', { [blob.url]: caption });
  }
  return NextResponse.json(blob);
}

// ───────────────────────── GET /api/upload/:collection
export async function GET(_: Request, { params }: any) {
  const { collection } = params;
  const allowed = ['designs', 'gallery'];
  if (!allowed.includes(collection)) return NextResponse.json({ blobs: [] });

  let urls: string[] = await kv.lrange(`${collection}-images`, 0, -1);
  
  // For designs collection, check for old flash-images key as fallback
  if (collection === 'designs' && urls.length === 0) {
    urls = await kv.lrange('flash-images', 0, -1);
    // If we found data in the old key, migrate it to the new key
    if (urls.length > 0) {
      await kv.del('flash-images');
      await kv.rpush('designs-images', ...urls);
    }
  }
  
  if (urls.length === 0) return NextResponse.json({ blobs: [] });

  // Remove duplicates while preserving order (keep first occurrence)
  const uniqueUrls = urls.filter((url, index) => urls.indexOf(url) === index);
  
  // If we found duplicates, update the KV list
  if (uniqueUrls.length !== urls.length) {
    await kv.del(`${collection}-images`);
    if (uniqueUrls.length > 0) {
      await kv.rpush(`${collection}-images`, ...uniqueUrls);
    }
  }

  const { blobs } = await list();
  
  // Create a map of URL to blob for quick lookup
  const blobMap = new Map(blobs.map(b => [b.url, b]));
  
  // Filter and order blobs according to the KV list order
  const orderedBlobs = uniqueUrls
    .map(url => blobMap.get(url))
    .filter(blob => blob !== undefined);

  const items = await Promise.all(
    orderedBlobs.map(async (b) => {
      const caption = (await kv.hget('captions', b.url)) as string | null;
      return { url: b.url, caption: caption || '' };
    })
  );

  return NextResponse.json({ items });
}

// ───────────────────────── PUT /api/upload/:collection?url=&caption=
export async function PUT(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const caption = searchParams.get('caption') || '';
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 });
  await kv.hset('captions', { [url]: caption });
  return NextResponse.json({ ok: true });
}

// ───────────────────────── PATCH /api/upload/:collection (for reordering)
export async function PATCH(request: Request, { params }: any) {
  const { collection } = params;
  const allowed = ['designs', 'gallery'];
  if (!allowed.includes(collection)) {
    return NextResponse.json({ error: 'Invalid collection' }, { status: 400 });
  }

  try {
    const { urls } = await request.json();
    
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
  const { collection } = params;
  const allowed = ['designs', 'gallery'];
  if (!allowed.includes(collection)) {
    return NextResponse.json({ error: 'Invalid collection' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  if (!url) return NextResponse.json({ message: 'No url to delete.' }, { status: 400 });

  await del(url);
  await kv.lrem(`${collection}-images`, 0, url);
  return NextResponse.json({ message: 'File deleted.' });
} 