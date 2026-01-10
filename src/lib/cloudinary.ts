import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

// Helper to get public URL from Cloudinary upload result
export function getCloudinaryUrl(publicId: string, folder?: string): string {
  const fullPublicId = folder ? `${folder}/${publicId}` : publicId;
  return cloudinary.url(fullPublicId, {
    secure: true,
    fetch_format: 'auto',
    quality: 'auto',
  });
}

