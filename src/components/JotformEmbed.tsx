"use client";

import { useEffect, useRef } from 'react';

export default function JotformEmbed() {
  const formContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (formContainerRef.current) {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://form.jotform.com/jsform/250076675634159';
      
      // Clear the container to prevent script duplication on re-renders
      formContainerRef.current.innerHTML = '';
      formContainerRef.current.appendChild(script);
    }
  }, []);

  return <div ref={formContainerRef} />;
}
