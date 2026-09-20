import type { Metadata } from 'next'
import { Geist, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
})

const ibmMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-ibm-mono',
  weight: ['400', '500', '600'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Forecourt — inventory & reconditioning',
  description:
    'Track what each car cost to buy, what it cost to prepare, and what it finally earned.',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${ibmMono.variable}`}>
        {children}
      </body>
    </html>
  )
}
