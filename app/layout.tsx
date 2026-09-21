import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import { ThemeProvider } from '@/lib/theme'

export const metadata: Metadata = {
  title: 'Rumah Bawang - Manajemen Stok',
  description: 'Aplikasi manajemen stok dan penjualan bawang',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-60 min-h-screen">
              <div className="max-w-5xl mx-auto px-6 py-8">
                {children}
              </div>
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
