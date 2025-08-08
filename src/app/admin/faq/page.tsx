'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import DraggableFAQList from '../../../components/DraggableFAQList';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  order: number;
}

export default function FAQAdminPage() {
  const [items, setItems] = useState<FAQItem[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const fetchFAQItems = useCallback(async () => {
    try {
      const response = await fetch('/api/faq');
      if (response.ok) {
        const data = await response.json();
        setItems(data.items || []);
      } else {
        console.error('Failed to fetch FAQ items');
        setItems([]);
      }
    } catch (error) {
      console.error('Error fetching FAQ items:', error);
      setItems([]);
    }
  }, []);

  useEffect(() => {
    fetchFAQItems();
  }, [fetchFAQItems]);

  const handleAddItem = async () => {
    if (!newQuestion.trim() || !newAnswer.trim()) {
      alert('Please enter both a question and answer.');
      return;
    }

    try {
      const response = await fetch('/api/faq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: newQuestion.trim(),
          answer: newAnswer.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setItems(prev => [...prev, data.item]);
        setNewQuestion('');
        setNewAnswer('');
        setIsAdding(false);
      } else {
        const errorData = await response.json();
        alert(`Failed to add FAQ item: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error adding FAQ item:', error);
      alert('Failed to add FAQ item. Please try again.');
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const response = await fetch(`/api/faq?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setItems(prev => prev.filter(item => item.id !== id));
      } else {
        const errorData = await response.json();
        alert(`Failed to delete FAQ item: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error deleting FAQ item:', error);
      alert('Failed to delete FAQ item. Please try again.');
    }
  };

  const handleEditItem = async (id: string, question: string, answer: string) => {
    try {
      const response = await fetch('/api/faq', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          question,
          answer,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setItems(prev => prev.map(item => 
          item.id === id ? data.item : item
        ));
      } else {
        const errorData = await response.json();
        alert(`Failed to update FAQ item: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error updating FAQ item:', error);
      alert('Failed to update FAQ item. Please try again.');
    }
  };

  const handleReorder = (newOrder: FAQItem[]) => {
    setItems(newOrder);
  };

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-4xl font-bold text-center my-8">FAQ Admin</h1>
      
      {/* Navigation */}
      <div className="flex justify-center gap-4 mb-6">
        <Link 
          href="/admin/flash" 
          className="px-4 py-2 rounded-lg border border-[#7B894C] text-[#7B894C] bg-white hover:bg-[#7B894C] hover:text-white transition-colors"
        >
          Available Flash
        </Link>
        <Link 
          href="/admin/gallery" 
          className="px-4 py-2 rounded-lg border border-[#7B894C] text-[#7B894C] bg-white hover:bg-[#7B894C] hover:text-white transition-colors"
        >
          Gallery
        </Link>
        <Link 
          href="/admin/faq" 
          className="px-4 py-2 rounded-lg border bg-[#7B894C] text-white border-[#7B894C] hover:bg-[#6A7A3F] transition-colors"
        >
          FAQ
        </Link>
      </div>

      {/* Add New FAQ Item */}
      <div className="mb-8">
        {!isAdding ? (
          <button
            onClick={() => setIsAdding(true)}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
          >
            + Add New FAQ Item
          </button>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Add New FAQ Item</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="new-question" className="block text-sm font-medium text-gray-700 mb-2">
                  Question
                </label>
                <input
                  id="new-question"
                  type="text"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                  placeholder="Enter the question..."
                />
              </div>
              <div>
                <label htmlFor="new-answer" className="block text-sm font-medium text-gray-700 mb-2">
                  Answer
                </label>
                <textarea
                  id="new-answer"
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  rows={6}
                  className="w-full p-3 border rounded-lg resize-vertical"
                  placeholder="Enter the answer..."
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddItem}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                >
                  Add FAQ Item
                </button>
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setNewQuestion('');
                    setNewAnswer('');
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FAQ Items List */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold mb-2">FAQ Items</h2>
        <p className="text-sm text-gray-600 mb-4">
          Drag and drop to reorder items. Click Edit to modify questions and answers.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No FAQ items yet. Add your first one above!</p>
        </div>
      ) : (
        <DraggableFAQList
          items={items}
          onReorder={handleReorder}
          onDelete={handleDeleteItem}
          onEdit={handleEditItem}
        />
      )}
    </main>
  );
}
