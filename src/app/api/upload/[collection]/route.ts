import { NextRequest, NextResponse } from 'next/server';
import { put, del, list } from '@vercel/blob';
import { kv } from '@vercel/kv';

export async function POST(request: NextRequest, { params }: { params: { collection: string } }) {
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
  const blob = await put(filename, request.body, { access: 'public' });
  await kv.lpush(`${collection}-images`, blob.url);
  return NextResponse.json(blob);
}

export async function GET(request: NextRequest, { params }: { params: { collection: string } }) {
  const { collection } = params;
  const allowed = ['flash', 'gallery'];
  if (!allowed.includes(collection)) {
    return NextResponse.json({ blobs: [] });
  }

  const urls: string[] = await kv.lrange(`${collection}-images`, 0, -1);
  if (urls.length === 0) {
    return NextResponse.json({ blobs: [] });
  }

  // Fetch all blobs and filter them by the URLs in our KV list.
  const { blobs } = await list();
  const collectionBlobs = blobs.filter((blob) => urls.includes(blob.url));

  return NextResponse.json({ blobs: collectionBlobs });
}

export async function DELETE(request: NextRequest, { params }: { params: { collection: string } }) {
  const { collection } = params;
  const allowed = ['flash', 'gallery'];
  if (!allowed.includes(collection)) {
    return NextResponse.json({ error: 'Invalid collection' }, { status: 400 });
  }
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  if (!url) {
    return NextResponse.json({ message: 'No url to delete.' }, { status: 400 });
  }
  await del(url);
  await kv.lrem(`${collection}-images`, 0, url);
  return NextResponse.json({ message: 'File deleted.' });
} 