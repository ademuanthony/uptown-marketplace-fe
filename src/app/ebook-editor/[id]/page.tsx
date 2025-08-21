'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { ebookService, Ebook, EbookPage } from '@/services/ebook';
import { useEbookStore } from '@/stores/ebookStore';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EbookEditor from '@/components/ebook/EbookEditor';
import toast from 'react-hot-toast';

export default function EbookEditorPage() {
  const params = useParams();
  const router = useRouter();
  const ebookId = params.id as string;

  const { loadEbook, setError, setLoading, isLoading, error } = useEbookStore();
  const [ebook, setEbook] = useState<Ebook | null>(null);
  const [user, loading, authError] = useAuthState(auth);

  useEffect(() => {
    if (!ebookId) {
      router.push('/ebooks');
      return;
    }

    // Wait for Firebase auth to initialize before making API calls
    if (loading) {
      return; // Still loading auth state
    }

    // Check if user is authenticated
    if (!user) {
      console.warn('User not authenticated, redirecting to login');
      router.push('/auth/login');
      return;
    }

    const loadEbookData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to load ebook details first
        let ebookData: Ebook | null = null;
        let pagesData: EbookPage[] = [];

        try {
          ebookData = await ebookService.getEbook(ebookId);
        } catch (ebookErr) {
          console.error('Failed to load ebook details:', ebookErr);
          // If we can't load the ebook, check if it's a 404 or auth issue
          if (ebookErr instanceof Error && ebookErr.message.includes('404')) {
            throw new Error('Ebook not found');
          }
          // Try loading from user's ebooks as fallback
          try {
            const userEbooks = await ebookService.getUserEbooks();
            ebookData = userEbooks.ebooks.find(e => e.id === ebookId) || null;
            if (!ebookData) {
              throw new Error('Ebook not found in your library');
            }
          } catch {
            throw new Error('Failed to load ebook');
          }
        }

        // Try to load pages
        try {
          const response = await ebookService.getEbookWithPages(ebookId);
          pagesData = response.pages || [];
        } catch (pagesErr) {
          console.warn('Could not load pages, will create default:', pagesErr);
          // If no pages exist, create a default one
          try {
            const newPage = await ebookService.createPage(ebookId, {
              title: 'Page 1',
              page_order: 1,
              content: {},
            });
            pagesData = [newPage];
          } catch (createErr) {
            console.warn('Could not create default page:', createErr);
            // Continue with empty pages - editor will handle it
            pagesData = [];
          }
        }

        if (ebookData) {
          setEbook(ebookData);
          loadEbook(ebookData, pagesData);
        } else {
          throw new Error('Failed to load ebook data');
        }
      } catch (err) {
        console.error('Failed to load ebook:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load ebook';
        setError(errorMessage);
        toast.error(errorMessage);

        // Redirect to ebooks list if ebook not found
        if (
          err instanceof Error &&
          (err.message.includes('not found') || err.message.includes('404'))
        ) {
          setTimeout(() => router.push('/ebooks'), 2000);
        }
      } finally {
        setLoading(false);
      }
    };

    loadEbookData();
  }, [ebookId, router, loadEbook, setError, setLoading, user, loading]);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600">
            {loading ? 'Authenticating...' : 'Loading ebook editor...'}
          </p>
        </div>
      </div>
    );
  }

  if (error || authError) {
    const displayError = authError?.message || error || 'An unexpected error occurred';
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {authError ? 'Authentication Error' : 'Error Loading Ebook'}
          </h2>
          <p className="text-gray-600 mb-6">{displayError}</p>
          <div className="space-x-4">
            <button
              onClick={() => (authError ? router.push('/auth/login') : window.location.reload())}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              {authError ? 'Login' : 'Try Again'}
            </button>
            <button
              onClick={() => router.push('/ebooks')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Back to Ebooks
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!ebook) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">📚</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ebook Not Found</h2>
          <p className="text-gray-600 mb-6">
            The ebook you&apos;re looking for doesn&apos;t exist or has been deleted.
          </p>
          <button
            onClick={() => router.push('/ebooks')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Back to Ebooks
          </button>
        </div>
      </div>
    );
  }

  return <EbookEditor ebook={ebook} />;
}
