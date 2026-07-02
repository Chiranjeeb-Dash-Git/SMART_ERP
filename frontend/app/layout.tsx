
import './globals.css'
import type { Metadata } from 'next'
import { Rajdhani, JetBrains_Mono } from 'next/font/google'
import { AppProvider } from './providers'

const rajdhani = Rajdhani({ 
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-rajdhani'
})

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'],
  variable: '--font-mono'
})

export const metadata: Metadata = {
  title: 'SmartERP - Cybernetic Nexus',
  description: 'Advanced Robotic Business System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${rajdhani.variable} ${jetbrainsMono.variable} font-sans antialiased text-white bg-[#050505]`}>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  )
}
