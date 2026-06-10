import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { validateFile, uploadToUploadthing } from '@/lib/uploadthing';

const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get('avatar') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada file yang diupload' }, { status: 400 });
    }

    // Validate file
    const validationError = validateFile(file, MAX_AVATAR_SIZE);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // Upload to Uploadthing
    const uploadedFile = await uploadToUploadthing(file);

    return NextResponse.json({
      url: uploadedFile.url,
      message: 'Avatar berhasil diupload',
    });
  } catch (error: any) {
    console.error('Avatar upload error:', error);
    return NextResponse.json({ error: 'Gagal upload avatar' }, { status: 500 });
  }
}
