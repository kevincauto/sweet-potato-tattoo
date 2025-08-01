import Link from "next/link";

export default function Navbar() {
  return (
    <header className="p-4">
      <div className="container mx-auto">
        {/* Main title and subtitle */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-light text-[#414141] mb-2">
            <Link href="/">Sweet Potato Tattoo</Link>
          </h1>
          <p className="text-lg text-[#414141]">Handpoked Tattoos by Josey</p>
        </div>
        
        {/* Navigation */}
        <nav className="flex justify-center">
          <ul className="flex gap-8">
            <li>
              <Link href="/available-flash" className="hover:underline text-[#7B894C]">
                Available Flash
              </Link>
            </li>
            <li>
              <Link href="/booking-and-availability" className="hover:underline text-[#7B894C]">
                Booking & Availability
              </Link>
            </li>
            <li>
              <Link href="/faq" className="hover:underline text-[#7B894C]">
                FAQ
              </Link>
            </li>
            <li>
              <a 
                href="https://form.jotform.com/250076675634159" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:underline text-[#7B894C]"
              >
                Consent Form
              </a>
            </li>
            <li>
              <Link href="/admin" prefetch={false} className="hover:underline text-sm text-gray-500">
                Admin
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
} 