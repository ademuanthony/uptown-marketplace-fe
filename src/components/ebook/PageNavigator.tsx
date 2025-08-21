'use client';

import { useState } from 'react';
import { PlusIcon, TrashIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import { useEbookStore } from '@/stores/ebookStore';
import { EbookPage } from '@/services/ebook';

export default function PageNavigator() {
  const { pages, selection, setCurrentPage, addPage, deletePage, reorderPages, elements } =
    useEbookStore();

  const [draggedPageId, setDraggedPageId] = useState<string | null>(null);

  const handlePageSelect = (pageId: string) => {
    setCurrentPage(pageId);
  };

  const handleAddPage = () => {
    const newPageOrder = pages.length + 1;
    addPage({
      ebook_id: pages[0]?.ebook_id || '',
      title: `Page ${newPageOrder}`,
      content: {},
      page_order: newPageOrder,
      background_color: '#ffffff',
      settings: {},
    });
  };

  const handleDuplicatePage = (page: EbookPage) => {
    const newPageOrder = pages.length + 1;
    addPage({
      ebook_id: page.ebook_id,
      title: `${page.title} (Copy)`,
      content: page.content,
      page_order: newPageOrder,
      background_color: page.background_color,
      background_image: page.background_image,
      settings: page.settings,
    });
  };

  const handleDeletePage = (pageId: string) => {
    if (pages.length <= 1) {
      alert('Cannot delete the last page');
      return;
    }

    if (confirm('Are you sure you want to delete this page?')) {
      deletePage(pageId);
    }
  };

  const handleDragStart = (e: React.DragEvent, pageId: string) => {
    setDraggedPageId(pageId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetPageId: string) => {
    e.preventDefault();

    if (!draggedPageId || draggedPageId === targetPageId) {
      setDraggedPageId(null);
      return;
    }

    const draggedIndex = pages.findIndex(p => p.id === draggedPageId);
    const targetIndex = pages.findIndex(p => p.id === targetPageId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newPages = [...pages];
    const [draggedPage] = newPages.splice(draggedIndex, 1);
    if (draggedPage) {
      newPages.splice(targetIndex, 0, draggedPage);
    }

    const reorderedPageIds = newPages.map(p => p.id);
    reorderPages(reorderedPageIds);

    setDraggedPageId(null);
  };

  const getPageElementCount = (pageId: string) => {
    return elements[pageId]?.length || 0;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Pages</h3>
          <button
            onClick={handleAddPage}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Add Page"
          >
            <PlusIcon className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {pages.length} page{pages.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Pages List */}
      <div className="flex-1 overflow-auto p-2 space-y-2">
        {pages.map((page, index) => {
          const isSelected = selection.selectedPageId === page.id;
          const elementCount = getPageElementCount(page.id);

          return (
            <div
              key={page.id}
              draggable
              onDragStart={e => handleDragStart(e, page.id)}
              onDragOver={handleDragOver}
              onDrop={e => handleDrop(e, page.id)}
              className={`relative group cursor-pointer rounded-lg border-2 transition-all ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              } ${draggedPageId === page.id ? 'opacity-50' : ''}`}
              onClick={() => handlePageSelect(page.id)}
            >
              {/* Page Thumbnail */}
              <div className="p-3">
                <div
                  className="w-full h-24 bg-white border border-gray-200 rounded shadow-sm flex items-center justify-center text-xs text-gray-500 mb-2"
                  style={{
                    backgroundColor: page.background_color || '#ffffff',
                    backgroundImage: page.background_image
                      ? `url(${page.background_image})`
                      : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  {elementCount === 0 ? (
                    'Empty Page'
                  ) : (
                    <div className="text-center">
                      <div className="text-gray-400 mb-1">📄</div>
                      <div>
                        {elementCount} element{elementCount !== 1 ? 's' : ''}
                      </div>
                    </div>
                  )}
                </div>

                {/* Page Info */}
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {page.title || `Page ${index + 1}`}
                    </h4>
                    <p className="text-xs text-gray-500">Page {index + 1}</p>
                  </div>
                  <div className="text-xs text-gray-400">{index + 1}</div>
                </div>
              </div>

              {/* Page Actions */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex space-x-1">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleDuplicatePage(page);
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 bg-white rounded shadow-sm"
                    title="Duplicate Page"
                  >
                    <DocumentDuplicateIcon className="h-3 w-3" />
                  </button>

                  {pages.length > 1 && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleDeletePage(page.id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 bg-white rounded shadow-sm"
                      title="Delete Page"
                    >
                      <TrashIcon className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Drag Indicator */}
              {draggedPageId && draggedPageId !== page.id && (
                <div className="absolute -top-1 left-0 right-0 h-0.5 bg-indigo-500 opacity-0 group-hover:opacity-100" />
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleAddPage}
          className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Page
        </button>
      </div>
    </div>
  );
}
