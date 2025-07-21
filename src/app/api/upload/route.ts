import { put, list, del } from '@vercel/blob';
import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename || !request.body) {
    return NextResponse.json({ message: 'No file to upload.' }, { status: 400 });
  }

  const blob = await put(filename, request.body, {
    access: 'public',
  });

  await kv.lpush('images', blob.url);

  return NextResponse.json(blob);
}

export async function GET(): Promise<NextResponse> {
  const blobs = await list();
  return NextResponse.json(blobs);
}

export async function DELETE(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json(
      { message: 'No url to delete.' },
      { status: 400 }
    );
  }

  await del(url);
  await kv.lrem('images', 0, url);

  return NextResponse.json({ message: 'File deleted.' });
} 