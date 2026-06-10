'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { PRODUCT_CATEGORIES } from '@/lib/utils';

function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); } },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, isVisible] as const;
}

function AnimatedSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const [ref, isVisible] = useScrollReveal(0.1);
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function AnimatedStat({ number, label, delay = 0 }: { number: string; label: string; delay?: number }) {
  const [ref, isVisible] = useScrollReveal(0.5);
  return (
    <div ref={ref} className="text-center">
      <p className={`text-4xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent transition-all duration-700 ease-out ${
        isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'
      }`} style={{ transitionDelay: `${delay}ms` }}>
        {number}
      </p>
      <p className={`text-sm text-gray-500 mt-2 transition-all duration-700 ease-out ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`} style={{ transitionDelay: `${delay + 100}ms` }}>
        {label}
      </p>
    </div>
  );
}

function FloatingOrb({ className, size, delay = 0 }: { className: string; size: string; delay?: number }) {
  return (
    <div
      className={`absolute rounded-full blur-3xl opacity-20 animate-float ${className}`}
      style={{
        width: size,
        height: size,
        animationDelay: `${delay}s`,
      }}
    />
  );
}

function Particles() {
  const [mounted, setMounted] = useState(false);
  const positions = useRef<Array<{ left: string; top: string; duration: string; delay: string; size: string }>>([]);

  useEffect(() => {
    // Generate stable random positions only on client to avoid hydration mismatch
    positions.current = [...Array(20)].map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      duration: `${4 + Math.random() * 6}s`,
      delay: `${Math.random() * 5}s`,
      size: `${2 + Math.random() * 3}px`,
    }));
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {positions.current.map((pos, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white/30 animate-float"
          style={{
            left: pos.left,
            top: pos.top,
            animationDuration: pos.duration,
            animationDelay: pos.delay,
            width: pos.size,
            height: pos.size,
          }}
        />
      ))}
    </div>
  );
}

