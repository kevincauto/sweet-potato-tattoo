'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to gallery admin by default
    router.push('/admin/gallery');
  }, [router]);

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-4xl font-bold text-center my-8">Redirecting to Gallery Admin...</h1>
    </main>
  );
} 