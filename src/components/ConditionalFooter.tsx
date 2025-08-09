"use client";

import { usePathname } from 'next/navigation';
import Footer from './Footer';

export default function ConditionalFooter() {
  const pathname = usePathname();

  // Hide footer on the booking page to reduce distractions
  if (pathname === '/booking') {
    return null;
  }

  return <Footer />;
}


