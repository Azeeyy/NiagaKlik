import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Wallet from '@/lib/models/Wallet';
import { getAuthUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const { amount } = await req.json();

    if (!amount || amount < 10000) {
      return NextResponse.json({ error: 'Minimal top-up Rp 10.000' }, { status: 400 });
    }

    let wallet = await Wallet.findOne({ userId: user._id });
    if (!wallet) {
      wallet = await Wallet.create({
        userId: user._id,
        balance: 0,
        pendingBalance: 0,
        transactions: [],
      });
    }

    wallet.balance += amount;
    wallet.transactions.push({
      type: 'topup',
      amount,
      description: 'Top-up saldo',
      status: 'success',
      createdAt: new Date(),
    });
    await wallet.save();

    return NextResponse.json({
      wallet,
      message: `Top-up ${amount.toLocaleString('id-ID')} berhasil`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
