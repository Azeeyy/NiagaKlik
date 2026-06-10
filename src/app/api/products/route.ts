import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const seller = searchParams.get('seller');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const sort = searchParams.get('sort') || 'terbaru';

    const query: any = { isActive: true };

    if (seller) {
      const user = await getAuthUser();
      if (user) query.sellerId = user._id;
      delete query.isActive; // Show all for seller
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) {
      query.category = category;
    }

    let sortQuery: any = { createdAt: -1 };
    if (sort === 'termurah') sortQuery = { price: 1 };
    else if (sort === 'termahal') sortQuery = { price: -1 };
    else if (sort === 'terlaris') sortQuery = { soldCount: -1 };

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sortQuery)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({ products, total, page, pages: Math.ceil(total / limit) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal mengambil produk' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'penjual') return NextResponse.json({ error: 'Hanya penjual yang bisa menambah produk' }, { status: 403 });

    await dbConnect();
    const data = await req.json();

    const product = await Product.create({
      ...data,
      sellerId: user._id,
      sellerName: user.name,
      images: data.images || [],
    });

    return NextResponse.json({ product, message: 'Produk berhasil ditambahkan' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal menambah produk' }, { status: 500 });
  }
}
