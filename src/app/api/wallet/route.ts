import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Wallet from '@/lib/models/Wallet';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    let wallet = await Wallet.findOne({ userId: user._id });

    if (!wallet) {
      wallet = await Wallet.create({
        userId: user._id,
        balance: 0,
        pendingBalance: 0,
        transactions: [],
      });
    }

    return NextResponse.json({ wallet });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
