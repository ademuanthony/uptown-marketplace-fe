'use client';

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useEbookStore } from '@/stores/ebookStore';
import TextEditor from './TextEditor';

export default function EditorCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const {
    pages,
    selection,
    view,
    elements,
    setCurrentPage,
    setPan,
    toggleGrid,
    toggleGuides,
    toggleSnapToGrid,
    selectElement,
    clearSelection,
    updateElement,
  } = useEbookStore();

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [editingElement, setEditingElement] = useState<string | null>(null);

  const currentPage = pages.find(p => p.id === selection.selectedPageId);
  const currentPageElements = useMemo(() => {
    return selection.selectedPageId ? elements[selection.selectedPageId] || [] : [];
  }, [selection.selectedPageId, elements]);

  // Initialize with first page if none selected
  useEffect(() => {
    if (pages.length > 0 && !selection.selectedPageId && pages[0]) {
      setCurrentPage(pages[0].id);
    }
  }, [pages, selection.selectedPageId, setCurrentPage]);

  // Handle mouse events for pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
      // Middle mouse or Ctrl+click
      setIsDragging(true);
      setDragStart({ x: e.clientX - view.pan.x, y: e.clientY - view.pan.y });
      e.preventDefault();
    }
  };

  // Handle wheel events for zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      // TODO: Implement zoom at cursor position
      // const delta = e.deltaY > 0 ? 0.9 : 1.1;
      // setZoom(Math.max(0.1, Math.min(5, view.zoom * delta)));
    }
  };

  // Handle element selection
  const handleElementClick = useCallback(
    (elementId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const isMultiSelect = e.ctrlKey || e.metaKey;
      selectElement(elementId, isMultiSelect);
    },
    [selectElement],
  );

  // Handle element drag start
  const handleElementMouseDown = useCallback(
    (elementId: string, e: React.MouseEvent) => {
      e.stopPropagation();

      const element = currentPageElements.find(el => el.id === elementId);
      if (!element) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (!canvasRect) return;

      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;

      setDraggedElement(elementId);
      setDragOffset({ x: offsetX, y: offsetY });

      // Select the element if not already selected
      if (!selection.selectedElements.includes(elementId)) {
        selectElement(elementId);
      }
    },
    [currentPageElements, selection.selectedElements, selectElement],
  );

  // Handle canvas click (clear selection)
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        clearSelection();
      }
    },
    [clearSelection],
  );

  // Handle mouse move for element dragging
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) {
        setPan({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      } else if (draggedElement) {
        const canvasRect = canvasRef.current?.getBoundingClientRect();
        if (!canvasRect) return;

        const element = currentPageElements.find(el => el.id === draggedElement);
        if (!element) return;

        // Calculate new position relative to canvas
        const canvasX = (e.clientX - canvasRect.left - view.pan.x) / view.zoom - dragOffset.x;
        const canvasY = (e.clientY - canvasRect.top - view.pan.y) / view.zoom - dragOffset.y;

        // Snap to grid if enabled
        let newX = canvasX;
        let newY = canvasY;

        if (view.snapToGrid) {
          const gridSize = 20;
          newX = Math.round(canvasX / gridSize) * gridSize;
          newY = Math.round(canvasY / gridSize) * gridSize;
        }

        // Constrain to canvas bounds
        newX = Math.max(0, Math.min(newX, view.canvasSize.width - (element.width || 100)));
        newY = Math.max(0, Math.min(newY, view.canvasSize.height - (element.height || 100)));

        updateElement(draggedElement, {
          position_x: newX,
          position_y: newY,
        });
      }
    },
    [
      isDragging,
      draggedElement,
      dragStart,
      view,
      dragOffset,
      currentPageElements,
      updateElement,
      setPan,
    ],
  );

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDraggedElement(null);
    setDragOffset({ x: 0, y: 0 });
  }, []);

  if (!currentPage) {
    if (pages.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="text-gray-400 text-6xl mb-4">📚</div>
            <h3 className="text-lg font-medium text-gray-900">No Pages Yet</h3>
            <p className="text-gray-500 mb-4">Create your first page to start designing</p>
            <button
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              onClick={() => {
                // This would be handled by the toolbar's add page button
                window.dispatchEvent(new CustomEvent('addFirstPage'));
              }}
            >
              Create First Page
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">📄</div>
          <h3 className="text-lg font-medium text-gray-900">No Page Selected</h3>
          <p className="text-gray-500">Select a page from the navigator to start editing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative overflow-hidden bg-gray-100">
      {/* Canvas Controls */}
      <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-sm border border-gray-200 p-2">
        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={toggleGrid}
            className={`px-2 py-1 rounded ${
              view.showGrid ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Grid
          </button>
          <button
            onClick={toggleGuides}
            className={`px-2 py-1 rounded ${
              view.showGuides ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Guides
          </button>
          <button
            onClick={toggleSnapToGrid}
            className={`px-2 py-1 rounded ${
              view.snapToGrid ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Snap
          </button>
        </div>
      </div>

      {/* Main Canvas */}
      <div
        ref={canvasRef}
        className="w-full h-full overflow-auto"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onClick={handleCanvasClick}
        style={{
          transform: `translate(${view.pan.x}px, ${view.pan.y}px)`,
          cursor: draggedElement ? 'grabbing' : isDragging ? 'grabbing' : 'default',
        }}
      >
        {/* Grid Background */}
        {view.showGrid && (
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `
                linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px',
            }}
          />
        )}

        {/* Page Container */}
        <div
          className="relative mx-auto my-16 bg-white shadow-lg"
          style={{
            width: `${view.canvasSize.width * view.zoom}px`,
            height: `${view.canvasSize.height * view.zoom}px`,
            transform: `scale(${view.zoom})`,
            transformOrigin: 'top left',
          }}
        >
          {/* Page Background */}
          <div
            className="w-full h-full relative"
            style={{
              backgroundColor: currentPage.background_color || '#ffffff',
              backgroundImage: currentPage.background_image
                ? `url(${currentPage.background_image})`
                : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Guides */}
            {view.showGuides && (
              <>
                {/* Center guides */}
                <div className="absolute top-0 left-1/2 w-px h-full bg-blue-300 opacity-50 transform -translate-x-px" />
                <div className="absolute left-0 top-1/2 w-full h-px bg-blue-300 opacity-50 transform -translate-y-px" />
                {/* Margin guides */}
                <div className="absolute inset-4 border border-dashed border-gray-300 opacity-30" />
              </>
            )}

            {/* Page Elements */}
            {currentPageElements.map(element => {
              // Extract position and size from JSON data structure
              const position = element.position || {};
              const elementData = element.element_data || {};
              const styles = element.styles || {};

              const left = position.x || 50;
              const top = position.y || 50;
              const width = position.width || elementData.width || 200;
              const height = position.height || elementData.height || 100;

              return (
                <div
                  key={element.id}
                  className={`absolute border-2 ${
                    selection.selectedElements.includes(element.id)
                      ? 'border-indigo-500'
                      : 'border-transparent hover:border-gray-300'
                  } transition-colors select-none`}
                  style={{
                    left: `${left}px`,
                    top: `${top}px`,
                    width: `${width}px`,
                    height: `${height}px`,
                    zIndex: element.z_index || 1,
                    cursor: draggedElement === element.id ? 'grabbing' : 'grab',
                    ...styles, // Apply any custom styles from the styles field
                  }}
                  onClick={e => handleElementClick(element.id, e)}
                  onMouseDown={e => handleElementMouseDown(element.id, e)}
                >
                  {/* Element Content */}
                  {element.element_type === 'text' && (
                    <TextEditor
                      element={element}
                      isEditing={editingElement === element.id}
                      onStartEdit={() => setEditingElement(element.id)}
                      onFinishEdit={() => setEditingElement(null)}
                    />
                  )}

                  {element.element_type === 'image' && (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                      {elementData.asset_url || elementData.src ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={
                            (elementData.asset_url as string) || (elementData.src as string) || ''
                          }
                          alt={(elementData.alt as string) || 'Image'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        'Image Placeholder'
                      )}
                    </div>
                  )}

                  {element.element_type === 'shape' && (
                    <div
                      className="w-full h-full"
                      style={{
                        backgroundColor:
                          (elementData.fillColor as string) ||
                          (styles.backgroundColor as string) ||
                          '#e5e7eb',
                        borderColor:
                          (elementData.strokeColor as string) ||
                          (styles.borderColor as string) ||
                          '#6b7280',
                        borderWidth: `${elementData.strokeWidth || styles.borderWidth || 1}px`,
                        borderRadius:
                          elementData.borderRadius || styles.borderRadius
                            ? `${elementData.borderRadius || styles.borderRadius}px`
                            : '0',
                      }}
                    />
                  )}

                  {element.element_type === 'heading' && (
                    <div
                      className="w-full h-full flex items-center"
                      style={{
                        fontSize:
                          (elementData.fontSize as string) || (styles.fontSize as string) || '24px',
                        fontWeight:
                          (elementData.fontWeight as string) ||
                          (styles.fontWeight as string) ||
                          'bold',
                        color:
                          (elementData.color as string) || (styles.color as string) || '#000000',
                        textAlign:
                          (elementData.textAlign as 'left' | 'center' | 'right') ||
                          (styles.textAlign as 'left' | 'center' | 'right') ||
                          'left',
                      }}
                    >
                      {(elementData.text as string) || 'Heading'}
                    </div>
                  )}

                  {/* Selection handles */}
                  {selection.selectedElements.includes(element.id) && (
                    <>
                      {/* Corner handles */}
                      <div className="absolute -top-1 -left-1 w-2 h-2 bg-indigo-500 border border-white cursor-nw-resize" />
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 border border-white cursor-ne-resize" />
                      <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-indigo-500 border border-white cursor-sw-resize" />
                      <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-indigo-500 border border-white cursor-se-resize" />

                      {/* Side handles */}
                      <div className="absolute -top-1 left-1/2 w-2 h-2 bg-indigo-500 border border-white cursor-n-resize transform -translate-x-1" />
                      <div className="absolute -bottom-1 left-1/2 w-2 h-2 bg-indigo-500 border border-white cursor-s-resize transform -translate-x-1" />
                      <div className="absolute -left-1 top-1/2 w-2 h-2 bg-indigo-500 border border-white cursor-w-resize transform -translate-y-1" />
                      <div className="absolute -right-1 top-1/2 w-2 h-2 bg-indigo-500 border border-white cursor-e-resize transform -translate-y-1" />
                    </>
                  )}
                </div>
              );
            })}

            {/* Empty page placeholder */}
            {currentPageElements.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <div className="text-4xl mb-2">✨</div>
                  <p className="text-sm">Click to add content</p>
                  <p className="text-xs">Or drag from the toolbar</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Help text */}
      <div className="absolute bottom-4 left-4 text-xs text-gray-500 bg-white px-2 py-1 rounded border">
        {isDragging ? 'Dragging...' : 'Ctrl+Click to pan • Ctrl+Scroll to zoom'}
      </div>
    </div>
  );
}
