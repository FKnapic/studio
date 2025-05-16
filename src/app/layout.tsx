import type { Metadata } from 'next';
// Removed Inter font import
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/Header';

// Removed Inter font initialization

export const metadata: Metadata = {
  title: 'Scribble Stadium',
  description: 'A real-time drawing and guessing game.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Removed font variable from body className */}
      <body className="antialiased flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
