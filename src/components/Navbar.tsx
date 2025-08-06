"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="p-4">
      <div className="container mx-auto">
        {/* Main title and subtitle */}
        <div className="text-center mb-12 mt-8">
          <h1 className="text-3xl font-light text-[#414141] mb-2 flex items-center justify-center gap-2">
            <Link href="/">Sweet Potato Tattoo</Link>
            {/* <Image
              src="/sweet-potato.png"
              alt="Sweet Potato"
              width={40}
              height={40}
            /> */}
          </h1>
          <div className="w-16 h-px bg-[#7B894C] mx-auto mb-2"></div>
          <p className="text-lg text-[#414141]">Handpoked Tattoos by Josey</p>
        </div>
        
        {/* Navigation */}
        <nav className="flex justify-center">
          <ul className="flex gap-8 font-light">
            <li>
              <Link 
                href="/" 
                className={`transition-colors ${
                  pathname === "/" 
                    ? "text-[#414141]" 
                    : "text-[#7B894C] hover:text-[#414141]"
                }`}
              >
                Home
              </Link>
            </li>
            <li>
              <Link 
                href="/available-flash" 
                className={`transition-colors ${
                  pathname === "/available-flash" 
                    ? "text-[#414141]" 
                    : "text-[#7B894C] hover:text-[#414141]"
                }`}
              >
                Available Flash
              </Link>
            </li>
            <li>
              <Link 
                href="/booking-and-availability" 
                className={`transition-colors ${
                  pathname === "/booking-and-availability" 
                    ? "text-[#414141]" 
                    : "text-[#7B894C] hover:text-[#414141]"
                }`}
              >
                Booking & Availability
              </Link>
            </li>
            <li>
              <Link 
                href="/questions" 
                className={`transition-colors ${
                  pathname === "/questions" 
                    ? "text-[#414141]" 
                    : "text-[#7B894C] hover:text-[#414141]"
                }`}
              >
                Questions
              </Link>
            </li>
            <li>
              <Link 
                href="/consent-form" 
                className={`transition-colors ${
                  pathname === "/consent-form" 
                    ? "text-[#414141]" 
                    : "text-[#7B894C] hover:text-[#414141]"
                }`}
              >
                Consent Form
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
