import Link from "next/link";

export default function Footer() {
  return (
    <footer className="pt-4 pb-8">
      <div className="container mx-auto flex flex-col items-center gap-4">
        <ul className="flex gap-8">
          <li>
            <Link
              href="https://www.instagram.com/sweetpotatotat"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-70 transition-opacity"
              aria-label="Instagram"
            >
              <svg
                width="44"
                height="44"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-[#414141]"
              >
                <rect
                  x="2"
                  y="2"
                  width="20"
                  height="20"
                  rx="5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                />
                <circle
                  cx="17"
                  cy="7"
                  r="1"
                  fill="currentColor"
                />
              </svg>
            </Link>
          </li>
        </ul>
        <div className="mb-6">
          <Link
            href="mailto:sweetpotatotattoo@gmail.com"
            className="hover:underline text-[#414141]"
          >
            SweetPotatoTattoo@gmail.com
          </Link>
        </div>
      </div>
    </footer>
  );
} 