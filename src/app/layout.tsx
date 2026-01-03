import type { Metadata } from 'next';
import { montserrat } from './fonts';
import './globals.css';
import Navbar from '@/components/Navbar';
import ConditionalFooter from '@/components/ConditionalFooter';
import ConditionalNewsletter from '@/components/ConditionalNewsletter';
import { Analytics } from '@vercel/analytics/react';
import GoogleAnalytics from '@/components/GoogleAnalytics';

export const metadata: Metadata = {
  title: 'Sweet Potato Tattoo',
  description: 'Custom tattoo studio',
  icons: {
    icon: [
      { url: '/sweet-potato.png', type: 'image/png' },
    ],
    shortcut: '/sweet-potato.png',
    apple: '/sweet-potato.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${montserrat.variable} h-full`}
      >
      <body className={`flex flex-col min-h-full font-montserrat font-light`}>
        <Navbar />
        <main className="flex-grow">
          {children}
        </main>
        {/* Hide newsletter/footer on booking page for focus */}
        <ConditionalNewsletter />
        <ConditionalFooter />
        <Analytics />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
