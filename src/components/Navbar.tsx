"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="p-4">
      <div className="container mx-auto">
        {/* Main title and subtitle */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-light text-[#414141] mb-2">
            <Link href="/">Sweet Potato Tattoo</Link>
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
              <a 
                href="https://form.jotform.com/250076675634159" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-[#7B894C] hover:text-[#414141] transition-colors"
              >
                Consent Form
              </a>
            </li>
            <li>
              <Link 
                href="/admin" 
                prefetch={false} 
                className={`text-sm transition-colors ${
                  pathname === "/admin" 
                    ? "text-[#414141]" 
                    : "text-gray-500 hover:text-[#414141]"
                }`}
              >
                Admin
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
} 