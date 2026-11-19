declare module 'cloudinary' {
  export interface ConfigOptions {
    cloud_name: string;
    api_key: string;
    api_secret: string;
    secure?: boolean;
  }

  export interface Cloudinary {
    config(options: ConfigOptions): void;
  }

  export const v2: Cloudinary;
}
