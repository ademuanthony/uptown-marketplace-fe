'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  PlusIcon,
  BookOpenIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  DocumentDuplicateIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

import { ebookService, Ebook } from '@/services/ebook';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function EbooksPage() {
  const router = useRouter();
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadEbooks = useCallback(async (retryCount = 0) => {
    try {
      if (retryCount === 0) {
        setIsLoading(true);
        setError(null);
      }

      const response = await ebookService.getUserEbooks();
      setEbooks(response.ebooks);
      console.info(response);

      // Success - clear loading state
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to load ebooks:', err);

      // If it's an auth error and we haven't retried yet, try once more after a short delay
      if (
        err instanceof Error &&
        err.message.includes('Invalid or expired token') &&
        retryCount < 1
      ) {
        console.info('Retrying ebook load due to auth error...');
        setTimeout(() => {
          loadEbooks(retryCount + 1);
        }, 1000);
        return;
      }

      // Failed after retries or non-auth error
      setError(err instanceof Error ? err.message : 'Failed to load ebooks');
      setIsLoading(false);

      // Only show toast error if it's not an auth error (to avoid spam)
      const errorMessage = err instanceof Error ? err.message : '';
      if (!errorMessage.includes('Invalid or expired token')) {
        toast.error('Failed to load ebooks');
      }
    }
  }, []);

  useEffect(() => {
    loadEbooks();
  }, [loadEbooks]);

  const handleCreateEbook = () => {
    router.push('/ebook-editor/new');
  };

  const handleEditEbook = (ebookId: string) => {
    router.push(`/ebook-editor/${ebookId}`);
  };

  const handleViewEbook = (ebook: Ebook) => {
    if (ebook.permalink) {
      router.push(`/ebooks/view/${ebook.permalink}`);
    } else {
      router.push(`/ebooks/view/${ebook.id}`);
    }
  };

  const handleDuplicateEbook = async (ebook: Ebook) => {
    try {
      setActionLoading(ebook.id);
      const duplicatedEbook = await ebookService.duplicateEbook(ebook.id);
      toast.success(`"${ebook.title}" duplicated successfully`);
      setEbooks(prev => [duplicatedEbook, ...prev]);
    } catch (err) {
      console.error('Failed to duplicate ebook:', err);
      toast.error('Failed to duplicate ebook');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePublishToggle = async (ebook: Ebook) => {
    try {
      setActionLoading(ebook.id);

      if (ebook.status === 'published') {
        await ebookService.unpublishEbook(ebook.id);
        toast.success(`"${ebook.title}" unpublished`);
      } else {
        await ebookService.publishEbook(ebook.id);
        toast.success(`"${ebook.title}" published`);
      }

      await loadEbooks(); // Reload to get updated status
    } catch (err) {
      console.error('Failed to toggle publish status:', err);
      toast.error(`Failed to ${ebook.status === 'published' ? 'unpublish' : 'publish'} ebook`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteEbook = async (ebook: Ebook) => {
    if (deleteConfirm !== ebook.id) {
      setDeleteConfirm(ebook.id);
      return;
    }

    try {
      setActionLoading(ebook.id);
      await ebookService.deleteEbook(ebook.id);
      toast.success(`"${ebook.title}" deleted successfully`);
      setEbooks(prev => prev.filter(e => e.id !== ebook.id));
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Failed to delete ebook:', err);
      toast.error('Failed to delete ebook');
    } finally {
      setActionLoading(null);
    }
  };

  const handleExportEbook = async (ebook: Ebook) => {
    try {
      setActionLoading(ebook.id);
      await ebookService.quickExportPDF(ebook.id);
      toast.success("PDF export started. You will be notified when it's ready.");

      // You could implement a notification system here to track export progress
    } catch (err) {
      console.error('Failed to export ebook:', err);
      toast.error('Failed to start export');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'archived':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold leading-6 text-gray-900">My Ebooks</h1>
            <p className="mt-2 text-sm text-gray-700">
              Create, edit, and manage your digital books
            </p>
          </div>
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <button
              type="button"
              onClick={handleCreateEbook}
              className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              <PlusIcon className="inline-block w-4 h-4 mr-2" />
              Create Ebook
            </button>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="mt-6 rounded-md bg-red-50 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-red-700">{error}</div>
              <button
                onClick={() => loadEbooks()}
                className="ml-4 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && (!ebooks || ebooks.length === 0) && !error && (
          <div className="mt-12 text-center">
            <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No ebooks</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating your first ebook.</p>
            <div className="mt-6">
              <button
                type="button"
                onClick={handleCreateEbook}
                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" />
                Create Ebook
              </button>
            </div>
          </div>
        )}

        {/* Ebooks grid */}
        {ebooks && ebooks.length > 0 && (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {ebooks.map(ebook => (
                <motion.div
                  key={ebook.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="col-span-1 divide-y divide-gray-200 rounded-lg bg-white shadow hover:shadow-md transition-shadow"
                >
                  {/* Cover image */}
                  <div className="w-full">
                    {ebook.cover_image ? (
                      <Image
                        className="h-48 w-full rounded-t-lg object-cover"
                        src={ebook.cover_image}
                        alt={ebook.title}
                        width={400}
                        height={192}
                      />
                    ) : (
                      <div className="h-48 w-full rounded-t-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <BookOpenIcon className="h-16 w-16 text-white opacity-75" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {ebook.title}
                        </h3>
                        {ebook.description && (
                          <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                            {ebook.description}
                          </p>
                        )}
                      </div>
                      <span
                        className={`ml-2 flex-shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(ebook.status)}`}
                      >
                        {ebook.status}
                      </span>
                    </div>

                    {/* Metadata */}
                    <div className="mt-4 flex items-center text-sm text-gray-500">
                      <CalendarIcon className="mr-1.5 h-4 w-4" />
                      {format(new Date(ebook.updated_at), 'MMM d, yyyy')}
                      {ebook.page_count && <span className="ml-4">{ebook.page_count} pages</span>}
                    </div>

                    {/* Tags */}
                    {ebook.tags && ebook.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {ebook.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700"
                          >
                            {tag}
                          </span>
                        ))}
                        {ebook.tags.length > 3 && (
                          <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                            +{ebook.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="p-4 bg-gray-50 rounded-b-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditEbook(ebook.id)}
                          disabled={actionLoading === ebook.id}
                          className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                        >
                          <PencilIcon className="h-4 w-4 mr-1" />
                          Edit
                        </button>

                        <button
                          onClick={() => handleViewEbook(ebook)}
                          disabled={actionLoading === ebook.id}
                          className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          View
                        </button>
                      </div>

                      {/* Dropdown menu */}
                      <div className="relative">
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleExportEbook(ebook)}
                            disabled={actionLoading === ebook.id}
                            className="inline-flex items-center p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                            title="Export PDF"
                          >
                            <DocumentArrowDownIcon className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => handleDuplicateEbook(ebook)}
                            disabled={actionLoading === ebook.id}
                            className="inline-flex items-center p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                            title="Duplicate"
                          >
                            <DocumentDuplicateIcon className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteEbook(ebook)}
                            disabled={actionLoading === ebook.id}
                            className={`inline-flex items-center p-1.5 hover:text-red-600 disabled:opacity-50 ${
                              deleteConfirm === ebook.id ? 'text-red-600' : 'text-gray-400'
                            }`}
                            title={deleteConfirm === ebook.id ? 'Click again to confirm' : 'Delete'}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Publish toggle */}
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => handlePublishToggle(ebook)}
                        disabled={actionLoading === ebook.id}
                        className={`w-full inline-flex justify-center items-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm disabled:opacity-50 ${
                          ebook.status === 'published'
                            ? 'bg-red-600 text-white hover:bg-red-500'
                            : 'bg-green-600 text-white hover:bg-green-500'
                        }`}
                      >
                        {actionLoading === ebook.id ? (
                          <LoadingSpinner size="small" className="mr-2" />
                        ) : null}
                        {ebook.status === 'published' ? 'Unpublish' : 'Publish'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
