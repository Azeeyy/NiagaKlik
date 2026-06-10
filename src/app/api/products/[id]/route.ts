import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const product = await Product.findById(params.id).lean();
    if (!product) return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
    return NextResponse.json({ product });
  } catch (error: any) {
    return NextResponse.json({ error: 'Gagal mengambil produk' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const data = await req.json();
    const product = await Product.findById(params.id);

    if (!product) return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
    if (product.sellerId.toString() !== user._id.toString() && user.role !== 'operator') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    Object.assign(product, data);
    await product.save();

    return NextResponse.json({ product, message: 'Produk diperbarui' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Gagal memperbarui produk' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const product = await Product.findById(params.id);
    if (!product) return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
    if (product.sellerId.toString() !== user._id.toString() && user.role !== 'operator') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await Product.findByIdAndDelete(params.id);
    return NextResponse.json({ message: 'Produk dihapus' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Gagal menghapus produk' }, { status: 500 });
  }
}
