/* eslint-disable @typescript-eslint/no-explicit-any */
// API route for applying claimed overlay to images

import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { createCanvas } from 'canvas';
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

    // Download the original image from Cloudinary
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      console.error('Failed to fetch image:', imageResponse.status, imageResponse.statusText);
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: 400 });
    }
    
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    console.log('Image downloaded, size:', imageBuffer.length);
    
    // Get image metadata
    const metadata = await sharp(imageBuffer).metadata();
    const width = metadata.width || 1000;
    const height = metadata.height || 1000;
    console.log('Image dimensions:', width, 'x', height);
    
    // Create dark overlay (15% black) - use a solid color image instead of SVG for reliability
    console.log('Creating dark overlay...');
    const darkOverlay = await sharp({
      create: {
        width: width,
        height: height,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0.15 }
      }
    })
    .png()
    .toBuffer();
    console.log('Dark overlay created, size:', darkOverlay.length);
    
    // Create text box and claimed text using canvas for reliable text rendering
    // Scale appropriately for large images (these are often 3k–6k px wide)
    // Wider box so the message typically wraps to ~3 lines (not 4),
    // but keep a guaranteed margin so it never butts against the image edges.
    const outerMarginX = Math.max(28, Math.round(width * 0.035));
    const textBoxWidth = Math.min(Math.max(0, width - outerMarginX * 2), 1600);
    // Slightly shorter box to reduce unused top/bottom space
    const textBoxHeight = Math.max(175, Math.round(height * 0.14));
    // Top padding (y-position) so the box stays comfortably away from the top edge.
    const padding = Math.max(32, Math.round(height * 0.035));
    // Reduce top/bottom padding so the text can be larger and fill the box better.
    const boxInnerPadding = Math.max(6, Math.round(textBoxHeight * 0.05));

    // Target text size (we'll auto-fit down if it would overflow).
    // Use box width (not full image width) + a tighter clamp to keep sizing more consistent across images.
    const targetFontSize = Math.max(68, Math.min(92, Math.round(textBoxWidth / 18)));
    
    const mainText = "This flash is no longer available. If you'd like a similar custom design, please email";
    const emailText = "SweetPotatoTattoo@gmail.com";
    
    // Create text box overlay using canvas
    console.log('Creating text box overlay with canvas...');
    const textBoxCanvas = createCanvas(width, height);
    const textBoxCtx = textBoxCanvas.getContext('2d');
    
    // Ensure transparent background
    textBoxCtx.clearRect(0, 0, width, height);
    
    // Draw white box (no border per request)
    const boxX = (width - textBoxWidth) / 2;
    // Slight translucency so the artwork shows through a touch (requested).
    // Note: re-claiming the same image multiple times can reveal older overlays underneath;
    // if that becomes an issue again we can bump this up slightly.
    textBoxCtx.fillStyle = 'rgba(255, 255, 255, 0.90)';
    
    // Use beginPath and rounded rectangle path (roundRect might not be available)
    textBoxCtx.beginPath();
    const radius = 8;
    textBoxCtx.moveTo(boxX + radius, padding);
    textBoxCtx.lineTo(boxX + textBoxWidth - radius, padding);
    textBoxCtx.quadraticCurveTo(boxX + textBoxWidth, padding, boxX + textBoxWidth, padding + radius);
    textBoxCtx.lineTo(boxX + textBoxWidth, padding + textBoxHeight - radius);
    textBoxCtx.quadraticCurveTo(boxX + textBoxWidth, padding + textBoxHeight, boxX + textBoxWidth - radius, padding + textBoxHeight);
    textBoxCtx.lineTo(boxX + radius, padding + textBoxHeight);
    textBoxCtx.quadraticCurveTo(boxX, padding + textBoxHeight, boxX, padding + textBoxHeight - radius);
    textBoxCtx.lineTo(boxX, padding + radius);
    textBoxCtx.quadraticCurveTo(boxX, padding, boxX + radius, padding);
    textBoxCtx.closePath();
    textBoxCtx.fill();
    // No stroke (border) on the box
    
    // Draw text - auto-wrap + auto-fit to box
    const textX = width / 2;
    const boxY = padding;
    const maxTextWidth = textBoxWidth - boxInnerPadding * 2;

    // Note: on the server we use `canvas`'s context type, not the DOM CanvasRenderingContext2D.
    const wrapText = (text: string, ctx: any, maxWidth: number): string[] => {
      const words = text.split(/\s+/).filter(Boolean);
      const lines: string[] = [];
      let current = '';
      for (const w of words) {
        const test = current ? `${current} ${w}` : w;
        if (ctx.measureText(test).width <= maxWidth) {
          current = test;
        } else {
          if (current) lines.push(current);
          current = w;
        }
      }
      if (current) lines.push(current);
      return lines;
    };

    const fitAndDraw = () => {
      // Start at a slightly larger target, then scale down until it fits.
      let fontSize = targetFontSize;
      let emailFontSize = Math.round(fontSize * 1.05);
        // Tighten line height to reduce wasted vertical space.
        let lineHeight = Math.round(fontSize * 1.06);

      // Allow up to 4 wrapped lines before shrinking (reduces "random" font shrinking across images).
      for (let i = 0; i < 14; i++) {
        textBoxCtx.font = `normal ${fontSize}px "Arial", "Helvetica", sans-serif`;
        const wrapped = wrapText(mainText, textBoxCtx, maxTextWidth);
        const lines = wrapped.slice(0, 4);

        // If we truncated to 4 lines, try a bit smaller so more fits naturally.
        const didTruncate = wrapped.length > 4;

        const totalMainHeight = lines.length * lineHeight;
        const totalHeight = totalMainHeight + Math.round(emailFontSize * 1.0);
        const available = textBoxHeight - boxInnerPadding * 2;

        // Also ensure the *widest* line fits (defensive).
        const widest = lines.reduce((m, line) => Math.max(m, textBoxCtx.measureText(line).width), 0);

        if (!didTruncate && widest <= maxTextWidth && totalHeight <= available) {
          // Vertically center within the box
          const centeredOffset = Math.max(0, Math.round((available - totalHeight) / 2));
          let y = boxY + boxInnerPadding + centeredOffset;

          // Main text in black
          textBoxCtx.fillStyle = '#000000';
          textBoxCtx.textAlign = 'center';
          textBoxCtx.textBaseline = 'top';
          textBoxCtx.font = `normal ${fontSize}px "Arial", "Helvetica", sans-serif`;
          for (const line of lines) {
            textBoxCtx.fillText(line, textX, y);
            y += lineHeight;
          }

          // Email in green (bold)
          textBoxCtx.fillStyle = 'rgb(123, 137, 76)';
          textBoxCtx.font = `bold ${emailFontSize}px "Arial", "Helvetica", sans-serif`;
          // Smaller gap before email so everything feels tighter.
          y += Math.round(fontSize * 0.03);
          textBoxCtx.fillText(emailText, textX, y);

          console.log('Text fit OK:', { fontSize, emailFontSize, lines });
          return;
        }

        // Scale down a bit and retry
        fontSize = Math.round(fontSize * 0.94);
        emailFontSize = Math.round(fontSize * 1.05);
        lineHeight = Math.round(fontSize * 1.06);
      }

      // Fallback: draw with a safe smaller font
      const fallbackFont = Math.max(28, Math.round(targetFontSize * 0.65));
      const fallbackEmail = Math.round(fallbackFont * 1.05);
      const fallbackLineHeight = Math.round(fallbackFont * 1.18);
      textBoxCtx.font = `normal ${fallbackFont}px "Arial", "Helvetica", sans-serif`;
      const lines = wrapText(mainText, textBoxCtx, maxTextWidth).slice(0, 3);
      let y = boxY + boxInnerPadding;
      textBoxCtx.fillStyle = '#000000';
      textBoxCtx.textAlign = 'center';
      textBoxCtx.textBaseline = 'top';
      for (const line of lines) {
        textBoxCtx.fillText(line, textX, y);
        y += fallbackLineHeight;
      }
      textBoxCtx.fillStyle = 'rgb(123, 137, 76)';
      textBoxCtx.font = `bold ${fallbackEmail}px "Arial", "Helvetica", sans-serif`;
      y += Math.round(fallbackFont * 0.12);
      textBoxCtx.fillText(emailText, textX, y);
      console.log('Text fit fallback used:', { fallbackFont, fallbackEmail, lines });
    };

    fitAndDraw();
    
    const textBoxBuffer = textBoxCanvas.toBuffer('image/png');
    console.log('Text box canvas created, size:', textBoxBuffer.length);
    
    // Create "Claimed." text using canvas
    // Bigger "Claimed." — bump slightly
    const claimedFontSize = Math.max(120, Math.min(225, Math.round(width / 23)));
    console.log('Creating claimed text overlay with canvas...');
    const claimedCanvas = createCanvas(width, height);
    const claimedCtx = claimedCanvas.getContext('2d');
    
    // Ensure transparent background
    claimedCtx.clearRect(0, 0, width, height);
    
    // Draw "Claimed." text at bottom right
    // Website green, no hard outline; use a subtle shadow for contrast.
    claimedCtx.fillStyle = 'rgb(123, 137, 76)'; // #7B894C
    claimedCtx.shadowColor = 'rgba(0,0,0,0.35)';
    claimedCtx.shadowBlur = Math.max(6, Math.round(claimedFontSize * 0.12));
    claimedCtx.shadowOffsetX = 0;
    claimedCtx.shadowOffsetY = Math.max(2, Math.round(claimedFontSize * 0.04));
    claimedCtx.font = `bold ${claimedFontSize}px "Arial", "Helvetica", sans-serif`;
    claimedCtx.textAlign = 'right';
    claimedCtx.textBaseline = 'bottom';
    
    const claimedX = width - Math.max(60, Math.round(width * 0.015));
    const claimedY = height - Math.max(60, Math.round(width * 0.015));
    
    // Measure text
    const claimedMetrics = claimedCtx.measureText('Claimed.');
    console.log('Claimed text width:', claimedMetrics.width, 'height:', claimedMetrics.actualBoundingBoxAscent + claimedMetrics.actualBoundingBoxDescent);
    
    claimedCtx.fillText('Claimed.', claimedX, claimedY);
    
    const claimedBuffer = claimedCanvas.toBuffer('image/png');
    console.log('Claimed canvas created, size:', claimedBuffer.length);
    
    // Composite all layers: original image, dark overlay, text box, claimed text
    console.log('Compositing image layers...');
    console.log('Dark overlay size:', darkOverlay.length);
    console.log('Text box overlay size:', textBoxBuffer.length);
    console.log('Claimed overlay size:', claimedBuffer.length);
    
    // Preserve original format
    const originalFormat = metadata.format || 'jpg';
    console.log('Original format:', originalFormat);
    
    // Verify overlay buffers are valid images before compositing
    console.log('Verifying overlay buffers...');
    try {
      const darkOverlayMeta = await sharp(darkOverlay).metadata();
      console.log('Dark overlay valid:', darkOverlayMeta.width, 'x', darkOverlayMeta.height, 'format:', darkOverlayMeta.format);
    } catch (e) {
      console.error('Dark overlay invalid:', e);
    }
    
    try {
      const textBoxMeta = await sharp(textBoxBuffer).metadata();
      console.log('Text box overlay valid:', textBoxMeta.width, 'x', textBoxMeta.height, 'format:', textBoxMeta.format, 'hasAlpha:', textBoxMeta.hasAlpha);
    } catch (e) {
      console.error('Text box overlay invalid:', e);
    }
    
    try {
      const claimedMeta = await sharp(claimedBuffer).metadata();
      console.log('Claimed overlay valid:', claimedMeta.width, 'x', claimedMeta.height, 'format:', claimedMeta.format, 'hasAlpha:', claimedMeta.hasAlpha);
    } catch (e) {
      console.error('Claimed overlay invalid:', e);
    }
    
    // Process image and maintain original format
    // Try compositing step by step to debug
    console.log('Starting step-by-step compositing...');
    let processedImage: Buffer;
    
    try {
      // Convert base image to RGBA to support alpha compositing properly
      // This ensures the base image can handle transparent overlays
      let baseImage = await sharp(imageBuffer)
        .ensureAlpha() // Ensure alpha channel exists
        .toBuffer();
      console.log('Base image converted to RGBA, size:', baseImage.length);
      
      // First, apply dark overlay
      let step1 = await sharp(baseImage)
        .composite([{ input: darkOverlay, blend: 'over' }])
        .toBuffer();
      console.log('Step 1 (dark overlay) complete, size:', step1.length);
      
      // Then add text box
      let step2 = await sharp(step1)
        .composite([{ input: textBoxBuffer, blend: 'over' }])
        .toBuffer();
      console.log('Step 2 (text box) complete, size:', step2.length);
      
      // Finally add claimed text
      let step3 = await sharp(step2)
        .composite([{ input: claimedBuffer, blend: 'over' }])
        .toBuffer();
      console.log('Step 3 (claimed text) complete, size:', step3.length);
      
      // Now convert to final format
      if (originalFormat === 'png' || originalFormat === 'webp') {
        processedImage = await sharp(step3)
          .toFormat(originalFormat)
          .toBuffer();
      } else {
        // For JPEG, remove alpha channel and compress
        processedImage = await sharp(step3)
          .removeAlpha() // Remove alpha for JPEG
          .jpeg({ quality: 95, mozjpeg: true })
          .toBuffer();
      }
      console.log('Final format conversion complete, size:', processedImage.length);
      
    } catch (compositeError: any) {
      console.error('Error during step-by-step compositing:', compositeError);
      // Fallback to single composite
      if (originalFormat === 'png' || originalFormat === 'webp') {
        processedImage = await sharp(imageBuffer)
          .composite([
            { input: darkOverlay, blend: 'over' },
            { input: textBoxBuffer, blend: 'over' },
            { input: claimedBuffer, blend: 'over' }
          ])
          .toFormat(originalFormat)
          .toBuffer();
      } else {
        processedImage = await sharp(imageBuffer)
          .composite([
            { input: darkOverlay, blend: 'over' },
            { input: textBoxBuffer, blend: 'over' },
            { input: claimedBuffer, blend: 'over' }
          ])
          .jpeg({ quality: 95, mozjpeg: true })
          .toBuffer();
      }
    }
    
    // Verify the processed image is different from original
    if (processedImage.length === imageBuffer.length) {
      console.warn('Warning: Processed image size matches original - overlays may not have been applied');
    } else {
      console.log('Image size changed - overlays should be applied');
    }
    
    // Extract public_id from Cloudinary URL
    // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{folder}/{public_id}.{ext}
    const urlParts = imageUrl.split('/');
    const uploadIndex = urlParts.findIndex((part: string) => part === 'upload');
    if (uploadIndex === -1) {
      console.error('Invalid Cloudinary URL - no "upload" found:', imageUrl);
      return NextResponse.json({ error: 'Invalid Cloudinary URL' }, { status: 400 });
    }
    
    // Get the path after 'upload' (skip version if present)
    const afterUpload = urlParts.slice(uploadIndex + 1);
    // Remove version (v1234567890) if present and get the rest
    const publicIdParts = afterUpload.filter((part: string) => !part.match(/^v\d+$/));
    const publicIdWithExt = publicIdParts.join('/').split('?')[0]; // Remove query params
    const publicId = publicIdWithExt.replace(/\.[^/.]+$/, ''); // Remove extension
    
    console.log('Extracted public_id:', publicId);
    console.log('Uploading to Cloudinary with overwrite...');
    
    // Verify the processed image actually has the overlays by checking metadata
    console.log('Verifying processed image...');
    const processedMeta = await sharp(processedImage).metadata();
    console.log('Processed image metadata:', {
      width: processedMeta.width,
      height: processedMeta.height,
      format: processedMeta.format,
      size: processedImage.length
    });
    
    // Upload back to Cloudinary with overwrite
    // Don't specify format/quality - let Cloudinary use what we send
    console.log('Uploading to Cloudinary...');
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          resource_type: 'image',
          overwrite: true, // This overwrites the original image
          invalidate: true, // Invalidate CDN cache
          // Don't specify format/quality - preserve what we send
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log('Upload successful, new URL:', result?.secure_url);
            console.log('Upload result public_id:', result?.public_id);
            resolve(result);
          }
        }
      );
      uploadStream.end(processedImage);
    }) as any;
    
    // Mark as claimed in KV
    await kv.hset('flash-claimed', { [imageUrl]: 'true' });

    // IMPORTANT: Next/Image caches by `src` on the server. Cloudinary overwrite keeps the same public_id,
    // so we store a "rev" and append it as a query param to force immediate refresh across the site.
    const stableUrl = stripCloudinaryVersion(uploadResult.secure_url);
    const rev = Date.now().toString();
    await kv.hset('flash-image-rev', { [stableUrl]: rev });
    
    return NextResponse.json({ 
      success: true,
      url: uploadResult.secure_url,
      stableUrl,
      rev,
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

