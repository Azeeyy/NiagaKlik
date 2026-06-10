import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Providers from './providers'
import GoogleMapsProvider from '@/components/GoogleMapsProvider'

export const metadata: Metadata = {
  title: 'NiagaKlik - Marketplace Indonesia',
  description: 'Marketplace terpercaya untuk jual beli berbagai produk berkualitas. Belanja aman, mudah, dan menyenangkan bersama NiagaKlik.',
  keywords: ['marketplace', 'belanja online', 'jual beli', 'Indonesia', 'NiagaKlik'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className="min-h-screen flex flex-col">
        <Providers>
          <GoogleMapsProvider>
            <Navbar />
            <main className="flex-1 pt-16 lg:pt-20">
              {children}
            </main>
            <Footer />
          </GoogleMapsProvider>
        </Providers>
      </body>
    </html>
  )
}
