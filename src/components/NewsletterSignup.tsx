"use client";

import { useState } from 'react';

export default function NewsletterSignup() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setIsSubmitted(true);
        setEmail('');
        setTimeout(() => {
          setIsOpen(false);
          setIsSubmitted(false);
        }, 2000);
      } else {
        console.error('Failed to subscribe');
      }
    } catch (error) {
      console.error('Error subscribing:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Trigger button - you can place this anywhere */}
      <button
        onClick={() => setIsOpen(true)}
        className="bg-[#7B894C] text-white px-6 py-3 rounded-lg hover:bg-[#6A7A3F] transition-colors"
      >
        Join the Newsletter!
      </button>

      {/* Modal overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Background with blur effect */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: 'url(/spain-mountain.jpeg)',
              filter: 'blur(8px) brightness(0.7)',
            }}
          />
          
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-40" />
          
          {/* Modal content */}
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-8">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl leading-none"
              aria-label="Close"
            >
              ×
            </button>
            
            <div className="text-center">
              <h2 className="text-2xl font-serif font-bold text-gray-800 mb-3">
                Join the Newsletter!
              </h2>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                Be the first to know about new design releases, cancellation slots and other news.
              </p>
              
              {!isSubmitted ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex gap-3">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Your email address"
                      required
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7B894C] focus:border-transparent"
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-[#7B894C] text-white px-6 py-3 rounded-lg hover:bg-[#6A7A3F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {isSubmitting ? 'Signing Up...' : 'Sign Up'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-[#7B894C] font-semibold">
                  Thank you for subscribing!
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
} 