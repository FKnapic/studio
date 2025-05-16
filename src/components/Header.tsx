import Link from 'next/link';
import { PenTool } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary hover:opacity-80 transition-opacity">
          <PenTool className="h-8 w-8" />
          <span>Scribble Stadium</span>
        </Link>
        {/* Future navigation items can go here */}
      </div>
    </header>
  );
}