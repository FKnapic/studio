import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Changed from GeistSans
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/Header';

// Initialize Inter font
const inter = Inter({
  variable: '--font-inter', // Updated variable name
  subsets: ['latin'],
});

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
      <body className={`${inter.variable} antialiased flex flex-col min-h-screen`}> {/* Updated font variable */}
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
