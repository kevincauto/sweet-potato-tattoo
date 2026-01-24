"use client";

import { usePathname } from 'next/navigation';
import NewsletterSection from './NewsletterSection';

export default function ConditionalNewsletter() {
  const pathname = usePathname();

  // Don't render on homepage, newsletter page, available-flash page, or booking page
  if (pathname === '/' || pathname === '/newsletter' || pathname === '/available-flash' || pathname === '/booking') {
    return null;
  }

  // NewsletterSection will check localStorage internally and hide itself if user has signed up
  return <NewsletterSection priority={false} />;
}
