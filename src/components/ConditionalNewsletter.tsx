"use client";

import { usePathname } from 'next/navigation';
import NewsletterSection from './NewsletterSection';

export default function ConditionalNewsletter() {
  const pathname = usePathname();

  // Don't render the newsletter section on the homepage or newsletter page
  if (pathname === '/' || pathname === '/newsletter') {
    return null;
  }

  return <NewsletterSection priority={false} />;
}
