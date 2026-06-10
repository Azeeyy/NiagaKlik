import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Wallet from '@/lib/models/Wallet';
import { getAuthUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const { amount, destination } = await req.json();

    if (!amount || amount < 50000) {
      return NextResponse.json({ error: 'Minimal penarikan Rp 50.000' }, { status: 400 });
    }

    let wallet = await Wallet.findOne({ userId: user._id });
    if (!wallet) {
      return NextResponse.json({ error: 'Dompet tidak ditemukan' }, { status: 404 });
    }

    if (wallet.balance < amount) {
      return NextResponse.json({ error: 'Saldo tidak mencukupi' }, { status: 400 });
    }

    wallet.balance -= amount;
    wallet.transactions.push({
      type: 'withdrawal',
      amount,
      description: `Penarikan ke ${destination || 'Rekening Bank'}`,
      status: 'success',
      createdAt: new Date(),
    });
    await wallet.save();

    return NextResponse.json({
      wallet,
      message: `Penarikan ${amount.toLocaleString('id-ID')} berhasil diproses`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
