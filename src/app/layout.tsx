import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

// Initialize the Inter font from Google Fonts
const inter = Inter({ subsets: ['latin'] });

// Define metadata for the site (good for SEO)
export const metadata: Metadata = {
  title: 'John Doe - Creative Developer',
  description: 'Portfolio and game project for John Doe, a creative web and game developer.',
};

// Define the RootLayout component
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* Apply the Inter font class to the body */}
      <body className={inter.className}>
        {/* 'children' will be the content of the currently active page */}
        {children}
      </body>
    </html>
  );
}
