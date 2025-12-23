"use client";

import { useState, useEffect } from 'react';

interface BookingSection {
  id: string;
  title: string;
  content: string;
  order: number;
}

export default function BookingRequirements() {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [sections, setSections] = useState<BookingSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSections = async () => {
      try {
        const response = await fetch('/api/booking');
        if (response.ok) {
          const data = await response.json();
          setSections(data.sections || []);
        } else {
          console.error('Failed to fetch booking sections');
        }
      } catch (error) {
        console.error('Error fetching booking sections:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSections();
  }, []);

  const toggleSection = (sectionId: string) => {
    setOpenSection(openSection === sectionId ? null : sectionId);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 mb-8">
        <div className="text-center py-8 text-gray-500">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const requirements = sections.sort((a, b) => a.order - b.order);

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
              <div 
                className="text-[#414141] leading-relaxed"
                dangerouslySetInnerHTML={{ __html: section.content }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