function FeatureCard({ icon, title, desc, index }: { icon: string; title: string; desc: string; index: number }) {
  const [ref, isVisible] = useScrollReveal(0.2);
  return (
    <div
      ref={ref}
      className={`group bg-white border border-gray-100 rounded-2xl p-8 transition-all duration-700 ease-out hover:shadow-xl hover:border-primary-100 hover:-translate-y-1 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="w-14 h-14 bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:from-primary-100 group-hover:to-primary-200 transition-all duration-300">
        <span className="text-3xl">{icon}</span>
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors">{title}</h3>
      <p className="text-gray-500 leading-relaxed">{desc}</p>
    </div>
  );
}

export default function HomePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ products: 0, sellers: 0, buyers: 0, orders: 0 });

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const res = await fetch('/api/products?limit=8');
      const data = await res.json();
      setProducts(data.products || []);
      setStats(data.stats || { products: 0, sellers: 0, buyers: 0, orders: 0 });
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-900 overflow-hidden">
        {/* Animated background orbs */}
        <FloatingOrb className="top-[-5%] left-[-5%] bg-purple-400" size="500px" delay={0} />
        <FloatingOrb className="bottom-[-10%] right-[-5%] bg-blue-400" size="600px" delay={2} />
        <FloatingOrb className="top-[40%] right-[20%] bg-pink-400" size="300px" delay={4} />
        
        <Particles />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />

        <div className="relative w-full max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 py-24 lg:py-36">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
            <div className="animate-fade-in-up">
              <span className="inline-block px-5 py-2 bg-white/10 backdrop-blur-md text-white/90 text-sm rounded-full mb-8 border border-white/10 animate-fade-in-down">
                🎉 Marketplace Terpercaya No. 1 di Indonesia
              </span>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-[1.1] mb-8">
                Belanja Lebih{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-300 to-orange-300">
                  Cerdas
                </span>
                <br />
                Hemat &amp; Aman
              </h1>
              <p className="text-xl text-primary-100/90 mb-10 max-w-xl leading-relaxed">
                Temukan jutaan produk berkualitas dengan harga terbaik. Nikmati pengalaman belanja online yang aman, mudah, dan menyenangkan bersama NiagaKlik.
              </p>
              <div className="flex flex-wrap gap-5">
                <Link href="/products" className="group bg-white text-primary-700 px-10 py-4 rounded-2xl font-bold text-lg 
                                                    hover:bg-gray-50 transition-all duration-300 shadow-2xl shadow-primary-900/30
                                                    hover:shadow-primary-900/40 hover:-translate-y-0.5">
                  <span className="flex items-center gap-2">
                    Mulai Belanja
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </Link>
                <Link href="/register?role=penjual" className="group border-2 border-white/30 text-white px-10 py-4 rounded-2xl font-semibold text-lg 
                                                            hover:bg-white/10 hover:border-white/50 transition-all duration-300 backdrop-blur-sm">
                  Jadi Penjual
                </Link>
              </div>
              
              {/* Social proof */}
              <div className="flex items-center gap-6 mt-12 pt-8 border-t border-white/10">
                <div className="flex -space-x-3">
                  {['A', 'B', 'C', 'D'].map((letter, i) => (
                    <div key={i} 
                      className="w-11 h-11 rounded-full bg-gradient-to-br from-primary-300 to-purple-400 border-2 border-white/40 
                                  flex items-center justify-center text-white text-sm font-bold animate-fade-in-up"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    >
                      {letter}
                    </div>
                  ))}
                  <div className="w-11 h-11 rounded-full bg-primary-500 border-2 border-white/40 flex items-center justify-center text-white text-xs font-bold">
                    +{stats.buyers || 500}
                  </div>
                </div>
                <p className="text-primary-200/80 text-sm">
                  <span className="font-bold text-white">10,000+</span> Pembeli Aktif
                </p>
              </div>
            </div>
            
            {/* Hero right - animated cards */}
            <div className="hidden lg:block relative">
              <div className="relative w-full max-w-lg mx-auto">
                {/* Floating decorative elements */}
                <div className="absolute -top-8 -right-8 w-32 h-32 bg-yellow-400/20 rounded-full blur-xl animate-float-slow" />
                <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-purple-400/20 rounded-full blur-xl animate-float-delayed" />
                
                <div className="relative bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
                  <div className="grid grid-cols-2 gap-5">
                    {[
                      { emoji: '🛍️', label: 'Belanja', color: 'from-blue-400/20 to-blue-500/20' },
                      { emoji: '📦', label: 'Packing', color: 'from-green-400/20 to-green-500/20' },
                      { emoji: '💳', label: 'Bayar', color: 'from-purple-400/20 to-purple-500/20' },
                      { emoji: '🚚', label: 'Kirim', color: 'from-orange-400/20 to-orange-500/20' },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className={`bg-gradient-to-br ${item.color} backdrop-blur-sm rounded-2xl p-7 text-center border border-white/10
                                    hover:scale-105 hover:border-white/30 transition-all duration-300 animate-fade-in-up`}
                        style={{ animationDelay: `${0.3 + i * 0.1}s` }}
                      >
                        <span className="text-5xl block mb-3">{item.emoji}</span>
                        <p className="text-white/70 text-sm font-medium">{item.label}</p>
                      </div>
                    ))}
                  </div>
                  
                  {/* Decorative line */}
                  <div className="mt-6 flex items-center gap-3 justify-center">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    <span className="text-white/40 text-xs font-medium">NiagaKlik</span>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-50 to-transparent" />
      </section>

      {/* Stats Bar - with scroll animation */}
      <section className="bg-white border-b border-gray-100 -mt-px">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            <AnimatedStat number="10,000+" label="Produk Tersedia" delay={0} />
            <AnimatedStat number="500+" label="Penjual Aktif" delay={150} />
            <AnimatedStat number="50,000+" label="Pembeli Puas" delay={300} />
            <AnimatedStat number="99.9%" label="Transaksi Aman" delay={450} />
          </div>
        </div>
      </section>

      {/* Categories - with stagger */}
      <section className="py-20 lg:py-28">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12">
          <AnimatedSection>
            <div className="flex items-end justify-between mb-12">
              <div>
                <span className="text-sm font-semibold text-primary-600 uppercase tracking-widest">Kategori</span>
                <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mt-2">
                  Jelajahi{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600">
                    Kategori
                  </span>
                </h2>
                <p className="text-gray-500 mt-3 text-lg">Temukan kebutuhan Anda dengan mudah</p>
              </div>
              <Link href="/products" className="hidden sm:flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold group">
                Lihat Semua
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </AnimatedSection>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
            {PRODUCT_CATEGORIES.map((category, index) => (
              <AnimatedSection key={index} delay={index * 50}>
                <Link
                  href={`/products?category=${encodeURIComponent(category)}`}
                  className="group block bg-white border border-gray-100 rounded-2xl p-6 text-center hover:shadow-xl hover:border-primary-100 hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl flex items-center justify-center group-hover:from-primary-100 group-hover:to-primary-200 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                    <span className="text-2xl">
                      {['📱', '👔', '👗', '🍕', '💊', '💄', '🏃', '🚗', '📚', '🎮', '🏠', '⌚', '🎯'][index]}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-700 group-hover:text-primary-600 transition-colors">
                    {category}
                  </p>
                </Link>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-20 lg:py-28">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12">
          <AnimatedSection>
            <div className="flex items-end justify-between mb-12">
              <div>
                <span className="text-sm font-semibold text-primary-600 uppercase tracking-widest">Produk</span>
                <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mt-2">
                  Produk{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600">
                    Terbaru
                  </span>
                </h2>
                <p className="text-gray-500 mt-3 text-lg">Produk pilihan terbaru untuk Anda</p>
              </div>
              <Link href="/products" className="hidden sm:flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold group">
                Lihat Semua
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </AnimatedSection>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
                  <div className="aspect-square skeleton"></div>
                  <div className="p-5 space-y-3">
                    <div className="h-4 skeleton w-1/3 rounded"></div>
                    <div className="h-5 skeleton w-2/3 rounded"></div>
                    <div className="h-4 skeleton w-1/2 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {products.map((product: any, i: number) => (
                <AnimatedSection key={product._id} delay={i * 80}>
                  <ProductCard product={product} />
                </AnimatedSection>
              ))}
            </div>
          ) : (
            <div className="text-center py-24">
              <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <p className="text-gray-500 text-lg">Belum ada produk tersedia.</p>
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 lg:py-28">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12">
          <AnimatedSection>
            <div className="text-center mb-16">
              <span className="text-sm font-semibold text-primary-600 uppercase tracking-widest">Keunggulan</span>
              <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mt-3 mb-4">
                Kenapa{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600">
                  NiagaKlik
                </span>
                ?
              </h2>
              <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                Kami hadir dengan berbagai keunggulan untuk membuat pengalaman belanja Anda lebih baik
              </p>
            </div>
          </AnimatedSection>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: '🔒',
                title: 'Transaksi Aman',
                desc: 'Sistem keamanan berlapis melindungi setiap transaksi Anda. Platform fee hanya 5%.'
              },
              {
                icon: '🚀',
                title: 'Pengiriman Cepat',
                desc: 'Dukungan berbagai kurir dengan fitur tracking real-time. Pesanan diproses dalam hitungan jam.'
              },
              {
                icon: '💎',
                title: 'Garansi Kualitas',
                desc: 'Jaminan produk original dengan sistem review dan rating dari pembeli sebelumnya.'
              },
              {
                icon: '💳',
                title: 'Multi Pembayaran',
                desc: 'Bayar pakai CN Wallet, QRIS, atau COD. Fleksibel sesuai kebutuhan Anda.'
              },
              {
                icon: '📱',
                title: 'Mudah & Praktis',
                desc: 'Antarmuka yang intuitif, cocok untuk semua kalangan. Belanja jadi lebih menyenangkan.'
              },
              {
                icon: '🎯',
                title: 'Sistem Pre-order',
                desc: 'Pesan produk pre-order favorit Anda dengan sistem PO yang transparan dan terpercaya.'
              },
            ].map((feature, i) => (
              <FeatureCard key={i} {...feature} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative bg-gradient-to-r from-primary-600 via-primary-700 to-purple-800 overflow-hidden">
        <FloatingOrb className="top-[-20%] right-[-10%] bg-purple-400" size="400px" delay={1} />
        <FloatingOrb className="bottom-[-20%] left-[-10%] bg-blue-400" size="350px" delay={3} />
        
        <div className="relative max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 py-24 lg:py-28 text-center">
          <AnimatedSection>
            <span className="inline-block px-5 py-2 bg-white/10 backdrop-blur-md text-white/80 text-sm rounded-full mb-6 border border-white/10">
              ✨ Mulai Perjalanan Anda
            </span>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-white mb-4">
              Siap Mulai Berjualan?
            </h2>
            <p className="text-primary-100/80 mb-10 max-w-2xl mx-auto text-lg leading-relaxed">
              Bergabunglah dengan ribuan penjual lainnya dan kembangkan bisnis Anda bersama NiagaKlik. 
              Daftar gratis, tanpa biaya bulanan!
            </p>
            <div className="flex flex-wrap justify-center gap-5">
              <Link
                href="/register?role=penjual"
                className="group bg-white text-primary-700 px-10 py-4 rounded-2xl font-bold text-lg 
                         hover:bg-gray-50 transition-all duration-300 shadow-2xl shadow-primary-900/30
                         hover:-translate-y-0.5"
              >
                <span className="flex items-center gap-2">
                  Daftar Jadi Penjual
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </Link>
              <Link
                href="/products"
                className="group border-2 border-white/30 text-white px-10 py-4 rounded-2xl font-semibold text-lg 
                         hover:bg-white/10 hover:border-white/50 transition-all duration-300 backdrop-blur-sm"
              >
                Jelajahi Produk
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
