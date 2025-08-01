import Link from "next/link";

export default function Navbar() {
  return (
    <header className="p-4">
      <nav className="container mx-auto flex justify-between items-center">
        <div className="text-2xl font-light">
          <Link href="/">Sweet Potato Tattoo</Link>
        </div>
        <ul className="flex gap-8">
          <li>
            <Link href="/available-flash" className="hover:underline">
              Available Flash
            </Link>
          </li>
          <li>
            <Link href="/booking-and-availability" className="hover:underline">
              Booking & Availability
            </Link>
          </li>
          <li>
            <Link href="/faq" className="hover:underline">
              FAQ
            </Link>
          </li>
          <li>
            <a 
              href="https://form.jotform.com/250076675634159" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:underline"
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
    </header>
  );
} 