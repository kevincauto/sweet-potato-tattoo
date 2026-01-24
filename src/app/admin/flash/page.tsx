'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { PutBlobResult } from '@vercel/blob';
import Link from 'next/link';
import DraggableImageGrid from '../../../components/DraggableImageGrid';

export default function FlashAdminPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [blob, setBlob] = useState<PutBlobResult | null>(null);
  interface ImgItem { url: string; caption?: string; category?: string; schedule?: string; hidden?: string | boolean; claimed?: string | boolean; rev?: string }
  const CATEGORY_OPTIONS = ['Fauna Flash', 'Flora Flash', 'Sky Flash', 'Small Flash', 'Discount Flash'] as const;
  const [images, setImages] = useState<ImgItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUrl, setEditingUrl] = useState<string | null>(null);
  const [tempCaption, setTempCaption] = useState('');

  const fetchImages = useCallback(async () => {
    setLoading(true);
    try {
      // Force a fresh fetch so rev backfills/updates are reflected immediately after claiming.
      const response = await fetch(`/api/upload/flash?t=${Date.now()}`, { cache: 'no-store' });
      if (response.ok) {
        const data = (await response.json()) as { items: ImgItem[] };
        setImages(data.items || []);
      } else {
        setImages([]); // Clear images on error or if collection is empty
      }
    } catch (error) {
      console.error('Error fetching images:', error);
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  async function handleDelete(url: string) {
    try {
      const response = await fetch(`/api/upload/flash?url=${encodeURIComponent(url)}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Remove the image from local state instead of refetching
        setImages(prevImages => prevImages.filter(img => img.url !== url));
      } else {
        console.error('Failed to delete image');
        alert('Failed to delete image. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Error deleting image. Please try again.');
    }
  }

  async function handleEditCaption(url: string, caption: string) {
      await fetch(
        `/api/upload/flash?url=${encodeURIComponent(url)}&caption=${encodeURIComponent(caption)}`,
      { method: 'PUT' }
    );
    setImages((imgs) =>
      imgs.map((it) =>
        it.url === url ? { ...it, caption } : it
      )
    );
  }

  function handleReorder(newOrder: ImgItem[]) {
    setImages(newOrder);
  }

  async function handleShuffleOnce() {
    const confirmed = window.confirm("Are you sure you want to completely change the order of all the images? (Can't undo)");
    if (!confirmed) return;
    await fetch('/api/upload/flash', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'shuffle' }),
    });
    fetchImages();
  }

  async function handleEditCategory(url: string, category: string) {
    await fetch(
      `/api/upload/flash?url=${encodeURIComponent(url)}&collection=flash&category=${encodeURIComponent(category)}`,
      { method: 'PUT' }
    );
    setImages((imgs) =>
      imgs.map((it) =>
        it.url === url ? { ...it, category } : it
      )
    );
  }

  async function handleEditSchedule(url: string, schedule: string) {
    await fetch(
      `/api/upload/flash?url=${encodeURIComponent(url)}&collection=flash&schedule=${encodeURIComponent(schedule)}`,
      { method: 'PUT' }
    );
    setImages((imgs) =>
      imgs.map((it) =>
        it.url === url ? { ...it, schedule: schedule || undefined } : it
      )
    );
  }

  async function handleToggleHidden(url: string, hidden: boolean) {
    const newHiddenValue = hidden ? 'true' : undefined;
    
    // Optimistically update UI immediately
    setImages((imgs) =>
      imgs.map((it) =>
        it.url === url ? { ...it, hidden: newHiddenValue } : it
      )
    );
    
    try {
      const response = await fetch(
        `/api/upload/flash?url=${encodeURIComponent(url)}&hidden=${hidden ? 'true' : 'false'}`,
        { method: 'PUT' }
      );
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to update hidden status:', errorText);
        // Revert optimistic update on error
        await fetchImages();
        alert('Failed to update hidden status. Please try again.');
      }
    } catch (error) {
      console.error('Error updating hidden status:', error);
      // Revert optimistic update on error
      await fetchImages();
      alert('Error updating hidden status. Please try again.');
    }
  }

  async function handleToggleClaimed(url: string, claimed: boolean) {
    // Show confirmation dialog
    const confirmed = window.confirm(
      'Are you sure you want to mark this design as claimed?\n\n' +
      'This will permanently edit the image to add a "Claimed" overlay. ' +
      'The image will be modified and this action cannot be undone.\n\n' +
      'The image URL will remain the same, so any emails or links pointing to it will automatically show the updated version.'
    );
    
    if (!confirmed) {
      return;
    }
    
    // Show loading state
    setImages((imgs) =>
      imgs.map((it) =>
        it.url === url ? { ...it, claimed: 'processing' } : it
      )
    );
    
    try {
      const response = await fetch('/api/claim-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl: url }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to claim image:', errorData);
        // Revert on error
        await fetchImages();
        alert('Failed to claim image: ' + (errorData.error || errorData.details || 'Unknown error'));
        return;
      }
      
      const result = await response.json();
      console.log('Claim image result:', result);
      
      if (result.error) {
        console.error('Error in response:', result);
        await fetchImages();
        alert('Failed to claim image: ' + (result.error || result.details || 'Unknown error'));
        return;
      }
      
      // Optimistically update the one item in-place so the admin preview updates immediately
      const nextRev =
        typeof result.rev === 'string' && result.rev.length > 0
          ? result.rev
          : Date.now().toString();

      setImages((imgs) =>
        imgs.map((it) =>
          it.url === url
            ? { ...it, claimed: true, rev: nextRev }
            : it
        )
      );

      // Silent background refresh to reconcile any derived fields (rev backfills, claimed booleans, etc)
      // without making the UI feel like it "reloads".
      fetchImages();

      alert('Image has been successfully marked as claimed! The image has been updated with the claimed overlay.');
    } catch (error) {
      console.error('Error claiming image:', error);
      // Revert on error
      await fetchImages();
      alert('Error claiming image: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-4xl font-bold text-center my-8">Flash Admin</h1>
      
      {/* Navigation */}
      <div className="flex justify-center gap-4 mb-6">
        <Link 
          href="/admin/flash" 
          className="px-4 py-2 rounded-lg border bg-[#7B894C] text-white border-[#7B894C] hover:bg-[#6A7A3F] transition-colors"
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
          className="px-4 py-2 rounded-lg border border-[#7B894C] text-[#7B894C] bg-white hover:bg-[#7B894C] hover:text-white transition-colors"
        >
          About
        </Link>
      </div>
      
      <form
        onSubmit={async (event) => {
          event.preventDefault();

          const form = event.target as HTMLFormElement;
          const files = form.file.files as FileList;

          if (!files || files.length === 0) return;

          for (const file of Array.from(files)) {
            const selectedCategory = (document.getElementById('flash-category') as HTMLSelectElement)?.value || '';
            const response = await fetch(
                `/api/upload/flash?filename=${encodeURIComponent(file.name)}${selectedCategory ? `&category=${encodeURIComponent(selectedCategory)}` : ''}`,
              {
                method: 'POST',
                body: file,
              }
            );

            if (response.ok) {
              const newBlob = (await response.json()) as PutBlobResult;
              setBlob(newBlob);
            } else {
              const errorText = await response.text();
              console.error('Upload failed:', errorText);
              alert(`Upload failed: ${errorText}`);
            }
          }

          fetchImages();
        }}
        className="mb-8"
      >
        <div className="flex items-center gap-2 mb-4">
          <select id="flash-category" className="border rounded-lg p-2">
            <option value="">Select category (optional)</option>
            {CATEGORY_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <input
            name="file"
            type="file"
            multiple
            required
            className="border rounded-lg p-2 flex-1"
            ref={fileRef}
          />
          <button
            type="submit"
            className="bg-[#7B894C] text-white p-2 rounded-lg px-6 hover:bg-[#6A7A3F] transition-colors"
            onClick={(e) => {
              const files = fileRef.current?.files;
              if (!files || files.length === 0) {
                e.preventDefault();
                fileRef.current?.click();
              }
            }}
          >
            Upload
          </button>
        </div>
      </form>
      {blob && (
        <div className="mb-4">
          Blob url:{' '}
          <a
            href={blob.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#7B894C] hover:underline hover:text-[#6A7A3F]"
          >
            {blob.url}
          </a>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Available Flash Images</h2>
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-600">Drag and drop to reorder images</p>
          <button
            type="button"
            onClick={handleShuffleOnce}
            className="px-3 py-2 rounded-lg border bg-white text-[#7B894C] border-[#7B894C] hover:bg-[#7B894C] hover:text-white transition-colors text-sm"
          >
            Shuffle Once
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading images...</p>
        </div>
      ) : (
        <DraggableImageGrid
        images={images}
        onReorder={handleReorder}
        onDelete={handleDelete}
        onEditCaption={handleEditCaption}
        onEditCategory={handleEditCategory}
              onEditSchedule={handleEditSchedule}
              onToggleHidden={handleToggleHidden}
              onToggleClaimed={handleToggleClaimed}
              editingUrl={editingUrl}
        setEditingUrl={setEditingUrl}
        tempCaption={tempCaption}
        setTempCaption={setTempCaption}
        collection="flash"
        categories={CATEGORY_OPTIONS as unknown as string[]}
        showCategoryControl
        />
      )}
    </main>
  );
}
