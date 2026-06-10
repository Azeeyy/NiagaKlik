import { UTApi } from 'uploadthing/server';

export const utapi = new UTApi();

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB

export interface UploadResult {
  url: string;
  key: string;
  name: string;
  size: number;
}

export function validateFile(file: File, maxSize: number = MAX_IMAGE_SIZE): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `Tipe file "${file.type}" tidak didukung. Gunakan JPEG, PNG, WebP, atau GIF.`;
  }
  if (file.size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024);
    return `File "${file.name}" terlalu besar. Maksimal ${maxSizeMB}MB per gambar.`;
  }
  return null;
}

export async function uploadToUploadthing(file: File): Promise<UploadResult> {
  const response = await utapi.uploadFiles(file);

  if (response.error) {
    throw new Error(response.error.message || 'Upload gagal');
  }

  return {
    url: response.data.url,
    key: response.data.key,
    name: response.data.name,
    size: response.data.size,
  };
}

export async function uploadMultipleToUploadthing(files: File[]): Promise<UploadResult[]> {
  const response = await utapi.uploadFiles(files);

  return response.map((r) => {
    if (r.error) {
      throw new Error(r.error.message || 'Upload gagal');
    }
    return {
      url: r.data.url,
      key: r.data.key,
      name: r.data.name,
      size: r.data.size,
    };
  });
}

export async function deleteFromUploadthing(fileKey: string): Promise<void> {
  await utapi.deleteFiles(fileKey);
}

export async function deleteMultipleFromUploadthing(fileKeys: string[]): Promise<void> {
  await utapi.deleteFiles(fileKeys);
}
