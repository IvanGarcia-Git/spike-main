"use client";

import { FileText } from "lucide-react";
import Link from "next/link";

export function Header() {
  return (
    <header className="bg-background/95 sticky top-0 z-50 w-full border-b border-border/40 backdrop-blur supports-[backdrop-filter]:bg-background/60 no-print">
      <div className="container flex h-14 items-center">
        <Link href="/" className="flex items-center space-x-2">
          <FileText className="h-6 w-6 text-primary" />
          <span className="font-bold font-headline text-lg">ForjaContratos</span>
        </Link>
      </div>
    </header>
  );
}
