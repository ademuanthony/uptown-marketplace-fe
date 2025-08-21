'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpenIcon, PlusIcon } from '@heroicons/react/24/outline';
import { ebookService } from '@/services/ebook';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function NewEbookPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateEbook = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Please enter a title for your ebook');
      return;
    }

    try {
      setIsCreating(true);
      const ebook = await ebookService.createEbook({
        title: title.trim(),
        description: description.trim() || undefined,
      });

      // Create a default first page for the ebook
      try {
        await ebookService.createPage(ebook.id, {
          title: 'Page 1',
          page_order: 1,
          content: {},
        });
      } catch (pageError) {
        console.warn('Could not create default page:', pageError);
        // Continue anyway - the editor will handle empty ebooks
      }

      toast.success('Ebook created successfully!');
      router.push(`/ebook-editor/${ebook.id}`);
    } catch (error) {
      console.error('Failed to create ebook:', error);
      toast.error('Failed to create ebook');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center">
            <BookOpenIcon className="h-6 w-6 text-indigo-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create New Ebook
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Start crafting your digital masterpiece
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleCreateEbook}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="title" className="sr-only">
                Ebook Title
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Ebook title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                disabled={isCreating}
              />
            </div>
            <div>
              <label htmlFor="description" className="sr-only">
                Description (optional)
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm resize-none"
                placeholder="Description (optional)"
                value={description}
                onChange={e => setDescription(e.target.value)}
                disabled={isCreating}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isCreating || !title.trim()}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? (
                <LoadingSpinner size="small" className="mr-2" />
              ) : (
                <PlusIcon className="h-4 w-4 mr-2" />
              )}
              {isCreating ? 'Creating...' : 'Create Ebook'}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => router.back()}
              className="text-sm text-gray-600 hover:text-gray-900"
              disabled={isCreating}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
