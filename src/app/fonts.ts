import { Montserrat, Baskervville } from 'next/font/google';

export const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['300'], // Light weight
  variable: '--font-montserrat',
});

export const baskervville = Baskervville({
  subsets: ['latin'],
  weight: ['400'], // Regular weight
  variable: '--font-baskervville',
}); 