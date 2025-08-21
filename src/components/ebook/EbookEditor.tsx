'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Ebook, EbookPage, ebookService } from '@/services/ebook';
import { useEbookStore } from '@/stores/ebookStore';
import EditorToolbar from './EditorToolbar';
import EditorCanvas from './EditorCanvas';
import PageNavigator from './PageNavigator';
import PropertiesPanel from './PropertiesPanel';
import ToolPanel from './ToolPanel';
import toast from 'react-hot-toast';

interface EbookEditorProps {
  ebook: Ebook;
}

export default function EbookEditor({ ebook }: EbookEditorProps) {
  const router = useRouter();
  const {
    currentEbook,
    pages,
    elements,
    isDirty,
    lastSaved,
    autoSaveEnabled,
    selection,
    markClean,
    setLastSaved,
    setError,
    updatePage,
    updateElement,
  } = useEbookStore();

  const [isSaving, setIsSaving] = useState(false);
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(true);
  const [showToolPanel, setShowToolPanel] = useState(true);

  // Auto-save functionality
  const saveEbook = useCallback(
    async (showToast = true) => {
      if (!currentEbook || !isDirty) return;

      try {
        setIsSaving(true);

        // Save ebook metadata
        await ebookService.updateEbook(currentEbook.id, {
          title: currentEbook.title,
          description: currentEbook.description,
          tags: currentEbook.tags,
          cover_image: currentEbook.cover_image,
        });

        // Save all pages and their elements
        const savePromises: Promise<unknown>[] = [];

        for (const page of pages) {
          // Check if page ID is client-generated (starts with 'page_')
          const isClientPage = page.id.startsWith('page_');

          let savedPage: EbookPage | undefined;
          if (isClientPage) {
            // Create new page on backend since it's client-generated
            try {
              savedPage = await ebookService.createPage(currentEbook.id, {
                title: page.title,
                page_order: page.page_order || 1,
                content: page.content,
                background_color: page.background_color,
                background_image: page.background_image,
                settings: page.settings,
              });

              // Update the store with the new backend ID
              updatePage(page.id, { id: savedPage.id });
            } catch (error) {
              console.warn(`Failed to create page:`, error);
              continue;
            }
          } else {
            // Update existing page
            try {
              savedPage = await ebookService.updatePage(page.id, {
                title: page.title,
                content: page.content,
                background_color: page.background_color,
                background_image: page.background_image,
                settings: page.settings,
              });
            } catch (error) {
              console.warn(`Failed to update page:`, error);
              continue;
            }
          }

          // Save elements for this page
          const pageElements = elements[page.id] || [];
          const targetPageId = savedPage?.id || page.id;

          for (const element of pageElements) {
            const isClientElement = element.id.startsWith('element_');

            if (isClientElement) {
              // Create new element on backend
              const elementPromise = ebookService
                .createElement(targetPageId, {
                  element_type: element.element_type,
                  element_data: element.element_data,
                  position: element.position,
                  styles: element.styles,
                  z_index: element.z_index,
                  is_locked: element.is_locked,
                  is_visible: element.is_visible,
                })
                .then(savedElement => {
                  // Update the store with the new backend ID
                  updateElement(element.id, { id: savedElement.id });
                  return savedElement;
                })
                .catch(error => {
                  console.warn(`Failed to create element:`, error);
                  throw error;
                });
              savePromises.push(elementPromise);
            } else {
              // Update existing element
              const elementPromise = ebookService.updateElement(element.id, {
                element_type: element.element_type,
                element_data: element.element_data,
                position: element.position,
                styles: element.styles,
                z_index: element.z_index,
                is_locked: element.is_locked,
                is_visible: element.is_visible,
              });
              savePromises.push(elementPromise);
            }
          }
        }

        // Wait for all saves to complete
        await Promise.allSettled(savePromises);

        markClean();
        setLastSaved(new Date());

        if (showToast) {
          toast.success('Ebook saved successfully');
        }
      } catch (error) {
        console.error('Failed to save ebook:', error);
        setError('Failed to save ebook');
        if (showToast) {
          toast.error('Failed to save ebook');
        }
      } finally {
        setIsSaving(false);
      }
    },
    [
      currentEbook,
      isDirty,
      pages,
      elements,
      markClean,
      setLastSaved,
      setError,
      updatePage,
      updateElement,
    ],
  );

  // Auto-save effect
  useEffect(() => {
    if (!autoSaveEnabled || !isDirty) return;

    const autoSaveTimer = setTimeout(() => {
      saveEbook(false);
    }, 5000); // Auto-save after 5 seconds of inactivity

    return () => clearTimeout(autoSaveTimer);
  }, [autoSaveEnabled, isDirty, saveEbook]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + S for save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        saveEbook();
      }

      // Cmd/Ctrl + Z for undo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        // undo(); // Implement undo from store
      }

      // Cmd/Ctrl + Shift + Z for redo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        // redo(); // Implement redo from store
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveEbook]);

  const handleExit = () => {
    if (isDirty) {
      const confirmExit = window.confirm(
        'You have unsaved changes. Do you want to save before leaving?',
      );
      if (confirmExit) {
        saveEbook().then(() => router.push('/ebooks'));
      } else {
        router.push('/ebooks');
      }
    } else {
      router.push('/ebooks');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Toolbar */}
      <EditorToolbar
        ebook={currentEbook || ebook}
        onSave={() => saveEbook()}
        onExit={handleExit}
        isSaving={isSaving}
        isDirty={isDirty}
        lastSaved={lastSaved}
        showToolPanel={showToolPanel}
        showPropertiesPanel={showPropertiesPanel}
        onToggleToolPanel={() => setShowToolPanel(!showToolPanel)}
        onTogglePropertiesPanel={() => setShowPropertiesPanel(!showPropertiesPanel)}
      />

      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Page Navigator */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
          <PageNavigator />
        </div>

        {/* Tool Panel */}
        {showToolPanel && (
          <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
            <ToolPanel onClose={() => setShowToolPanel(false)} />
          </div>
        )}

        {/* Canvas Area */}
        <div className="flex-1 flex flex-col bg-gray-100">
          <EditorCanvas />
        </div>

        {/* Properties Panel */}
        {showPropertiesPanel && (
          <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
            <PropertiesPanel onClose={() => setShowPropertiesPanel(false)} />
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="h-6 bg-gray-800 text-white text-xs flex items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <span>
            {pages.length} page{pages.length !== 1 ? 's' : ''}
          </span>
          {selection.selectedPageId && (
            <span>Page {pages.findIndex(p => p.id === selection.selectedPageId) + 1}</span>
          )}
          {selection.selectedElements.length > 0 && (
            <span>
              {selection.selectedElements.length} element
              {selection.selectedElements.length !== 1 ? 's' : ''} selected
            </span>
          )}
        </div>
        <div className="flex items-center space-x-4">
          {lastSaved && <span>Saved {lastSaved.toLocaleTimeString()}</span>}
          {isDirty && <span className="text-yellow-400">• Unsaved changes</span>}
          {isSaving && <span className="text-blue-400">Saving...</span>}
        </div>
      </div>
    </div>
  );
}
