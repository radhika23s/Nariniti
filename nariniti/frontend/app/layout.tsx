import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Nariniti | Empowering Women Entrepreneurs',
  description: 'Nariniti platform built by Vaishnavi Hole for empowering women entrepreneurs across India.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <Navbar />
          <main className="min-h-screen bg-slate-50">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
