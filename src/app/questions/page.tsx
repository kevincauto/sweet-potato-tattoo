"use client";

import { useState, useEffect } from 'react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  order: number;
}

export default function QuestionsPage() {
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);

  const toggleQuestion = (questionId: string) => {
    setOpenQuestion(openQuestion === questionId ? null : questionId);
  };

  useEffect(() => {
    const fetchFAQItems = async () => {
      try {
        const response = await fetch('/api/faq');
        if (response.ok) {
          const data = await response.json();
          // Sort by order to ensure correct display order
          const sortedItems = (data.items || []).sort((a: FAQItem, b: FAQItem) => a.order - b.order);
          setFaqItems(sortedItems);
        } else {
          console.error('Failed to fetch FAQ items');
          setFaqItems([]);
        }
      } catch (error) {
        console.error('Error fetching FAQ items:', error);
        setFaqItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFAQItems();
  }, []);

  if (loading) {
    return (
      <main className="container mx-auto p-4">
        <h1 className="text-4xl font-light text-center my-8 text-[#414141]">Questions</h1>
        <div className="max-w-4xl mx-auto text-center py-8">
          <p className="text-gray-500">Loading questions...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-4xl font-light text-center my-8 text-[#414141]">Questions</h1>
      
      <div className="max-w-4xl mx-auto space-y-4">
        {faqItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No questions available at the moment.</p>
          </div>
        ) : (
          faqItems.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-sm border">
              <button
                onClick={() => toggleQuestion(item.id)}
                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors text-[#414141] rounded-lg"
              >
                <h2 className="text-xl font-light">{item.question}</h2>
                <span className="text-2xl transition-transform duration-200">
                  {openQuestion === item.id ? '−' : '+'}
                </span>
              </button>
                             {openQuestion === item.id && (
                 <div className="px-6 pb-4">
                   <div 
                     className="text-[#414141] leading-relaxed space-y-4"
                     dangerouslySetInnerHTML={{ 
                       __html: item.answer
                         .replace(/\n/g, '<br />')
                         .replace(/className="([^"]*)"/g, 'class="$1"')
                         .replace(/<span className="font-semibold">/g, '<span class="font-semibold">')
                         .replace(/<span className="font-bold">/g, '<span class="font-bold">')
                         .replace(/<a href="([^"]*)" className="([^"]*)">/g, '<a href="$1" class="$2">')
                     }}
                   />
                 </div>
               )}
            </div>
          ))
        )}
      </div>
    </main>
  );
}
