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
  if (!filename || !request.body) {
    return NextResponse.json({ message: 'No file to upload.' }, { status: 400 });
  }

  const blob = await put(filename, request.body, {
    access: 'public',
    allowOverwrite: true,
  });

  await kv.lpush(`${collection}-images`, blob.url);
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
  return NextResponse.json({ blobs: collectionBlobs });
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