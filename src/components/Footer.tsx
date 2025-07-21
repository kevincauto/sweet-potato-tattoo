import Link from "next/link";

export default function Footer() {
  return (
    <footer className="p-4">
      <div className="container mx-auto flex justify-center items-center">
        <ul className="flex gap-8">
          <li>
            <Link href="#" className="hover:underline">
              Instagram
            </Link>
          </li>
          <li>
            <Link href="#" className="hover:underline">
              Facebook
            </Link>
          </li>
          <li>
            <Link href="#" className="hover:underline">
              Email
            </Link>
          </li>
        </ul>
      </div>
    </footer>
  );
} 