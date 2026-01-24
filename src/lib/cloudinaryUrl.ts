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


