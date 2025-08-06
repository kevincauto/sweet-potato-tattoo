"use client";

import { useState } from 'react';
import Image from 'next/image';

export default function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with email:', email);
    setIsSubmitting(true);
    
    try {
      console.log('Sending request to /api/subscribe...');
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      console.log('Response status:', response.status);
      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (response.ok) {
        console.log('Subscription successful!');
        setIsSubmitted(true);
        setEmail('');
        setTimeout(() => {
          setIsSubmitted(false);
        }, 3000);
      } else {
        console.error('Failed to subscribe:', responseData.error);
        alert('Failed to subscribe: ' + (responseData.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error subscribing:', error);
      alert('Error subscribing: ' + error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="relative py-12 px-4 mb-8 w-full min-h-[300px] overflow-hidden">
      {/* Background image using Next.js Image */}
      <div className="absolute inset-0">
        <Image
          src="/birds3.png"
          alt="Sparrow background"
          fill
          className="object-cover"
        />
      </div>
      
      {/* Content */}
      <div className="relative z-10 flex items-center justify-center min-h-[300px]">
        {/* Opaque white rectangle containing the signup form */}
        <div className="bg-white bg-opacity-95 rounded-lg shadow-sm max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl w-full mx-4 overflow-hidden">
          {/* Top half - white background */}
          <div className="bg-white p-6 text-center">
            <h2 className="text-xl sm:text-2xl font-light text-gray-800 mb-3">
              Stay in the Loop
            </h2>
            
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              Be the first to know about new design releases and other news.
            </p>
          </div>
          
          {/* Bottom half - light gray background */}
          <div className="bg-[#f4f3f2] p-6">
            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 max-w-sm sm:max-w-md mx-auto">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email address"
                    required
                    className="flex-1 px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7B894C] focus:border-transparent text-sm sm:text-base bg-white"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[#7B894C] text-white px-4 sm:px-6 py-3 rounded-lg hover:bg-[#6A7A3F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    {isSubmitting ? 'Signing Up...' : 'Sign Up'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center text-[#7B894C] font-semibold text-base sm:text-lg">
                Thank you for subscribing!
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
} 