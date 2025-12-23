'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface AboutPageData {
  title: string;
  content: string;
}

export default function AboutAdminPage() {
  const [aboutData, setAboutData] = useState<AboutPageData | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchAboutData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/about');
      if (response.ok) {
        const data = await response.json();
        setAboutData(data);
        setTitle(data.title || '');
        setContent(data.content || '');
      } else {
        console.error('Failed to fetch about data');
      }
    } catch (error) {
      console.error('Error fetching about data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAboutData();
  }, [fetchAboutData]);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      alert('Please enter both a title and content.');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/about', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAboutData(data.data);
        alert('About page saved successfully!');
      } else {
        alert('Failed to save about page');
      }
    } catch (error) {
      console.error('Error saving about page:', error);
      alert('Error saving about page');
    } finally {
      setSaving(false);
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

  if (!aboutData) {
    return (
      <main className="container mx-auto p-4">
        <div className="text-center py-8">
          <p className="text-gray-600">Failed to load about page data</p>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-4xl font-bold text-center my-8">About Admin</h1>
      
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
          className="px-4 py-2 rounded-lg border border-[#7B894C] text-[#7B894C] bg-white hover:bg-[#7B894C] hover:text-white transition-colors"
        >
          Booking
        </Link>
        <Link 
          href="/admin/about" 
          className="px-4 py-2 rounded-lg border bg-[#7B894C] text-white border-[#7B894C] hover:bg-[#6A7A3F] transition-colors"
        >
          About
        </Link>
      </div>

      {/* Editor */}
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-bold mb-4">Edit About Page</h2>
        
        <div className="space-y-6">
          <div>
            <label htmlFor="about-title" className="block text-sm font-medium text-gray-700 mb-2">
              Page Title
            </label>
            <input
              id="about-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 border rounded-lg"
              placeholder="About"
            />
          </div>

          <div>
            <label htmlFor="about-content" className="block text-sm font-medium text-gray-700 mb-2">
              Content (HTML)
            </label>
            <textarea
              id="about-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={20}
              className="w-full p-3 border rounded-lg resize-vertical font-mono text-sm"
              placeholder="Enter HTML content..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Use HTML tags like &lt;div&gt;, &lt;p&gt;, &lt;h2&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;a&gt;, etc. You can use classes like "text-[#7B894C]" for links.
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#7B894C] text-white px-6 py-2 rounded-lg hover:bg-[#6A7A3F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <Link
              href="/about"
              target="_blank"
              className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors inline-block"
            >
              View Page
            </Link>
          </div>
        </div>

        {/* Preview */}
        <div className="mt-8 pt-8 border-t">
          <h3 className="text-xl font-semibold mb-4">Preview</h3>
          <div className="bg-gray-50 p-6 rounded-lg">
            <h1 className="text-4xl font-light text-center my-8 text-[#414141]">{title || 'About'}</h1>
            <div 
              className="prose max-w-none text-[#414141]"
              dangerouslySetInnerHTML={{ __html: content || '<p>No content yet.</p>' }}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

