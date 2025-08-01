"use client";

import { useState } from 'react';

export default function QuestionsPage() {
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);

  const toggleQuestion = (questionId: string) => {
    setOpenQuestion(openQuestion === questionId ? null : questionId);
  };

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-4xl font-light text-center my-8 text-[#414141]">Questions</h1>
      
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="bg-white rounded-lg shadow-sm border">
          <button
            onClick={() => toggleQuestion('touchups')}
            className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors text-[#414141]"
          >
            <h2 className="text-xl font-semibold">How do you handle touch-ups?</h2>
            <span className="text-2xl transition-transform duration-200">
              {openQuestion === 'touchups' ? '−' : '+'}
            </span>
          </button>
          {openQuestion === 'touchups' && (
            <div className="px-6 pb-4">
              <div className="text-[#414141] leading-relaxed space-y-4">
                <p>
                  Sometimes, for various reasons, ink falls out of a tattoo. It can happen during the healing process or over time, long after the tattoo has healed. If this happens, you can come back to me for a touch-up. During this appointment, I will fill in the places where your tattoo is missing ink.
                </p>
                
                <p>
                  For scheduling a touch-up, please email me at <a href="mailto:sweetpotatotattoo@gmail.com" className="text-[#7B894C] hover:underline">sweetpotatotattoo@gmail.com</a> with "touch-up" in the subject line. Let me know dates and times that work for you and attach a picture of the tattoo. I will then get back to you to work out a day/time.
                </p>
                
                <p>
                  It is possible to do a touch-up at the end of a tattoo appointment, but please email me a picture of it prior to the appointment so I can see if we can fit it in.
                </p>
                
                <p className="font-semibold">
                  Touch-ups are free of charge.
                </p>
                
                <p>
                  If you need to cancel or reschedule a touch-up, please let me know as soon as possible. Last minute cancellations or reschedulings are not fun, but understandable if you communicate them to me. No shows with zero communication are just unkind, so if you don't show up and don't communicate with me in a timely manner, I may choose not to work with you again.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
} 