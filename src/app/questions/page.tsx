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
            onClick={() => toggleQuestion('custom')}
            className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors text-[#414141] rounded-lg"
          >
            <h2 className="text-xl font-semibold">Do you do custom tattoo requests?</h2>
            <span className="text-2xl transition-transform duration-200">
              {openQuestion === 'custom' ? '−' : '+'}
            </span>
          </button>
          {openQuestion === 'custom' && (
            <div className="px-6 pb-4">
              <div className="text-[#414141] leading-relaxed space-y-4">
                <p>
                  I don&apos;t accept all custom requests. I work within a limited range of styles, and handpoked tattoos have a distinct look to them. Please make sure you like my work/styles before requesting a custom.
                </p>
                
                <p className="font-semibold">Here is a list of what I will do and what I will not do:</p>
                
                <p className="font-semibold">I like to tattoo:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Plants, including flowers and vegetables</li>
                  <li>Bones and shells</li>
                  <li>Nuts and seeds</li>
                  <li>Animals of all kinds (except pets, sorry)</li>
                  <li>Stars and clouds</li>
                  <li>Mythical creatures</li>
                  <li>Fire</li>
                  <li>Arrows and hands</li>
                  <li>Insects/bugs? (I haven&apos;t done much of these and I&apos;m not sure yet if I like drawing those. I think it depends on the creature)</li>
                </ul>
                
                <p className="font-semibold">I don&apos;t tattoo:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Man made objects</li>
                  <li>Lettering/script</li>
                  <li>Geometric designs</li>
                  <li>Pets</li>
                  <li>People/portraits</li>
                  <li>Someone else&apos;s art or design</li>
                  <li>Food</li>
                </ul>
                
                <p className="font-semibold">Customized Flash:</p>
                <p>
                  If you like a flash piece but want to make some design adjustments, that&apos;s great, just email me about what you&apos;re thinking. If you like a flash piece but want it significantly bigger (like at least 3 inches bigger).
                </p>
                
                <p className="font-semibold">Booking:</p>
                <p>
                  Email me at <a href="mailto:sweetpotatotattoo@gmail.com" className="text-[#7B894C] hover:underline">sweetpotatotattoo@gmail.com</a> with something like &ldquo;custom tattoo inquiry&rdquo; as the subject. In your email, please include tattoo reference images, the dimensions you&apos;re considering (examples: LxW inches; 3-5in), placement ideas, and your budget. If you are unsure of a few of these things, please provide as much information as you can. Size and budget ranges are also fine, but the tighter.
                </p>
                
                <p className="font-semibold">Pricing:</p>
                <p>Prices depend on size and intricacy of design.</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Smaller than 1&rdquo;x1&rdquo; are $100 minimum.</li>
                  <li>1&rdquo;x1&rdquo; - 2&rdquo;x3&rdquo; start at $120.</li>
                  <li>Designs 2&rdquo;x3&rdquo; and larger start at $175.</li>
                </ul>
                
                <p>
                  I charge a drawing fee ($30-$100 depending on size/detail) in addition to the $50 deposit. The drawing fee is separate from the cost of the tattoo. When you inquire about a custom, I will give a quote on the drawing fee as well as the tattoo. The drawing fee includes the initial drawing as well as a revised drawing if necessary. Any revisions/re-drawings after the first one will be charged extra depending on the revisions asked for. I don&apos;t start working on the design until I receive the drawing fee; it can be sent via Venmo to @Josey-Lee-2.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          <button
            onClick={() => toggleQuestion('touchups')}
            className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors text-[#414141] rounded-lg"
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
                  For scheduling a touch-up, please email me at <a href="mailto:sweetpotatotattoo@gmail.com" className="text-[#7B894C] hover:underline">sweetpotatotattoo@gmail.com</a> with &ldquo;touch-up&rdquo; in the subject line. Let me know dates and times that work for you and attach a picture of the tattoo. I will then get back to you to work out a day/time.
                </p>
                
                <p>
                  It is possible to do a touch-up at the end of a tattoo appointment, but please email me a picture of it prior to the appointment so I can see if we can fit it in.
                </p>
                
                <p className="font-semibold">
                  Touch-ups are free of charge.
                </p>
                
                <p>
                  If you need to cancel or reschedule a touch-up, please let me know as soon as possible. Last minute cancellations or reschedulings are not fun, but understandable if you communicate them to me. No shows with zero communication are just unkind, so if you don&apos;t show up and don&apos;t communicate with me in a timely manner, I may choose not to work with you again.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
} 