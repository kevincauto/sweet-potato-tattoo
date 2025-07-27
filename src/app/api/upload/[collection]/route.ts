/* eslint-disable @typescript-eslint/no-explicit-any */
// API route for uploading images by collection

import { NextResponse } from 'next/server';
import { put, del, list } from '@vercel/blob';
import { kv } from '@vercel/kv';

// ───────────────────────── POST /api/upload/:collection
export async function POST(request: Request, { params }: any) {
  const { collection } = params;
  const allowed = ['flash', 'gallery'];
  if (!allowed.includes(collection)) {
    return NextResponse.json({ error: 'Invalid collection' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');
  const caption = searchParams.get('caption');
  if (!filename || !request.body) {
    return NextResponse.json({ message: 'No file to upload.' }, { status: 400 });
  }

  const blob = await put(filename, request.body, {
    access: 'public',
    allowOverwrite: true,
  });

  await kv.lpush(`${collection}-images`, blob.url);
  if (caption) {
    await kv.hset('captions', { [blob.url]: caption });
  }
  return NextResponse.json(blob);
}

// ───────────────────────── GET /api/upload/:collection
export async function GET(_: Request, { params }: any) {
  const { collection } = params;
  const allowed = ['flash', 'gallery'];
  if (!allowed.includes(collection)) return NextResponse.json({ blobs: [] });

  const urls: string[] = await kv.lrange(`${collection}-images`, 0, -1);
  if (urls.length === 0) return NextResponse.json({ blobs: [] });

  const { blobs } = await list();
  const collectionBlobs = blobs.filter((b) => urls.includes(b.url));

  const items = await Promise.all(
    collectionBlobs.map(async (b) => {
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

// ───────────────────────── DELETE /api/upload/:collection
export async function DELETE(request: Request, { params }: any) {
  const { collection } = params;
  const allowed = ['flash', 'gallery'];
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