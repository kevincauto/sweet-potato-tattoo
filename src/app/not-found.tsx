import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center p-4 min-h-screen">
      <div className="text-center max-w-md mx-auto">
        <h1 className="text-6xl font-light text-[#414141] mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-[#414141] mb-4">Page Not Found</h2>
        <p className="text-[#414141] mb-8">
          Sorry, the page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link 
          href="/" 
          className="bg-[#7B894C] text-white px-6 py-3 rounded-lg border hover:bg-[#6A7A3F] transition-colors inline-block"
        >
          Go Home
        </Link>
      </div>
    </main>
  );
} 