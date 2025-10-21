import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Bub Tinnapat - Software Developer',
  description: 'Portfolio of Bub Tinnapat, a passionate software developer from Thailand',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}