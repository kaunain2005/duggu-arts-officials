import 'server-only';

// Cloudinary integration postponed to Phase 4
// This file provides placeholder types and functions

let initialized = false;
let cloudinaryInstance: CloudinaryV2 | null = null;

interface CloudinaryConfig {
  cloud_name: string;
  api_key: string;
  api_secret: string;
  secure?: boolean;
}

interface CloudinaryV2 {
  config(options: CloudinaryConfig): void;
}

export async function initCloudinary(): Promise<CloudinaryV2> {
  if (initialized) return cloudinaryInstance!;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary config missing. Check CLOUDINARY_* env vars.');
  }

  // Dynamic import to avoid build-time dependency
  const { v2: cloudinary } = (await import('cloudinary')) as { v2: CloudinaryV2 };

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  cloudinaryInstance = cloudinary;
  initialized = true;
  return cloudinaryInstance;
}

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}
