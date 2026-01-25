import type { ImageLoaderProps } from 'next/image';

export function stripCloudinaryVersion(url: string): string {
  // Cloudinary URLs often include a version segment like:
  //   .../image/upload/v1234567890/folder/public_id.jpg
  // or with transformations:
  //   .../image/upload/c_fill,w_800/v1234567890/folder/public_id.jpg
  //
  // For "overwrite" workflows we want a stable URL that always resolves to the latest version,
  // so we remove the `/v123.../` segment (if present).
  return url.replace(/\/upload\/(.*?)(?:v\d+\/)/, '/upload/$1');
}

export function withCacheBuster(url: string, rev?: string | number): string {
  if (!rev) return url;
  const revStr = String(rev);
  const joiner = url.includes('?') ? '&' : '?';
  return `${url}${joiner}rev=${encodeURIComponent(revStr)}`;
}

export function getStableCloudinaryUrl(url: string, rev?: string | number): string {
  return withCacheBuster(stripCloudinaryVersion(url), rev);
}

/**
 * Cloudinary loader for Next.js <Image>.
 *
 * Important: Using a custom loader means images are requested directly from Cloudinary
 * (no `/_next/image` proxying), which reduces Vercel Image Optimization usage.
 */
export function cloudinaryLoader({ src, width, quality }: ImageLoaderProps): string {
  // Only transform absolute Cloudinary URLs; leave local/static assets untouched.
  if (!src.startsWith('http')) return src;
  if (!src.includes('res.cloudinary.com')) return src;

  const q = typeof quality === 'number' ? `q_${quality}` : 'q_auto';

  // Preserve query params (we use `?rev=` as a cache buster)
  const qIndex = src.indexOf('?');
  const base = qIndex >= 0 ? src.slice(0, qIndex) : src;
  const query = qIndex >= 0 ? src.slice(qIndex) : '';

  const marker = '/image/upload/';
  const idx = base.indexOf(marker);
  if (idx === -1) return src;

  const prefix = base.slice(0, idx + marker.length); // includes trailing slash after upload/
  const rest = base.slice(idx + marker.length);

  // `c_limit` prevents upscaling, `f_auto`/`q_auto` optimize format/quality, and width drives srcset.
  const transform = `f_auto,${q},c_limit,w_${width}`;
  return `${prefix}${transform}/${rest}${query}`;
}


