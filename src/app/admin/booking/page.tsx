'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface BookingSection {
  id: string;
  title: string;
  content: string;
  order: number;
}

interface BookingPageData {
  introText: string;
  sections: BookingSection[];
}

export default function BookingAdminPage() {
  const [bookingData, setBookingData] = useState<BookingPageData | null>(null);
  const [introText, setIntroText] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingContent, setEditingContent] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  const fetchBookingData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/booking');
      if (response.ok) {
        const data = await response.json();
        setBookingData(data);
        setIntroText(data.introText || '');
      } else {
        console.error('Failed to fetch booking data');
      }
    } catch (error) {
      console.error('Error fetching booking data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookingData();
  }, [fetchBookingData]);

  const handleSaveIntroText = async () => {
    if (!bookingData) return;
    
    try {
      const response = await fetch('/api/booking', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          introText,
          sections: bookingData.sections
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setBookingData(data.data);
        alert('Intro text saved successfully!');
      } else {
        alert('Failed to save intro text');
      }
    } catch (error) {
      console.error('Error saving intro text:', error);
      alert('Error saving intro text');
    }
  };

  const handleEditSection = (section: BookingSection) => {
    setEditingSectionId(section.id);
    setEditingTitle(section.title);
    setEditingContent(section.content);
  };

  const handleSaveSection = async () => {
    if (!bookingData || !editingSectionId) return;

    try {
      const updatedSections = bookingData.sections.map(section =>
        section.id === editingSectionId
          ? { ...section, title: editingTitle, content: editingContent }
          : section
      );

      const response = await fetch('/api/booking', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          introText: bookingData.introText,
          sections: updatedSections
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setBookingData(data.data);
        setEditingSectionId(null);
        setEditingTitle('');
        setEditingContent('');
        alert('Section updated successfully!');
      } else {
        alert('Failed to update section');
      }
    } catch (error) {
      console.error('Error updating section:', error);
      alert('Error updating section');
    }
  };

  const handleDeleteSection = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this section?')) {
      return;
    }

    try {
      const response = await fetch(`/api/booking?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchBookingData();
        alert('Section deleted successfully!');
      } else {
        alert('Failed to delete section');
      }
    } catch (error) {
      console.error('Error deleting section:', error);
      alert('Error deleting section');
    }
  };

  const handleAddSection = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      alert('Please enter both a title and content.');
      return;
    }

    try {
      const response = await fetch('/api/booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTitle.trim(),
          content: newContent.trim(),
        }),
      });

      if (response.ok) {
        fetchBookingData();
        setNewTitle('');
        setNewContent('');
        setIsAdding(false);
        alert('Section added successfully!');
      } else {
        alert('Failed to add section');
      }
    } catch (error) {
      console.error('Error adding section:', error);
      alert('Error adding section');
    }
  };

  const handleReorder = async (newOrder: BookingSection[]) => {
    if (!bookingData) return;

    try {
      const response = await fetch('/api/booking', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sections: newOrder
        }),
      });

      if (response.ok) {
        fetchBookingData();
      } else {
        alert('Failed to reorder sections');
      }
    } catch (error) {
      console.error('Error reordering sections:', error);
      alert('Error reordering sections');
    }
  };

  if (loading) {
    return (
      <main className="container mx-auto p-4">
        <div className="text-center py-8">
          <p className="text-gray-600">Loading...</p>
        </div>
      </main>
    );
  }

  if (!bookingData) {
    return (
      <main className="container mx-auto p-4">
        <div className="text-center py-8">
          <p className="text-gray-600">Failed to load booking data</p>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-4xl font-bold text-center my-8">Booking Admin</h1>
      
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
          className="px-4 py-2 rounded-lg border border-[#7B894C] text-[#7B894C] bg-white hover:bg-[#7B894C] hover:text-white transition-colors"
        >
          FAQ
        </Link>
        <Link 
          href="/admin/booking" 
          className="px-4 py-2 rounded-lg border bg-[#7B894C] text-white border-[#7B894C] hover:bg-[#6A7A3F] transition-colors"
        >
          Booking
        </Link>
        <Link 
          href="/admin/about" 
          className="px-4 py-2 rounded-lg border border-[#7B894C] text-[#7B894C] bg-white hover:bg-[#7B894C] hover:text-white transition-colors"
        >
          About
        </Link>
      </div>

      {/* Intro Text Editor */}
      <div className="mb-8 bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-bold mb-4">Intro Text</h2>
        <p className="text-sm text-gray-600 mb-2">This text appears below the page title on the booking page.</p>
        <textarea
          value={introText}
          onChange={(e) => setIntroText(e.target.value)}
          rows={3}
          className="w-full p-3 border rounded-lg mb-4"
          placeholder="Please read each section fully before booking."
        />
        <button
          onClick={handleSaveIntroText}
          className="bg-[#7B894C] text-white px-4 py-2 rounded-lg hover:bg-[#6A7A3F] transition-colors"
        >
          Save Intro Text
        </button>
      </div>

      {/* Add New Section */}
      <div className="mb-8">
        {!isAdding ? (
          <button
            onClick={() => setIsAdding(true)}
            className="bg-[#7B894C] text-white px-4 py-2 rounded-lg hover:bg-[#6A7A3F] transition-colors"
          >
            + Add New Section
          </button>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Add New Section</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="new-title" className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  id="new-title"
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                  placeholder="Enter section title..."
                />
              </div>
              <div>
                <label htmlFor="new-content" className="block text-sm font-medium text-gray-700 mb-2">
                  Content (HTML)
                </label>
                <textarea
                  id="new-content"
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={10}
                  className="w-full p-3 border rounded-lg resize-vertical font-mono text-sm"
                  placeholder="Enter HTML content..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use HTML tags like &lt;div&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, etc.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddSection}
                  className="bg-[#7B894C] text-white px-4 py-2 rounded-lg hover:bg-[#6A7A3F] transition-colors"
                >
                  Add Section
                </button>
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setNewTitle('');
                    setNewContent('');
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

      {/* Sections List */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold mb-2">Booking Sections</h2>
        <p className="text-sm text-gray-600 mb-4">
          Drag and drop to reorder sections. Click Edit to modify content.
        </p>
      </div>

      {bookingData.sections.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No sections yet. Add your first one above!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookingData.sections
            .sort((a, b) => a.order - b.order)
            .map((section, index) => (
              <div key={section.id} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">#{index + 1}</span>
                    <h3 className="text-xl font-semibold">{section.title}</h3>
                  </div>
                  <div className="flex gap-2">
                    {editingSectionId === section.id ? (
                      <>
                        <button
                          onClick={handleSaveSection}
                          className="px-3 py-1 bg-[#7B894C] text-white rounded text-sm hover:bg-[#6A7A3F]"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingSectionId(null);
                            setEditingTitle('');
                            setEditingContent('');
                          }}
                          className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEditSection(section)}
                          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteSection(section.id)}
                          className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {editingSectionId === section.id ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Title
                      </label>
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        className="w-full p-3 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Content (HTML)
                      </label>
                      <textarea
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        rows={10}
                        className="w-full p-3 border rounded-lg resize-vertical font-mono text-sm"
                      />
                    </div>
                  </div>
                ) : (
                  <div 
                    className="text-gray-700 prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: section.content }}
                  />
                )}
              </div>
            ))}
        </div>
      )}
    </main>
  );
}

