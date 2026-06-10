import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import User from '@/lib/models/User';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const fullUser = await User.findById(user._id);
    return NextResponse.json({ addresses: fullUser?.addresses || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const data = await req.json();
    const fullUser = await User.findById(user._id);

    // If setting as default, unset other defaults
    if (data.isDefault) {
      fullUser.addresses.forEach((addr: any) => { addr.isDefault = false; });
    }

    // If first address, make it default
    if (fullUser.addresses.length === 0) {
      data.isDefault = true;
    }

    fullUser.addresses.push(data);
    await fullUser.save();

    return NextResponse.json({
      addresses: fullUser.addresses,
      message: 'Alamat ditambahkan',
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const data = await req.json();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const fullUser = await User.findById(user._id);

    // Handle set default
    if (data.setDefault) {
      fullUser.addresses.forEach((addr: any) => {
        addr.isDefault = addr._id.toString() === data.setDefault;
      });
      await fullUser.save();
      return NextResponse.json({ addresses: fullUser.addresses, message: 'Alamat utama diubah' });
    }

    // Update specific address
    if (id) {
      const addr = fullUser.addresses.id(id);
      if (!addr) return NextResponse.json({ error: 'Alamat tidak ditemukan' }, { status: 404 });

      if (data.isDefault) {
        fullUser.addresses.forEach((a: any) => { a.isDefault = false; });
      }

      Object.assign(addr, data);
      await fullUser.save();
      return NextResponse.json({ addresses: fullUser.addresses, message: 'Alamat diperbarui' });
    }

    return NextResponse.json({ error: 'ID alamat diperlukan' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID alamat diperlukan' }, { status: 400 });

    const fullUser = await User.findById(user._id);
    fullUser.addresses = fullUser.addresses.filter((addr: any) => addr._id.toString() !== id);

    // If deleted address was default, set first as default
    if (fullUser.addresses.length > 0 && !fullUser.addresses.some((a: any) => a.isDefault)) {
      fullUser.addresses[0].isDefault = true;
    }

    await fullUser.save();
    return NextResponse.json({ addresses: fullUser.addresses, message: 'Alamat dihapus' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
