import type { Metadata } from 'next';
import { playfairDisplay, inter } from './fonts';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Sweet Potato Tattoo',
  description: 'Custom tattoo studio',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfairDisplay.variable} ${inter.variable} h-full`}
    >
      <body className={`flex flex-col min-h-full font-sans`}>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
