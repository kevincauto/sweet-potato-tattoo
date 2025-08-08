"use client";

import { usePathname } from 'next/navigation';
import NewsletterSection from './NewsletterSection';

export default function ConditionalNewsletter() {
  const pathname = usePathname();

  // Don't render on homepage, newsletter page, or available-flash page
  if (pathname === '/' || pathname === '/newsletter' || pathname === '/available-flash') {
    return null;
  }

  return <NewsletterSection priority={false} />;
}
