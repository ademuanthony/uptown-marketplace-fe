'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeftIcon,
  DocumentArrowDownIcon,
  CloudArrowUpIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  EyeIcon,
  Cog6ToothIcon,
  PlusIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
} from '@heroicons/react/24/outline';
import { Ebook } from '@/services/ebook';
import { useEbookStore } from '@/stores/ebookStore';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface EditorToolbarProps {
  ebook: Ebook;
  onSave: () => void;
  onExit: () => void;
  isSaving: boolean;
  isDirty: boolean;
  lastSaved: Date | null;
  showToolPanel?: boolean;
  showPropertiesPanel?: boolean;
  onToggleToolPanel?: () => void;
  onTogglePropertiesPanel?: () => void;
}

export default function EditorToolbar({
  ebook,
  onSave,
  onExit,
  isSaving,
  isDirty,
  lastSaved,
  showToolPanel = true,
  showPropertiesPanel = true,
  onToggleToolPanel,
  onTogglePropertiesPanel,
}: EditorToolbarProps) {
  const { view, setZoom, resetView, history } = useEbookStore();
  const [showSettings, setShowSettings] = useState(false);

  const handleZoomIn = () => {
    setZoom(Math.min(view.zoom * 1.2, 5));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(view.zoom / 1.2, 0.1));
  };

  const handleExport = () => {
    // TODO: Implement export dialog
  };

  const handlePreview = () => {
    // TODO: Implement preview mode
  };

  const handleAddPage = useCallback(() => {
    const { pages, addPage } = useEbookStore.getState();
    addPage({
      ebook_id: ebook.id,
      title: `Page ${pages.length + 1}`,
      page_order: pages.length + 1,
      content: {},
      background_color: '#ffffff',
      background_image: '',
      settings: {},
    });
  }, [ebook.id]);

  // Listen for the addFirstPage event from canvas
  useEffect(() => {
    const handleAddFirstPage = () => {
      handleAddPage();
    };

    window.addEventListener('addFirstPage', handleAddFirstPage);
    return () => window.removeEventListener('addFirstPage', handleAddFirstPage);
  }, [ebook.id, handleAddPage]);

  return (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4">
      {/* Left Section */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onExit}
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back
        </button>

        <div className="h-6 w-px bg-gray-300" />

        <div className="flex flex-col">
          <h1 className="text-sm font-semibold text-gray-900 truncate max-w-xs">{ebook.title}</h1>
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            {isDirty && <span className="text-orange-500">• Unsaved</span>}
            {lastSaved && !isDirty && <span>Saved {lastSaved.toLocaleTimeString()}</span>}
            {isSaving && (
              <span className="flex items-center text-blue-500">
                <LoadingSpinner size="small" className="mr-1" />
                Saving...
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Center Section - Main Tools */}
      <div className="flex items-center space-x-1">
        <button
          onClick={() => {
            /* TODO: Implement undo */
          }}
          disabled={history.undoStack.length === 0}
          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Undo"
        >
          <ArrowUturnLeftIcon className="h-4 w-4" />
        </button>

        <button
          onClick={() => {
            /* TODO: Implement redo */
          }}
          disabled={history.redoStack.length === 0}
          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Redo"
        >
          <ArrowUturnRightIcon className="h-4 w-4" />
        </button>

        <div className="h-6 w-px bg-gray-300 mx-2" />

        <button
          onClick={handleZoomOut}
          className="p-2 text-gray-400 hover:text-gray-600"
          title="Zoom Out"
        >
          <MagnifyingGlassMinusIcon className="h-4 w-4" />
        </button>

        <span className="px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded min-w-[60px] text-center">
          {Math.round(view.zoom * 100)}%
        </span>

        <button
          onClick={handleZoomIn}
          className="p-2 text-gray-400 hover:text-gray-600"
          title="Zoom In"
        >
          <MagnifyingGlassPlusIcon className="h-4 w-4" />
        </button>

        <button
          onClick={resetView}
          className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
          title="Reset View"
        >
          Reset
        </button>

        <div className="h-6 w-px bg-gray-300 mx-2" />

        <button
          className="p-2 text-gray-400 hover:text-gray-600"
          title="Add Page"
          onClick={handleAddPage}
        >
          <PlusIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-2">
        <button
          onClick={handlePreview}
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
        >
          <EyeIcon className="h-4 w-4 mr-2" />
          Preview
        </button>

        <button
          onClick={handleExport}
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
        >
          <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
          Export
        </button>

        <button
          onClick={onSave}
          disabled={isSaving || !isDirty}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
        >
          {isSaving ? (
            <LoadingSpinner size="small" className="mr-2" />
          ) : (
            <CloudArrowUpIcon className="h-4 w-4 mr-2" />
          )}
          {isSaving ? 'Saving...' : 'Save'}
        </button>

        {/* Panel toggles */}
        {onToggleToolPanel && (
          <button
            onClick={onToggleToolPanel}
            className={`p-2 transition-colors ${
              showToolPanel ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
            }`}
            title="Toggle Tools Panel"
          >
            <PlusIcon className="h-4 w-4" />
          </button>
        )}

        {onTogglePropertiesPanel && (
          <button
            onClick={onTogglePropertiesPanel}
            className={`p-2 transition-colors ${
              showPropertiesPanel ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
            }`}
            title="Toggle Properties Panel"
          >
            <Cog6ToothIcon className="h-4 w-4" />
          </button>
        )}

        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 text-gray-400 hover:text-gray-600"
          title="Settings"
        >
          <Cog6ToothIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
