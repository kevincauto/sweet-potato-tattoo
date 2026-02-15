"use client";

import { usePathname } from 'next/navigation';
import NewsletterSection from './NewsletterSection';

export default function ConditionalNewsletter() {
  const pathname = usePathname();

  // Don't render on pages that already include the newsletter (or where we want no footer-area CTA).
  // Note: be defensive about pathname edge-cases in production (e.g. empty string).
  if (
    !pathname ||
    pathname === '/' ||
    pathname === '/gallery' ||
    pathname === '/newsletter' ||
    pathname === '/available-flash' ||
    pathname === '/booking'
  ) {
    return null;
  }

  // NewsletterSection will check localStorage internally and hide itself if user has signed up
  return <NewsletterSection priority={false} />;
}
