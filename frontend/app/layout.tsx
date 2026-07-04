
import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AppProvider } from './providers'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter'
})

export const metadata: Metadata = {
  title: 'SmartERP - Billing & Accounting',
  description: 'Professional Tally-Inspired Web Application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`} style={{ backgroundColor: 'var(--erp-bg)', color: 'var(--erp-text-primary)' }}>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  )
}
