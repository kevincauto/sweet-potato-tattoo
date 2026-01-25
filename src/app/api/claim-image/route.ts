/* eslint-disable @typescript-eslint/no-explicit-any */
// API route for applying claimed overlay to images

import { NextResponse } from 'next/server';
import { stripCloudinaryVersion } from '@/lib/cloudinaryUrl';
import cloudinary from '@/lib/cloudinary';
import { kv } from '@vercel/kv';

export async function POST(request: Request) {
  try {
    const { imageUrl } = await request.json();
    
    if (!imageUrl) {
      return NextResponse.json({ error: 'imageUrl required' }, { status: 400 });
    }

    console.log('Processing claimed image:', imageUrl);

    // Extract public_id from Cloudinary URL early (used for transform + overwrite)
    // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{folder}/{public_id}.{ext}
    const urlParts = imageUrl.split('/');
    const uploadIndex = urlParts.findIndex((part: string) => part === 'upload');
    if (uploadIndex === -1) {
      console.error('Invalid Cloudinary URL - no "upload" found:', imageUrl);
      return NextResponse.json({ error: 'Invalid Cloudinary URL' }, { status: 400 });
    }
    const afterUpload = urlParts.slice(uploadIndex + 1);
    const publicIdParts = afterUpload.filter((part: string) => !part.match(/^v\d+$/));
    const publicIdWithExt = publicIdParts.join('/').split('?')[0];
    const publicIdRaw = publicIdWithExt.replace(/\.[^/.]+$/, '');
    // IMPORTANT: Cloudinary delivery URLs URL-encode the public_id (e.g. spaces become %20),
    // but the Upload API expects the *decoded* public_id. If we don't decode, we can end up
    // overwriting a different asset (works for filenames without spaces, fails for ones with).
    let publicId = publicIdRaw;
    try {
      publicId = decodeURIComponent(publicIdRaw);
    } catch {}
    const originalExt = (publicIdWithExt.match(/\.([a-zA-Z0-9]+)$/)?.[1] || 'jpg').toLowerCase();

    console.log('Extracted public_id (raw):', publicIdRaw);
    console.log('Extracted public_id (decoded):', publicId);
    console.log('Original ext:', originalExt);

    // PRODUCTION-SAFE PATH:
    // On Vercel/production, serverless runtimes may not have usable system fonts for node-canvas,
    // which causes "tofu" (square boxes) instead of text. We avoid that by letting Cloudinary
    // render the text overlays, then we overwrite the original public_id with the transformed bytes.
    // Build a Cloudinary transformation that:
    // - stamps ONLY "Claimed" in the center (site green, slightly larger, 95% opacity)
    // This avoids production font issues from server-side rendering and matches the desired simplified style.
    // Use Cloudinary's canonical string-based syntax for maximum compatibility:
    // 1) create a text layer (l_text)
    // 2) apply it with positioning/sizing and fl_layer_apply
    // Use structured transformation objects for the Upload API.
    // (Some Cloudinary accounts reject raw string transforms like `l_text:...` on upload.)
    const transformation: any[] = [
      {
        overlay: {
          font_family: 'Arial',
          font_size: 280,
          font_weight: 'bold',
          text: 'Claimed',
        },
        color: 'rgb:7B894C',
        opacity: 85,
      },
      {
        flags: ['layer_apply', 'relative'],
        gravity: 'center',
        crop: 'fit',
        width: 0.9,
      },
    ];

    // Apply the transformation via the authenticated Upload API and overwrite the existing asset.
    // This avoids relying on unsigned "delivery URL" transformations which can be blocked by
    // account settings (e.g. strict transformations).
    console.log('Uploading to Cloudinary with overwrite + incoming transformation...');
    const uploadResult = await cloudinary.uploader.upload(imageUrl, {
      public_id: publicId,
      resource_type: 'image',
      overwrite: true,
      invalidate: true,
      transformation,
      format: originalExt === 'jpeg' ? 'jpg' : originalExt,
    });
    console.log('Upload successful, new URL:', uploadResult?.secure_url);
    console.log('Upload result public_id:', uploadResult?.public_id);
    
    // Update caption automatically for claimed designs (so admin + live site show the "no longer available" message)
    const claimedCaption =
      "This flash design is no longer available. If you'd like a similar custom design please email SweetPotatoTattoo@gmail.com";
    try {
      // Normalize once (matches normalization strategy in /api/upload/:collection PUT)
      let captionKey = imageUrl as string;
      try {
        captionKey = decodeURIComponent(captionKey);
      } catch {}
      await kv.hset('captions', { [captionKey]: claimedCaption });
    } catch (e) {
      console.error('Failed to set claimed caption in KV:', e);
      // Non-fatal; image claim should still succeed
    }

    // Mark as claimed in KV.
    // Store a few URL variations because encoding mismatches (especially spaces) have historically
    // caused "claimed" lookups to miss in parts of the app.
    const claimedUpdates: Record<string, string> = { [imageUrl]: 'true' };
    try {
      const decoded = decodeURIComponent(imageUrl);
      claimedUpdates[decoded] = 'true';
      try {
        claimedUpdates[encodeURI(decoded)] = 'true';
      } catch {}
    } catch {}
    try {
      claimedUpdates[imageUrl.replace(/%20/g, '%2520')] = 'true';
    } catch {}
    try {
      const inputNoQuery = String(imageUrl).split('?')[0];
      claimedUpdates[stripCloudinaryVersion(inputNoQuery)] = 'true';
    } catch {}
    await kv.hset('flash-claimed', claimedUpdates);

    // IMPORTANT: Next/Image caches by `src` on the server. Cloudinary overwrite keeps the same public_id,
    // so we store a "rev" and append it as a query param to force immediate refresh across the site.
    // Use both the input URL and the returned URL as sources of truth for the stable key.
    // This guards against subtle encoding differences (e.g. spaces) that can otherwise prevent
    // cache-busting from taking effect on the live site.
    const inputNoQuery = String(imageUrl).split('?')[0];
    const stableUrlFromInput = stripCloudinaryVersion(inputNoQuery);
    const stableUrlFromResult = stripCloudinaryVersion(uploadResult.secure_url);
    const rev = Date.now().toString();
    const revUpdates: Record<string, string> = {
      [stableUrlFromInput]: rev,
      [stableUrlFromResult]: rev,
    };
    // Also write common encoding variants to be resilient to older stored URLs.
    try {
      revUpdates[decodeURIComponent(stableUrlFromInput)] = rev;
    } catch {}
    try {
      revUpdates[encodeURI(stableUrlFromInput)] = rev;
    } catch {}
    try {
      revUpdates[stableUrlFromInput.replace(/%20/g, '%2520')] = rev;
    } catch {}
    await kv.hset('flash-image-rev', revUpdates);
    
    return NextResponse.json({ 
      success: true,
      url: uploadResult.secure_url,
      stableUrl: stableUrlFromResult,
      stableUrlFromInput,
      rev,
      caption: claimedCaption,
      message: 'Image has been marked as claimed and updated'
    });
    
  } catch (error: any) {
    console.error('Error processing claimed image:', error);
    return NextResponse.json({ 
      error: 'Failed to process image',
      details: error.message 
    }, { status: 500 });
  }
}

