import { Cog, Palette } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

const ComparativasHeader = () => {
  return (
    <header className="py-4 px-4 md:px-8 border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <Link href="/comparativas" className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <h1 className="text-2xl font-bold text-gray-900">Comparativas</h1>
        </Link>
        <nav className="flex items-center gap-2">
           <Button asChild variant="outline" size="sm">
            <Link href="/comparativas/admin">
              <Cog className="mr-2 h-4 w-4" />
              Gestionar Tarifas
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/comparativas/personalizada">
                <Palette className="mr-2 h-4 w-4" />
                Personalizar Comparativa
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
};

export default ComparativasHeader;