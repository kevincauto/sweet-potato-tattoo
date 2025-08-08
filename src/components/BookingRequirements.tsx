"use client";

import { useState } from 'react';

export default function BookingRequirements() {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (sectionId: string) => {
    setOpenSection(openSection === sectionId ? null : sectionId);
  };

  const requirements = [
    {
      id: 'important-notes',
      title: 'Important Notes',
      content: (
        <div className="space-y-4">
          <div>
            <p className="font-bold">Age & Photo ID:</p>
            <p>New clients must be 18+ and bring a valid photo ID to the first appointment.</p>
          </div>
          <div>
            <p className="font-bold">Health:</p>
            <p>If you have taken antibiotics within 10 days of the session or are feeling unwell, please reschedule.</p>
          </div>
          <div>
            <p className="font-bold">Deposit:</p>
            <p>A $50 non-refundable deposit is required when booking and is applied to the final tattoo cost.</p>
          </div>
          <div>
            <p className="font-bold">Accessibility:</p>
            <p>The studio is up three flights of stairs and is not wheelchair-accessible.</p>
          </div>
        </div>
      )
    },
    {
      id: 'lateness',
      title: 'Lateness & Rescheduling',
      content: (
        <div className="space-y-4">
          <div>
            <p className="font-bold">Arrival window:</p>
            <p>Aim to arrive 5–10 minutes early. Up to 20 minutes of grace time is allowed; text 267-528-7752 if you&apos;re delayed.</p>
          </div>
          <div>
            <p className="font-bold">Late arrival (&gt; 20 min):</p>
            <p>Appointment may be cancelled or a late fee may apply, depending on the day&apos;s schedule.</p>
          </div>
          <div>
            <p className="font-bold">Reschedule ≥ 48 hrs ahead:</p>
            <p>Original deposit carries over.</p>
          </div>
          <div>
            <p className="font-bold">Reschedule &lt; 48 hrs or second reschedule:</p>
            <p>Treated as a cancellation; a new deposit is required.</p>
          </div>
          <div>
            <p className="font-bold">Cancellations by artist:</p>
            <p>Deposit may be refunded or carried over; you&apos;ll be notified at least 24 hrs in advance when possible.</p>
          </div>
          <div>
            <p className="font-bold">No-shows:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>New clients will not be re-booked.</li>
              <li>Returning clients must explain promptly or future bookings may be refused.</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'preparation',
      title: 'Preparing for Your Appointment',
      content: (
        <div className="space-y-4">
          <div>
            <p className="font-bold">Technique & Timing:</p>
            <p>Hand-poked tattoos only (no machine); most sessions run 1–3 hours, so plan accordingly.</p>
          </div>
          <div>
            <p className="font-bold">Before your appointment:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Eat & hydrate beforehand.</li>
              <li>Wear loose, comfortable clothing you don&apos;t mind getting inky; slip-on shoes make it easier (shoes come off inside).</li>
              <li>Shave the tattoo area in advance if possible to reduce single-use razor waste (optional).</li>
            </ul>
          </div>
          <div>
            <p className="font-bold">Bring:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Photo ID (new clients)</li>
              <li>Mask (if you opted for a masks-on session)</li>
              <li>Water/snacks for breaks</li>
              <li>Music + headphones or a book if you prefer quiet time</li>
            </ul>
          </div>
        </div>
      )
    },
    
    {
      id: 'payment',
      title: 'Payment & Tips',
      content: (
        <div className="space-y-4">
          <div>
            <p className="font-bold">Payments accepted:</p>
            <p>Venmo (preferred), Zelle, or cash.</p>
          </div>
          <div>
            <p className="font-bold">Tips:</p>
            <p>Appreciated but never expected; accepted via cash or Venmo.</p>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-4 mb-8">
      {requirements.map((section) => (
        <div key={section.id} className="bg-white rounded-lg shadow-sm border">
          <button
            onClick={() => toggleSection(section.id)}
            className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors text-[#414141] rounded-lg"
          >
            <h2 className="text-xl font-semibold">{section.title}</h2>
            <span className="text-2xl transition-transform duration-200">
              {openSection === section.id ? '−' : '+'}
            </span>
          </button>
          {openSection === section.id && (
            <div className="px-6 pb-4">
              <div className="text-[#414141] leading-relaxed">
                {section.content}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
