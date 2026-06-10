import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { validateFile, uploadMultipleToUploadthing } from '@/lib/uploadthing';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'penjual') return NextResponse.json({ error: 'Hanya penjual yang bisa upload gambar' }, { status: 403 });

    const formData = await req.formData();
    const files = formData.getAll('images') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'Tidak ada file yang diupload' }, { status: 400 });
    }

    if (files.length > 5) {
      return NextResponse.json({ error: 'Maksimal 5 gambar' }, { status: 400 });
    }

    // Validate files
    for (const file of files) {
      const validationError = validateFile(file);
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }
    }

    // Upload to Uploadthing
    const uploadedFiles = await uploadMultipleToUploadthing(files);

    const urls = uploadedFiles.map(f => f.url);

    return NextResponse.json({
      urls,
      message: `${uploadedFiles.length} gambar berhasil diupload`,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message || 'Gagal upload gambar' }, { status: 500 });
  }
}
