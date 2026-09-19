import type { Metadata } from 'next'
import { Archivo, Inter_Tight, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'

const archivo = Archivo({
  subsets: ['latin'],
  variable: '--font-archivo',
  weight: ['600', '700', '800'],
  display: 'swap',
})

const interTight = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-inter-tight',
  weight: ['400', '500', '600'],
  display: 'swap',
})

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-plex-mono',
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
      <body
        className={`${archivo.variable} ${interTight.variable} ${plexMono.variable}`}
      >
        {children}
      </body>
    </html>
  )
}
