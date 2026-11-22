import 'server-only';

let initialized = false;
let cloudinaryInstance: any = null;

interface CloudinaryConfig {
  cloud_name: string;
  api_key: string;
  api_secret: string;
  secure?: boolean;
}

interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  resource_type: string;
  created_at: string;
}

interface SignedUploadParams {
  signature: string;
  timestamp: number;
  api_key: string;
  folder: string;
  resource_type: string;
  transformation?: string;
  overwrite: boolean;
  unique_filename: boolean;
  use_filename: boolean;
}

export async function getCloudinary(): Promise<any> {
  if (initialized) return cloudinaryInstance;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary config missing. Check CLOUDINARY_* env vars.');
  }

  // Dynamic import to avoid build-time dependency
  const { v2: cloudinary } = await import('cloudinary');

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

export async function generateSignedUploadParams(
  folder: string,
  options: {
    resourceType?: 'image' | 'video' | 'raw';
    maxFileSize?: number;
    allowedFormats?: string[];
    transformation?: {
      width?: number;
      height?: number;
      quality?: string | number;
      fetchFormat?: string;
    };
  } = {}
): Promise<{ params: Record<string, string>; folder: string }> {
  const cloudinary = await getCloudinary();
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary config missing. Check CLOUDINARY_* env vars.');
  }

  const timestamp = Math.round(Date.now() / 1000);
  const resourceType = 'image'; // We only support images for now

  // Build transformation string
  let transformation = '';
  const transformationParts: string[] = ['q_auto', 'f_auto'];
  // transformationParts.push('q_auto', 'f_auto'); // Quality auto, format auto

  // Build the params to sign
  const paramsToSign: Record<string, any> = {
    timestamp,
    folder,
    resource_type: 'image',
    overwrite: false,
    unique_filename: true,
    use_filename: true,
  };

  // Note: We don't include transformation in signed params for security
  // The transformation is applied on upload but not signed

  const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret!);

  const params: Record<string, string> = {
    signature,
    timestamp: timestamp.toString(),
    api_key: cloudinary.config().api_key!,
    folder,
    resource_type: 'image',
    overwrite: 'false',
    unique_filename: 'true',
    use_filename: 'true',
  };

  // Add transformation as unsigned parameter (client will include it)
  // The transformation is NOT signed for security

  return { params, folder };
}

export async function deleteImage(publicId: string): Promise<void> {
  const cloudinary = await getCloudinary();
  await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
}

export async function deleteImagesByPrefix(prefix: string): Promise<number> {
  const cloudinary = await getCloudinary();
  let deletedCount = 0;
  let nextCursor: string | undefined;

  do {
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix,
      max_results: 500,
      next_cursor: nextCursor,
    });

    if (result.resources && result.resources.length > 0) {
      const publicIds = result.resources.map((r: any) => r.public_id);
      await cloudinary.api.delete_resources(publicIds);
      deletedCount += publicIds.length;
    }

    nextCursor = result.next_cursor;
  } while (nextCursor);

  return deletedCount;
}

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}