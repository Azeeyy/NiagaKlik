import { config } from 'dotenv';
import { dbConnect } from './mongodb';
import User from './models/User';
import Wallet from './models/Wallet';
import Product from './models/Product';
import { hashPassword } from './auth';

async function seed() {
  config({ path: '.env.local' });
  
  try {
    await dbConnect();
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Wallet.deleteMany({});
    await Product.deleteMany({});
    console.log('Cleared existing data');

    // Create default users
    const hashedPassword = await hashPassword('password123');

    const pembeli = await User.create({
      name: 'Budi Santoso',
      email: 'pembeli@niagaklik.com',
      password: hashedPassword,
      role: 'pembeli',
      isVerified: true,
      phone: '081234567890',
      addresses: [
        {
          label: 'Rumah',
          fullAddress: 'Jl. Merdeka No. 123, RT 01 RW 02',
          province: 'DKI Jakarta',
          city: 'Jakarta Pusat',
          district: 'Gambir',
          postalCode: '10110',
          isDefault: true,
          recipientName: 'Budi Santoso',
          recipientPhone: '081234567890',
        },
      ],
    });

    const penjual = await User.create({
      name: 'Sari Wijaya',
      email: 'penjual@niagaklik.com',
      password: hashedPassword,
      role: 'penjual',
      isVerified: true,
      phone: '081234567891',
      addresses: [
        {
          label: 'Toko',
          fullAddress: 'Jl. Sudirman No. 45, Kav 12',
          province: 'DKI Jakarta',
          city: 'Jakarta Selatan',
          district: 'Setiabudi',
          postalCode: '12910',
          isDefault: true,
          recipientName: 'Sari Wijaya',
          recipientPhone: '081234567891',
        },
      ],
    });

    const operator = await User.create({
      name: 'Operator NiagaKlik',
      email: 'operator@niagaklik.com',
      password: hashedPassword,
      role: 'operator',
      isVerified: true,
      phone: '081234567892',
    });

    console.log('Created users:');
    console.log(`  Pembeli: pembeli@niagaklik.com / password123`);
    console.log(`  Penjual: penjual@niagaklik.com / password123`);
    console.log(`  Operator: operator@niagaklik.com / password123`);

    // Create wallets for pembeli and penjual
    const pembeliWallet = await Wallet.create({
      userId: pembeli._id,
      balance: 500000,
      pendingBalance: 0,
      transactions: [
        {
          type: 'topup',
          amount: 500000,
          description: 'Top-up saldo awal',
          status: 'success',
          createdAt: new Date(),
        },
      ],
    });

    const penjualWallet = await Wallet.create({
      userId: penjual._id,
      balance: 0,
      pendingBalance: 0,
      transactions: [],
    });

    console.log('Created wallets with initial balances');

    // Create sample products
    const sampleProducts = [
      {
        name: 'Smartphone XYZ Pro Max',
        description: 'Smartphone flagship terbaru dengan kamera 108MP, layar AMOLED 6.8 inch, baterai 5000mAh, dan prosesor tercepat. Dilengkapi dengan fitur AI canggih untuk pengalaman fotografi terbaik.',
        price: 12999000,
        originalPrice: 14999000,
        category: 'Elektronik',
        images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop'],
        stock: 15,
        sellerId: penjual._id,
        sellerName: penjual.name,
        condition: 'baru',
        weight: 250,
        tags: ['smartphone', 'elektronik', 'hp'],
        isActive: true,
      },
      {
        name: 'Sepatu Olahraga Air Max',
        description: 'Sepatu olahraga dengan teknologi Air Max terbaru. Nyaman dipakai untuk lari, gym, atau daily use. Tersedia dalam berbagai ukuran.',
        price: 899000,
        originalPrice: 1200000,
        category: 'Olahraga',
        images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop'],
        stock: 30,
        sellerId: penjual._id,
        sellerName: penjual.name,
        condition: 'baru',
        weight: 500,
        tags: ['sepatu', 'olahraga', 'airmax'],
        isActive: true,
      },
      {
        name: 'Kemeja Flanel Premium',
        description: 'Kemeja flanel bahan premium, nyaman dipakai sehari-hari. Cocok untuk gaya kasual maupun semi-formal. Tersedia berbagai motif menarik.',
        price: 149000,
        category: 'Fashion Pria',
        images: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=400&fit=crop'],
        stock: 50,
        sellerId: penjual._id,
        sellerName: penjual.name,
        condition: 'baru',
        weight: 200,
        tags: ['kemeja', 'flanel', 'fashion'],
        isActive: true,
      },
      {
        name: 'Tas Ransel Anti Air',
        description: 'Tas ransel anti air dengan kapasitas 35L. Dilengkapi kompartemen laptop, banyak saku, dan desain ergonomis. Cocok untuk traveling, kuliah, atau kerja.',
        price: 299000,
        originalPrice: 399000,
        category: 'Aksesoris',
        images: ['https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=400&h=400&fit=crop'],
        stock: 25,
        sellerId: penjual._id,
        sellerName: penjual.name,
        condition: 'baru',
        weight: 600,
        tags: ['tas', 'ransel', 'travel'],
        isActive: true,
      },
      {
        name: 'Set Skincare Lengkap',
        description: 'Paket skincare lengkap untuk perawatan wajah sehari-hari. Termasuk facial wash, toner, serum, moisturizer, dan sunscreen. Cocok untuk semua jenis kulit.',
        price: 199000,
        originalPrice: 299000,
        category: 'Kecantikan',
        images: ['https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop'],
        stock: 40,
        sellerId: penjual._id,
        sellerName: penjual.name,
        condition: 'baru',
        weight: 350,
        tags: ['skincare', 'kecantikan', 'perawatan'],
        isActive: true,
      },
      {
        name: 'Pre-Order: Action Figure Limited Edition',
        description: 'Action figure limited edition koleksi terbaru. Pre-order sekarang! Tersedia dalam jumlah terbatas. Setiap pembelian termasuk sertifikat keaslian.',
        price: 599000,
        category: 'Mainan & Hobi',
        images: ['https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=400&fit=crop'],
        stock: 100,
        sellerId: penjual._id,
        sellerName: penjual.name,
        isPreOrder: true,
        preOrderDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        preOrderEstimateDelivery: '45-60 hari setelah pre-order ditutup',
        condition: 'baru',
        weight: 800,
        tags: ['action-figure', 'koleksi', 'limited-edition'],
        isActive: true,
      },
    ];

    await Product.insertMany(sampleProducts);
    console.log(`Created ${sampleProducts.length} sample products`);

    console.log('\n✅ Seed completed successfully!');
    console.log('Login credentials:');
    console.log('  Pembeli:  pembeli@niagaklik.com / password123');
    console.log('  Penjual:  penjual@niagaklik.com / password123');
    console.log('  Operator: operator@niagaklik.com / password123');
    console.log(`\nPembeli wallet balance: Rp ${pembeliWallet.balance.toLocaleString('id-ID')}`);

    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
