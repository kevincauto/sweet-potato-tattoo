'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [uploading, setUploading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [imageAlt, setImageAlt] = useState('');

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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    setUploading(true);
    setUploadedImageUrl(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Upload to gallery collection (we can use any collection, or create a generic one)
      const response = await fetch(`/api/upload/gallery?filename=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        body: file,
      });

      if (response.ok) {
        const data = await response.json();
        setUploadedImageUrl(data.url);
        setImageAlt(file.name.replace(/\.[^/.]+$/, '')); // Use filename as default alt text
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
        alert(`Failed to upload image: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image');
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const insertImageAtCursor = () => {
    if (!uploadedImageUrl) return;

    const textarea = document.getElementById('about-content') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const textBefore = content.substring(0, start);
    const textAfter = content.substring(end);
    
    // Create image HTML with optional alt text and styling
    const imageHtml = `<img src="${uploadedImageUrl}" alt="${imageAlt || 'Image'}" class="w-full max-w-md mx-auto my-6 rounded-lg" />`;
    
    const newContent = textBefore + imageHtml + textAfter;
    setContent(newContent);
    
    // Set cursor position after inserted image
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + imageHtml.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

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
        // Refresh the data to show updated content
        await fetchAboutData();
        alert('About page saved successfully!');
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Save failed:', errorData);
        alert(`Failed to save about page: ${errorData.error || 'Unknown error'}`);
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

          {/* Image Upload Section */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Image
            </label>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#7B894C] file:text-white hover:file:bg-[#6A7A3F] disabled:opacity-50"
                />
                {uploading && (
                  <span className="text-sm text-gray-500 self-center">Uploading...</span>
                )}
              </div>
              
              {uploadedImageUrl && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Image uploaded!</span>
                    <button
                      onClick={() => {
                        setUploadedImageUrl(null);
                        setImageAlt('');
                      }}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={imageAlt}
                      onChange={(e) => setImageAlt(e.target.value)}
                      placeholder="Image alt text (optional)"
                      className="flex-1 px-3 py-2 border rounded-lg text-sm"
                    />
                    <button
                      onClick={insertImageAtCursor}
                      className="bg-[#7B894C] text-white px-4 py-2 rounded-lg hover:bg-[#6A7A3F] transition-colors text-sm"
                    >
                      Insert at Cursor
                    </button>
                  </div>
                  <div className="mt-2">
                    <img
                      src={uploadedImageUrl}
                      alt="Preview"
                      className="max-w-xs rounded-lg border"
                    />
                  </div>
                </div>
              )}
            </div>
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
              Use HTML tags like &lt;div&gt;, &lt;p&gt;, &lt;h2&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;a&gt;, etc. You can use classes like &quot;text-[#7B894C]&quot; for links. Upload an image above and click &quot;Insert at Cursor&quot; to add it to your content.
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

