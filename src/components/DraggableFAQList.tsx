'use client';

import { useState, useRef } from 'react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  order: number;
}

interface DraggableFAQListProps {
  items: FAQItem[];
  onReorder: (newOrder: FAQItem[]) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, question: string, answer: string) => void;
}

export default function DraggableFAQList({
  items,
  onReorder,
  onDelete,
  onEdit
}: DraggableFAQListProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
  const dragRef = useRef<HTMLDivElement | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.outerHTML);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newItems = [...items];
    const [draggedItem] = newItems.splice(draggedIndex, 1);
    newItems.splice(dropIndex, 0, draggedItem);

    handleReorder(newItems);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleReorder = (newOrder: FAQItem[]) => {
    onReorder(newOrder);
    saveOrder(newOrder);
  };

  const saveOrder = async (newOrder: FAQItem[]) => {
    try {
      const response = await fetch('/api/faq', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: newOrder
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save order');
      }
    } catch (error) {
      console.error('Error saving order:', error);
      alert('Failed to save the new order. Please try again.');
    }
  };

  const handleDeleteClick = (id: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this FAQ item? This action cannot be undone.'
    );
    
    if (confirmed) {
      onDelete(id);
    }
  };

  const startEditing = (item: FAQItem) => {
    setEditingId(item.id);
    setEditQuestion(item.question);
    setEditAnswer(item.answer);
  };

  const saveEdit = () => {
    if (editingId && editQuestion.trim() && editAnswer.trim()) {
      onEdit(editingId, editQuestion.trim(), editAnswer.trim());
      setEditingId(null);
      setEditQuestion('');
      setEditAnswer('');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditQuestion('');
    setEditAnswer('');
  };

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div
          key={item.id}
          ref={dragRef}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
          className={`bg-white rounded-lg shadow-sm border cursor-move transition-all duration-200 ${
            draggedIndex === index ? 'opacity-50 scale-95' : ''
          } ${
            dragOverIndex === index && draggedIndex !== index ? 'border-2 border-blue-500 border-dashed' : ''
          }`}
        >
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="bg-gray-800 bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                {index + 1}
              </div>
              <div className="flex-1">
                {editingId === item.id ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editQuestion}
                      onChange={(e) => setEditQuestion(e.target.value)}
                      className="w-full p-2 border rounded text-lg font-light"
                      placeholder="Question"
                    />
                    <textarea
                      value={editAnswer}
                      onChange={(e) => setEditAnswer(e.target.value)}
                      rows={4}
                      className="w-full p-2 border rounded resize-vertical"
                      placeholder="Answer"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={saveEdit}
                        className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-lg font-light text-[#414141] mb-2">{item.question}</h3>
                    <div className="text-[#414141] leading-relaxed whitespace-pre-line">
                      {item.answer}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {editingId !== item.id && (
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => startEditing(item)}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                  title="Edit FAQ item"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteClick(item.id)}
                  className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                  title="Delete FAQ item"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
