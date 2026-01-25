/* eslint-disable @typescript-eslint/no-explicit-any */
// API route for overwriting a Cloudinary image at a target URL with the bytes from a source URL.
// Admin-only (protected by middleware basic auth).

import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';
import { kv } from '@vercel/kv';
import { stripCloudinaryVersion } from '@/lib/cloudinaryUrl';

function extractCloudinaryPublicIdFromUrl(imageUrl: string): { publicId: string; originalExt: string } {
  // URL format (common): https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{folder}/{public_id}.{ext}
  const urlParts = imageUrl.split('/');
  const uploadIndex = urlParts.findIndex((part: string) => part === 'upload');
  if (uploadIndex === -1) throw new Error('Invalid Cloudinary URL: missing "upload" segment');

  const afterUpload = urlParts.slice(uploadIndex + 1);
  const publicIdParts = afterUpload.filter((part: string) => !part.match(/^v\d+$/));
  const publicIdWithExt = publicIdParts.join('/').split('?')[0];

  const publicIdRaw = publicIdWithExt.replace(/\.[^/.]+$/, '');
  let publicId = publicIdRaw;
  try {
    publicId = decodeURIComponent(publicIdRaw);
  } catch {}

  const originalExt = (publicIdWithExt.match(/\.([a-zA-Z0-9]+)$/)?.[1] || 'jpg').toLowerCase();
  return { publicId, originalExt: originalExt === 'jpeg' ? 'jpg' : originalExt };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { sourceUrl?: string; targetUrl?: string };
    const sourceUrl = body?.sourceUrl;
    const targetUrl = body?.targetUrl;

    if (!sourceUrl || !targetUrl) {
      return NextResponse.json({ error: 'sourceUrl and targetUrl required' }, { status: 400 });
    }

    // Basic sanity: only allow overwriting Cloudinary delivery URLs.
    if (!targetUrl.includes('/image/upload/')) {
      return NextResponse.json({ error: 'targetUrl must be a Cloudinary image upload URL' }, { status: 400 });
    }

    const { publicId: targetPublicId, originalExt: targetExt } = extractCloudinaryPublicIdFromUrl(targetUrl);

    console.log('Replacing Cloudinary image');
    console.log('Source URL:', sourceUrl);
    console.log('Target URL:', targetUrl);
    console.log('Target public_id:', targetPublicId);

    // Overwrite target public_id with source bytes.
    const uploadResult = await cloudinary.uploader.upload(sourceUrl, {
      public_id: targetPublicId,
      resource_type: 'image',
      overwrite: true,
      invalidate: true,
      format: targetExt,
    });

    // Bump rev so Next/Image refreshes everywhere immediately.
    const rev = Date.now().toString();
    const inputNoQuery = String(targetUrl).split('?')[0];
    const stableFromInput = stripCloudinaryVersion(inputNoQuery);
    const stableFromResult = stripCloudinaryVersion(uploadResult.secure_url);

    const revUpdates: Record<string, string> = {
      [stableFromInput]: rev,
      [stableFromResult]: rev,
    };
    try {
      revUpdates[decodeURIComponent(stableFromInput)] = rev;
    } catch {}
    try {
      revUpdates[encodeURI(stableFromInput)] = rev;
    } catch {}
    try {
      revUpdates[stableFromInput.replace(/%20/g, '%2520')] = rev;
    } catch {}
    await kv.hset('flash-image-rev', revUpdates);

    return NextResponse.json({
      success: true,
      sourceUrl,
      targetUrl,
      targetPublicId,
      url: uploadResult.secure_url,
      stableUrl: stableFromResult,
      rev,
      message: 'Target image has been overwritten successfully',
    });
  } catch (error: any) {
    console.error('Error replacing image:', error);
    return NextResponse.json(
      {
        error: 'Failed to replace image',
        details: error?.message ?? String(error),
      },
      { status: 500 },
    );
  }
}


