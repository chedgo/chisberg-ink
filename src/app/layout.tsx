import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Analytics } from '@vercel/analytics/react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Flower Arranger',
  description: 'Arrange flowers in a vase',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-background`}>
        <div className="antialiased flex justify-center w-full">
          <main className="flex-auto min-w-0 flex flex-col">
            {children}
            <Analytics />
          </main>
        </div>
      </body>
    </html>
  );
}
