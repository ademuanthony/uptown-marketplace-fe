'use client';

import { useState } from 'react';
import { XMarkIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import { useEbookStore } from '@/stores/ebookStore';

interface PropertiesPanelProps {
  onClose: () => void;
}

export default function PropertiesPanel({ onClose }: PropertiesPanelProps) {
  const { selection, elements, pages, updateElement, updatePage } = useEbookStore();
  const [activeTab, setActiveTab] = useState<'element' | 'page'>('element');

  const currentPage = pages.find(p => p.id === selection.selectedPageId);
  const selectedElements = selection.selectedElements
    .map(elementId => {
      for (const pageId in elements) {
        const element = elements[pageId]?.find(el => el.id === elementId);
        if (element) return element;
      }
      return null;
    })
    .filter(Boolean);

  const selectedElement = selectedElements.length === 1 ? selectedElements[0] : null;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center">
            <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
            Properties
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-3 flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('element')}
            className={`flex-1 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'element'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Element
          </button>
          <button
            onClick={() => setActiveTab('page')}
            className={`flex-1 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'page'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Page
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'element' && (
          <div className="space-y-6">
            {selection.selectedElements.length === 0 && (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-2">⚪</div>
                <p className="text-sm text-gray-500">No element selected</p>
                <p className="text-xs text-gray-400 mt-1">
                  Click on an element to edit its properties
                </p>
              </div>
            )}

            {selection.selectedElements.length > 1 && (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-2">⚪⚪</div>
                <p className="text-sm text-gray-500">
                  {selection.selectedElements.length} elements selected
                </p>
                <p className="text-xs text-gray-400 mt-1">Multi-element editing coming soon</p>
              </div>
            )}

            {selectedElement && (
              <>
                {/* Element Type */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Element Type
                  </label>
                  <div className="px-3 py-2 bg-gray-50 rounded text-sm text-gray-600 capitalize">
                    {selectedElement.element_type}
                  </div>
                </div>

                {/* Position & Size */}
                <div>
                  <h4 className="text-xs font-medium text-gray-700 mb-3">Position & Size</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">X</label>
                      <input
                        type="number"
                        value={selectedElement.position_x || 0}
                        onChange={e =>
                          updateElement(selectedElement.id, {
                            position_x: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Y</label>
                      <input
                        type="number"
                        value={selectedElement.position_y || 0}
                        onChange={e =>
                          updateElement(selectedElement.id, {
                            position_y: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Width</label>
                      <input
                        type="number"
                        value={selectedElement.width || 100}
                        onChange={e =>
                          updateElement(selectedElement.id, {
                            width: parseInt(e.target.value) || 1,
                          })
                        }
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Height</label>
                      <input
                        type="number"
                        value={selectedElement.height || 100}
                        onChange={e =>
                          updateElement(selectedElement.id, {
                            height: parseInt(e.target.value) || 1,
                          })
                        }
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Text Properties */}
                {selectedElement.element_type === 'text' && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-700 mb-3">Text Properties</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Content</label>
                        <textarea
                          value={selectedElement.content || ''}
                          onChange={e =>
                            updateElement(selectedElement.id, { content: e.target.value })
                          }
                          rows={3}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Font Size</label>
                        <input
                          type="number"
                          value={(selectedElement.properties?.fontSize as number) || 16}
                          onChange={e =>
                            updateElement(selectedElement.id, {
                              properties: {
                                ...selectedElement.properties,
                                fontSize: parseInt(e.target.value) || 16,
                              },
                            })
                          }
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Color</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            value={(selectedElement.properties?.color as string) || '#000000'}
                            onChange={e =>
                              updateElement(selectedElement.id, {
                                properties: {
                                  ...selectedElement.properties,
                                  color: e.target.value,
                                },
                              })
                            }
                            className="w-8 h-6 rounded border border-gray-300 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={(selectedElement.properties?.color as string) || '#000000'}
                            onChange={e =>
                              updateElement(selectedElement.id, {
                                properties: {
                                  ...selectedElement.properties,
                                  color: e.target.value,
                                },
                              })
                            }
                            className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Image Properties */}
                {selectedElement.element_type === 'image' && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-700 mb-3">Image Properties</h4>
                    <div className="space-y-3">
                      {selectedElement.asset_url && (
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Preview</label>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={selectedElement.asset_url}
                            alt="Preview"
                            className="w-full h-24 object-cover rounded border border-gray-300"
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Asset URL</label>
                        <input
                          type="text"
                          value={selectedElement.asset_url || ''}
                          onChange={e =>
                            updateElement(selectedElement.id, { asset_url: e.target.value })
                          }
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          placeholder="Enter image URL..."
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Shape Properties */}
                {selectedElement.element_type === 'shape' && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-700 mb-3">Shape Properties</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Fill Color</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            value={(selectedElement.properties?.fillColor as string) || '#e5e7eb'}
                            onChange={e =>
                              updateElement(selectedElement.id, {
                                properties: {
                                  ...selectedElement.properties,
                                  fillColor: e.target.value,
                                },
                              })
                            }
                            className="w-8 h-6 rounded border border-gray-300 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={(selectedElement.properties?.fillColor as string) || '#e5e7eb'}
                            onChange={e =>
                              updateElement(selectedElement.id, {
                                properties: {
                                  ...selectedElement.properties,
                                  fillColor: e.target.value,
                                },
                              })
                            }
                            className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Border Radius</label>
                        <input
                          type="number"
                          value={(selectedElement.properties?.borderRadius as number) || 0}
                          onChange={e =>
                            updateElement(selectedElement.id, {
                              properties: {
                                ...selectedElement.properties,
                                borderRadius: parseInt(e.target.value) || 0,
                              },
                            })
                          }
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Layer */}
                <div>
                  <h4 className="text-xs font-medium text-gray-700 mb-3">Layer</h4>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Z-Index</label>
                    <input
                      type="number"
                      value={selectedElement.z_index || 1}
                      onChange={e =>
                        updateElement(selectedElement.id, {
                          z_index: parseInt(e.target.value) || 1,
                        })
                      }
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'page' && (
          <div className="space-y-6">
            {!currentPage && (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-2">📄</div>
                <p className="text-sm text-gray-500">No page selected</p>
              </div>
            )}

            {currentPage && (
              <>
                {/* Page Info */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Page Title</label>
                  <input
                    type="text"
                    value={currentPage.title || ''}
                    onChange={e => updatePage(currentPage.id, { title: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Background */}
                <div>
                  <h4 className="text-xs font-medium text-gray-700 mb-3">Background</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Background Color</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={currentPage.background_color || '#ffffff'}
                          onChange={e =>
                            updatePage(currentPage.id, { background_color: e.target.value })
                          }
                          className="w-8 h-6 rounded border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={currentPage.background_color || '#ffffff'}
                          onChange={e =>
                            updatePage(currentPage.id, { background_color: e.target.value })
                          }
                          className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    {currentPage.background_image && (
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Background Image</label>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={currentPage.background_image}
                          alt="Background"
                          className="w-full h-24 object-cover rounded border border-gray-300"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Page Settings */}
                <div>
                  <h4 className="text-xs font-medium text-gray-700 mb-3">Settings</h4>
                  <div className="text-xs text-gray-500">Page settings editor coming soon...</div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          Properties panel ready for live editing
        </div>
      </div>
    </div>
  );
}
