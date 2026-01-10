"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";

type FlashCTAProps = {
  imageUrls: string[];
  variant?: 'to-flash' | 'to-booking';
};

export default function FlashCTA({ imageUrls, variant = 'to-flash' }: FlashCTAProps) {
  const images = useMemo(() => imageUrls.slice(0, 20).filter(url => url && url.trim().length > 0), [imageUrls]);

  if (images.length === 0) return null;

  return (
    <section className="relative my-8 w-screen overflow-hidden left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
      {/* Make the band full-bleed */}
      <div className="relative w-screen">
        <div className="relative h-[260px] sm:h-[300px] overflow-hidden">
          {/* Scrolling strip */}
          <div className="absolute inset-0 bg-gray-200">
            <div className="marquee h-full z-0">
              <div className="marquee-track h-full flex items-center gap-2">
                {[...images, ...images].map((url, i) => (
                  <div key={`${url}-${i}`} className="relative h-full w-[45vw] sm:w-[35vw] md:w-[28vw] lg:w-[22vw] flex-shrink-0">
                    <Image
                      src={url}
                      alt="Flash background"
                      fill
                      sizes="(max-width: 640px) 45vw, (max-width: 768px) 35vw, (max-width: 1024px) 28vw, 22vw"
                      className="object-cover"
                      loading="eager"
                      priority={i < 4}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute inset-0 bg-black/25 z-[1]" />
          </div>

          {/* Content */}
          <div className="relative z-10 flex items-center justify-center h-full px-4">
            <div className="bg-white/95 rounded-lg shadow-sm max-w-3xl w-full mx-4 p-6 text-center">
              {variant === 'to-flash' ? (
                <>
                  <h2 className="text-xl sm:text-2xl font-light text-[#414141] mb-4">Check out the available flash designs!</h2>
                  <Link href="/" className="inline-block px-6 py-3 rounded-lg bg-[#7B894C] text-white hover:bg-[#6A7A3F] transition-colors">View Available Flash</Link>
                </>
              ) : (
                <>
                  <h2 className="text-xl sm:text-2xl font-light text-[#414141] mb-4">Love one of the designs? Let&apos;s book it!</h2>
                  <Link href="/booking" className="inline-block px-6 py-3 rounded-lg bg-[#7B894C] text-white hover:bg-[#6A7A3F] transition-colors">Book Your Appointment</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .marquee { position: absolute; inset: 0; }
        .marquee-track {
          width: 200%;
          /* Animation removed - now static */
        }
      `}</style>
    </section>
  );
}


