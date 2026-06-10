'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';

function useScrollReveal(threshold = 0.1) {
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

function AnimatedFooterSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const [ref, isVisible] = useScrollReveal(0.1);
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function Footer() {
  const { isLoggedIn } = useAuthStore();

  // Hide footer when user is logged in
  if (isLoggedIn) {
    return null;
  }

  return (
    <footer className="relative bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 text-gray-300 overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl animate-float-slow" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl animate-pulse-soft" />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
        backgroundSize: '30px 30px'
      }} />

      <div className="relative max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12">
        {/* Top decorative border */}
        <div className="pt-16 pb-12">
          <AnimatedFooterSection>
            <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
              {/* Brand */}
              <div className="lg:max-w-sm">
                <Link href="/" className="flex items-center gap-2.5 mb-5 group">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-900/30 group-hover:scale-105 transition-transform duration-300">
                    <span className="text-white font-bold text-xl">NK</span>
                  </div>
                  <span className="font-bold text-2xl text-white">NiagaKlik</span>
                </Link>
                <p className="text-gray-400 text-sm leading-relaxed mb-6">
                  Marketplace terpercaya untuk jual beli berbagai produk berkualitas. 
                  Belanja aman, mudah, dan menyenangkan bersama NiagaKlik.
                </p>
                {/* Social badges */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-primary-600/30 transition-all cursor-pointer group">
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
                    </svg>
                  </div>
                  <div className="w-9 h-9 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-primary-600/30 transition-all cursor-pointer group">
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </div>
                  <div className="w-9 h-9 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-primary-600/30 transition-all cursor-pointer group">
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-2 16h-2v-6h2v6zm-1-6.891c-.607 0-1.1-.496-1.1-1.109 0-.612.492-1.109 1.1-1.109s1.1.497 1.1 1.109c0 .613-.493 1.109-1.1 1.109zM17 16h-2v-3c0-.853-.565-1.5-1.373-1.5-.746 0-1.253.503-1.253 1.274V16h-2v-6h2v.812c.414-.56 1.044-.812 1.748-.812C15.826 10 17 11.037 17 13.2V16z"/>
                    </svg>
                  </div>
                  <div className="w-9 h-9 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-primary-600/30 transition-all cursor-pointer group">
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.167 6.839 9.49.5.09.682-.217.682-.482 0-.237-.009-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Links Grid */}
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-8 lg:gap-12">
                <div>
                  <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-5 flex items-center gap-2">
                    <span className="w-1 h-4 bg-primary-500 rounded-full" />
                    Belanja
                  </h3>
                  <ul className="space-y-3">
                    <li><Link href="/products" className="text-sm text-gray-400 hover:text-white transition-colors duration-200 hover:translate-x-1 inline-block">Semua Produk</Link></li>
                    <li><Link href="/products?category=Elektronik" className="text-sm text-gray-400 hover:text-white transition-colors duration-200 hover:translate-x-1 inline-block">Elektronik</Link></li>
                    <li><Link href="/products?category=Fashion+Pria" className="text-sm text-gray-400 hover:text-white transition-colors duration-200 hover:translate-x-1 inline-block">Fashion Pria</Link></li>
                    <li><Link href="/products?category=Fashion+Wanita" className="text-sm text-gray-400 hover:text-white transition-colors duration-200 hover:translate-x-1 inline-block">Fashion Wanita</Link></li>
                    <li><Link href="/products?category=Makanan+%26+Minuman" className="text-sm text-gray-400 hover:text-white transition-colors duration-200 hover:translate-x-1 inline-block">Makanan</Link></li>
                    <li><Link href="/products?category=Kesehatan" className="text-sm text-gray-400 hover:text-white transition-colors duration-200 hover:translate-x-1 inline-block">Kesehatan</Link></li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-5 flex items-center gap-2">
                    <span className="w-1 h-4 bg-purple-500 rounded-full" />
                    Bantuan
                  </h3>
                  <ul className="space-y-3">
                    <li><Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors duration-200 hover:translate-x-1 inline-block">Pusat Bantuan</Link></li>
                    <li><Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors duration-200 hover:translate-x-1 inline-block">Cara Belanja</Link></li>
                    <li><Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors duration-200 hover:translate-x-1 inline-block">Cara Jual</Link></li>
                    <li><Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors duration-200 hover:translate-x-1 inline-block">Kebijakan Privasi</Link></li>
                    <li><Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors duration-200 hover:translate-x-1 inline-block">Syarat & Ketentuan</Link></li>
                  </ul>
                </div>
                <div className="sm:col-span-1 col-span-2">
                  <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-5 flex items-center gap-2">
                    <span className="w-1 h-4 bg-orange-500 rounded-full" />
                    Hubungi Kami
                  </h3>
                  <ul className="space-y-4">
                    <li className="flex items-center gap-3 text-sm text-gray-400 group cursor-pointer">
                      <span className="w-9 h-9 bg-gray-800 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-primary-600/30 transition-colors">
                        <svg className="w-4 h-4 text-gray-400 group-hover:text-primary-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </span>
                      <span className="hover:text-white transition-colors">support@niagaklik.com</span>
                    </li>
                    <li className="flex items-center gap-3 text-sm text-gray-400 group cursor-pointer">
                      <span className="w-9 h-9 bg-gray-800 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-primary-600/30 transition-colors">
                        <svg className="w-4 h-4 text-gray-400 group-hover:text-primary-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </span>
                      <span className="hover:text-white transition-colors">021-1234-5678</span>
                    </li>
                    <li className="flex items-center gap-3 text-sm text-gray-400 group cursor-pointer">
                      <span className="w-9 h-9 bg-gray-800 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-primary-600/30 transition-colors">
                        <svg className="w-4 h-4 text-gray-400 group-hover:text-primary-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </span>
                      <span className="hover:text-white transition-colors">Bandung, Indonesia</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </AnimatedFooterSection>
        </div>

        {/* Stats Bar */}
        <AnimatedFooterSection delay={100}>
          <div className="py-10 border-t border-gray-800/80">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { number: '10,000+', label: 'Produk' },
                { number: '500+', label: 'Penjual' },
                { number: '50,000+', label: 'Pembeli' },
                { number: '99.9%', label: 'Uptime' },
              ].map((stat, i) => (
                <div key={i} className="text-center group">
                  <p className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300 inline-block">{stat.number}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </AnimatedFooterSection>

        {/* Bottom Bar */}
        <AnimatedFooterSection delay={200}>
          <div className="py-8 border-t border-gray-800/80 flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} NiagaKlik. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Payment:</span>
              <div className="flex gap-2">
                {['CN Wallet', 'QRIS', 'COD', 'Transfer'].map((method) => (
                  <span key={method} className="px-3 py-1.5 bg-gray-800 rounded-lg text-xs text-gray-400 font-medium hover:bg-primary-900/50 hover:text-primary-300 transition-all duration-200 cursor-default">
                    {method}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </AnimatedFooterSection>
      </div>
    </footer>
  );
}
