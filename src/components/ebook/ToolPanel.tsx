'use client';

import { useState } from 'react';
import {
  PhotoIcon,
  DocumentTextIcon,
  Square3Stack3DIcon,
  PaintBrushIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { useEbookStore } from '@/stores/ebookStore';
import { EbookElement } from '@/services/ebook';

interface ToolPanelProps {
  onClose?: () => void;
}

export default function ToolPanel({ onClose }: ToolPanelProps) {
  const { selection, addElement, setTool, currentTool } = useEbookStore();
  const [activeCategory, setActiveCategory] = useState<'elements' | 'templates' | 'ai'>('elements');

  const tools = [
    {
      id: 'text',
      name: 'Text',
      icon: DocumentTextIcon,
      description: 'Add text elements',
      category: 'elements',
    },
    {
      id: 'image',
      name: 'Image',
      icon: PhotoIcon,
      description: 'Add images',
      category: 'elements',
    },
    {
      id: 'shape',
      name: 'Shape',
      icon: Square3Stack3DIcon,
      description: 'Add shapes',
      category: 'elements',
    },
    {
      id: 'background',
      name: 'Background',
      icon: PaintBrushIcon,
      description: 'Change background',
      category: 'elements',
    },
  ];

  const handleAddElement = (elementType: 'text' | 'image' | 'shape') => {
    if (!selection.selectedPageId) {
      alert('Please select a page first');
      return;
    }

    const baseElement = {
      page_id: selection.selectedPageId,
      element_type: elementType,
      position: {
        x: 100,
        y: 100,
        width: elementType === 'text' ? 200 : 150,
        height: elementType === 'text' ? 50 : 100,
      },
      z_index: 1,
      is_locked: false,
      is_visible: true,
      element_data: {},
      styles: {},
    };

    let elementData: Omit<EbookElement, 'id' | 'created_at' | 'updated_at'>;

    switch (elementType) {
      case 'text':
        elementData = {
          ...baseElement,
          element_data: {
            text: 'Click to edit text',
            content: 'Click to edit text',
            type: 'text',
          },
          styles: {
            fontSize: 16,
            color: '#000000',
            fontFamily: 'Inter',
            fontWeight: 'normal',
            textAlign: 'left',
          },
        };
        break;
      case 'image':
        elementData = {
          ...baseElement,
          element_data: {
            src: 'https://via.placeholder.com/150x100?text=Image',
            alt: 'Placeholder image',
            type: 'image',
          },
          styles: {
            borderRadius: 0,
            opacity: 1,
          },
        };
        break;
      case 'shape':
        elementData = {
          ...baseElement,
          element_data: {
            shape: 'rectangle',
            type: 'shape',
          },
          styles: {
            fillColor: '#e5e7eb',
            strokeColor: '#6b7280',
            strokeWidth: 1,
            borderRadius: 0,
          },
        };
        break;
      default:
        return;
    }

    addElement(selection.selectedPageId, elementData);
  };

  const handleToolSelect = (toolId: string) => {
    setTool({
      type: toolId as 'select' | 'text' | 'image' | 'shape' | 'draw',
      options: {},
    });
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Tools</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              ×
            </button>
          )}
        </div>

        {/* Category Tabs */}
        <div className="mt-3 flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveCategory('elements')}
            className={`flex-1 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              activeCategory === 'elements'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Elements
          </button>
          <button
            onClick={() => setActiveCategory('templates')}
            className={`flex-1 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              activeCategory === 'templates'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Templates
          </button>
          <button
            onClick={() => setActiveCategory('ai')}
            className={`flex-1 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              activeCategory === 'ai'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            AI
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeCategory === 'elements' && (
          <div className="space-y-4">
            {/* Quick Add Section */}
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-3 uppercase tracking-wider">
                Quick Add
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleAddElement('text')}
                  className="p-3 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors group"
                >
                  <DocumentTextIcon className="h-6 w-6 text-gray-600 group-hover:text-indigo-600 mx-auto mb-1" />
                  <div className="text-xs font-medium text-gray-900">Text</div>
                  <div className="text-xs text-gray-500">Add text</div>
                </button>

                <button
                  onClick={() => handleAddElement('image')}
                  className="p-3 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors group"
                >
                  <PhotoIcon className="h-6 w-6 text-gray-600 group-hover:text-indigo-600 mx-auto mb-1" />
                  <div className="text-xs font-medium text-gray-900">Image</div>
                  <div className="text-xs text-gray-500">Add image</div>
                </button>

                <button
                  onClick={() => handleAddElement('shape')}
                  className="p-3 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors group"
                >
                  <Square3Stack3DIcon className="h-6 w-6 text-gray-600 group-hover:text-indigo-600 mx-auto mb-1" />
                  <div className="text-xs font-medium text-gray-900">Shape</div>
                  <div className="text-xs text-gray-500">Add shape</div>
                </button>

                <button
                  onClick={() => handleToolSelect('background')}
                  className="p-3 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors group"
                >
                  <PaintBrushIcon className="h-6 w-6 text-gray-600 group-hover:text-indigo-600 mx-auto mb-1" />
                  <div className="text-xs font-medium text-gray-900">Background</div>
                  <div className="text-xs text-gray-500">Edit background</div>
                </button>
              </div>
            </div>

            {/* Tools Section */}
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-3 uppercase tracking-wider">
                Tools
              </h4>
              <div className="space-y-2">
                {tools
                  .filter(tool => tool.category === 'elements')
                  .map(tool => {
                    const Icon = tool.icon;
                    const isActive = currentTool.type === tool.id;

                    return (
                      <button
                        key={tool.id}
                        onClick={() => handleToolSelect(tool.id)}
                        className={`w-full flex items-center p-3 rounded-lg border transition-colors ${
                          isActive
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <Icon
                          className={`h-5 w-5 mr-3 ${isActive ? 'text-indigo-600' : 'text-gray-500'}`}
                        />
                        <div className="text-left">
                          <div
                            className={`text-sm font-medium ${isActive ? 'text-indigo-900' : 'text-gray-900'}`}
                          >
                            {tool.name}
                          </div>
                          <div
                            className={`text-xs ${isActive ? 'text-indigo-600' : 'text-gray-500'}`}
                          >
                            {tool.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Text Presets */}
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-3 uppercase tracking-wider">
                Text Presets
              </h4>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    if (selection.selectedPageId) {
                      addElement(selection.selectedPageId, {
                        page_id: selection.selectedPageId,
                        element_type: 'text',
                        content: 'Chapter Title',
                        position: { x: 100, y: 100, width: 300, height: 60 },
                        position_x: 100,
                        position_y: 100,
                        width: 300,
                        height: 60,
                        z_index: 1,
                        is_locked: false,
                        is_visible: true,
                        element_data: {
                          text: 'Chapter Title',
                          content: 'Chapter Title',
                          type: 'text',
                        },
                        properties: {
                          fontSize: 32,
                          color: '#1f2937',
                          fontFamily: 'Inter',
                          fontWeight: 'bold',
                          textAlign: 'center',
                        },
                        styles: {
                          fontSize: 32,
                          color: '#1f2937',
                          fontFamily: 'Inter',
                          fontWeight: 'bold',
                          textAlign: 'center',
                        },
                      });
                    }
                  }}
                  className="w-full p-3 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="text-sm font-medium text-gray-900">Heading</div>
                  <div className="text-xs text-gray-500">Large title text</div>
                </button>

                <button
                  onClick={() => {
                    if (selection.selectedPageId) {
                      addElement(selection.selectedPageId, {
                        page_id: selection.selectedPageId,
                        element_type: 'text',
                        content:
                          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
                        position: { x: 100, y: 200, width: 400, height: 80 },
                        position_x: 100,
                        position_y: 200,
                        width: 400,
                        height: 80,
                        z_index: 1,
                        is_locked: false,
                        is_visible: true,
                        element_data: {
                          text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
                          content:
                            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
                          type: 'text',
                        },
                        properties: {
                          fontSize: 14,
                          color: '#374151',
                          fontFamily: 'Inter',
                          fontWeight: 'normal',
                          textAlign: 'left',
                        },
                        styles: {
                          fontSize: 14,
                          color: '#374151',
                          fontFamily: 'Inter',
                          fontWeight: 'normal',
                          textAlign: 'left',
                        },
                      });
                    }
                  }}
                  className="w-full p-3 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="text-sm font-medium text-gray-900">Paragraph</div>
                  <div className="text-xs text-gray-500">Body text</div>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeCategory === 'templates' && (
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-3 uppercase tracking-wider">
                Page Templates
              </h4>
              <div className="text-center py-8 text-gray-500">
                <Square3Stack3DIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">Templates coming soon</p>
              </div>
            </div>
          </div>
        )}

        {activeCategory === 'ai' && (
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-3 uppercase tracking-wider">
                AI Assistant
              </h4>
              <div className="text-center py-8 text-gray-500">
                <SparklesIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">AI features coming soon</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">Select a page to add elements</div>
      </div>
    </div>
  );
}
