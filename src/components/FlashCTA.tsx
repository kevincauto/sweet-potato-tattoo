"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";

type FlashCTAProps = {
  imageUrls: string[];
};

export default function FlashCTA({ imageUrls }: FlashCTAProps) {
  const images = useMemo(() => imageUrls.slice(0, 20), [imageUrls]);

  if (images.length === 0) return null;

  return (
    <section className="relative my-8 w-screen overflow-hidden left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
      {/* Make the band full-bleed */}
      <div className="relative w-screen">
        <div className="relative h-[260px] sm:h-[300px] overflow-hidden">
          {/* Scrolling strip */}
          <div className="absolute inset-0">
            <div className="marquee h-full">
              <div className="marquee-track h-full flex items-center gap-2">
                {[...images, ...images].map((url, i) => (
                  <div key={`${url}-${i}`} className="relative h-full w-[45vw] sm:w-[35vw] md:w-[28vw] lg:w-[22vw] flex-shrink-0">
                    <Image
                      src={url}
                      alt="Flash background"
                      fill
                      sizes="(max-width: 640px) 45vw, (max-width: 768px) 35vw, (max-width: 1024px) 28vw, 22vw"
                      className="object-cover"
                      priority={i === 0}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute inset-0 bg-black/25" />
          </div>

          {/* Content */}
          <div className="relative z-10 flex items-center justify-center h-full px-4">
            <div className="bg-white/95 rounded-lg shadow-sm max-w-3xl w-full mx-4 p-6 text-center">
              <h2 className="text-xl sm:text-2xl font-light text-[#414141] mb-4">
                Check out the available flash designs!
              </h2>
              <Link
                href="/available-flash"
                className="inline-block px-6 py-3 rounded-lg bg-[#7B894C] text-white hover:bg-[#6A7A3F] transition-colors"
              >
                View Available Flash
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes marqueeScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee { position: absolute; inset: 0; }
        .marquee-track {
          width: 200%;
          animation: marqueeScroll 60s linear infinite;
        }
      `}</style>
    </section>
  );
}


