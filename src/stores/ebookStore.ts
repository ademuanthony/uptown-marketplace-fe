import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Ebook, EbookPage, EbookElement, EbookExport } from '@/services/ebook';

// Editor state interfaces
export interface EditorView {
  zoom: number;
  pan: { x: number; y: number };
  canvasSize: { width: number; height: number };
  showGrid: boolean;
  showGuides: boolean;
  snapToGrid: boolean;
}

export interface SelectionState {
  selectedElements: string[];
  selectedPageId: string | null;
  clipboard: EbookElement[];
  isMultiSelect: boolean;
}

export interface HistoryState {
  undoStack: EditorSnapshot[];
  redoStack: EditorSnapshot[];
  maxHistorySize: number;
}

export interface EditorSnapshot {
  timestamp: number;
  pages: EbookPage[];
  elements: Record<string, EbookElement[]>; // pageId -> elements
  description: string;
}

export interface Tool {
  type: 'select' | 'text' | 'image' | 'shape' | 'background' | 'draw';
  subType?: string;
  options: Record<string, unknown>;
}

export interface EbookEditorState {
  // Core data
  currentEbook: Ebook | null;
  pages: EbookPage[];
  elements: Record<string, EbookElement[]>; // pageId -> elements

  // Editor state
  view: EditorView;
  selection: SelectionState;
  history: HistoryState;
  currentTool: Tool;

  // UI state
  isLoading: boolean;
  error: string | null;
  isDirty: boolean;
  lastSaved: Date | null;
  autoSaveEnabled: boolean;

  // Export state
  currentExport: EbookExport | null;
  exportHistory: EbookExport[];

  // Actions
  loadEbook: (ebook: Ebook, pages: EbookPage[]) => void;
  setCurrentPage: (pageId: string) => void;
  addPage: (page: Omit<EbookPage, 'id' | 'created_at' | 'updated_at'>) => void;
  updatePage: (pageId: string, updates: Partial<EbookPage>) => void;
  deletePage: (pageId: string) => void;
  reorderPages: (pageIds: string[]) => void;

  // Element actions
  addElement: (
    pageId: string,
    element: Omit<EbookElement, 'id' | 'created_at' | 'updated_at'>,
  ) => void;
  updateElement: (elementId: string, updates: Partial<EbookElement>) => void;
  deleteElement: (elementId: string) => void;
  duplicateElement: (elementId: string) => void;

  // Selection actions
  selectElement: (elementId: string, isMultiSelect?: boolean) => void;
  selectElements: (elementIds: string[]) => void;
  clearSelection: () => void;
  selectAll: (pageId: string) => void;

  // Clipboard actions
  copySelection: () => void;
  cutSelection: () => void;
  paste: (pageId: string, position?: { x: number; y: number }) => void;

  // View actions
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  resetView: () => void;
  toggleGrid: () => void;
  toggleGuides: () => void;
  toggleSnapToGrid: () => void;

  // Tool actions
  setTool: (tool: Tool) => void;

  // History actions
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;
  saveSnapshot: (description: string) => void;

  // Save actions
  markDirty: () => void;
  markClean: () => void;
  setLastSaved: (date: Date) => void;

  // Export actions
  setCurrentExport: (exportData: EbookExport | null) => void;
  addExportToHistory: (exportData: EbookExport) => void;

  // Error handling
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;

  // Reset
  reset: () => void;
}

const initialView: EditorView = {
  zoom: 1,
  pan: { x: 0, y: 0 },
  canvasSize: { width: 800, height: 1200 }, // A4-like ratio
  showGrid: true,
  showGuides: true,
  snapToGrid: true,
};

const initialSelection: SelectionState = {
  selectedElements: [],
  selectedPageId: null,
  clipboard: [],
  isMultiSelect: false,
};

const initialHistory: HistoryState = {
  undoStack: [],
  redoStack: [],
  maxHistorySize: 50,
};

const initialTool: Tool = {
  type: 'select',
  options: {},
};

export const useEbookStore = create<EbookEditorState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    currentEbook: null,
    pages: [],
    elements: {},
    view: initialView,
    selection: initialSelection,
    history: initialHistory,
    currentTool: initialTool,
    isLoading: false,
    error: null,
    isDirty: false,
    lastSaved: null,
    autoSaveEnabled: true,
    currentExport: null,
    exportHistory: [],

    // Load ebook data
    loadEbook: (ebook, pages) => {
      set({
        currentEbook: ebook,
        pages,
        elements: {},
        isDirty: false,
        error: null,
        selection: initialSelection,
        history: initialHistory,
      });
    },

    // Page actions
    setCurrentPage: pageId => {
      set(state => ({
        selection: {
          ...state.selection,
          selectedPageId: pageId,
          selectedElements: [],
        },
      }));
    },

    addPage: pageData => {
      const newPage: EbookPage = {
        ...pageData,
        id: `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      set(state => {
        const newPages = [...state.pages, newPage];
        return {
          pages: newPages,
          elements: { ...state.elements, [newPage.id]: [] },
          isDirty: true,
        };
      });

      get().saveSnapshot(`Added page: ${pageData.title || 'Untitled'}`);
    },

    updatePage: (pageId, updates) => {
      set(state => ({
        pages: state.pages.map(page =>
          page.id === pageId ? { ...page, ...updates, updated_at: new Date().toISOString() } : page,
        ),
        isDirty: true,
      }));

      get().saveSnapshot(`Updated page`);
    },

    deletePage: pageId => {
      set(state => {
        const newElements = { ...state.elements };
        delete newElements[pageId];

        return {
          pages: state.pages.filter(page => page.id !== pageId),
          elements: newElements,
          selection: {
            ...state.selection,
            selectedPageId:
              state.selection.selectedPageId === pageId ? null : state.selection.selectedPageId,
            selectedElements: [],
          },
          isDirty: true,
        };
      });

      get().saveSnapshot(`Deleted page`);
    },

    reorderPages: pageIds => {
      set(state => {
        const reorderedPages = pageIds
          .map(id => state.pages.find(page => page.id === id))
          .filter(Boolean)
          .map((page, index) => ({ ...page!, page_order: index + 1 }));

        return {
          pages: reorderedPages,
          isDirty: true,
        };
      });

      get().saveSnapshot(`Reordered pages`);
    },

    // Element actions
    addElement: (pageId, elementData) => {
      const newElement: EbookElement = {
        ...elementData,
        id: `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        page_id: pageId,
        // Set default values for new structure
        is_locked: elementData.is_locked || false,
        is_visible: elementData.is_visible !== undefined ? elementData.is_visible : true,
        z_index: elementData.z_index || 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      set(state => ({
        elements: {
          ...state.elements,
          [pageId]: [...(state.elements[pageId] || []), newElement],
        },
        isDirty: true,
      }));

      get().saveSnapshot(`Added ${elementData.element_type} element`);
    },

    updateElement: (elementId, updates) => {
      set(state => {
        const newElements = { ...state.elements };

        for (const pageId in newElements) {
          const pageElements = newElements[pageId];
          if (!pageElements) continue;
          const elementIndex = pageElements.findIndex(el => el.id === elementId);

          if (elementIndex !== -1) {
            newElements[pageId] = [
              ...pageElements.slice(0, elementIndex),
              {
                ...pageElements[elementIndex],
                ...updates,
                updated_at: new Date().toISOString(),
              } as EbookElement,
              ...pageElements.slice(elementIndex + 1),
            ];
            break;
          }
        }

        return {
          elements: newElements,
          isDirty: true,
        };
      });
    },

    deleteElement: elementId => {
      set(state => {
        const newElements = { ...state.elements };

        for (const pageId in newElements) {
          if (newElements[pageId]) {
            newElements[pageId] = newElements[pageId].filter(el => el.id !== elementId);
          }
        }

        return {
          elements: newElements,
          selection: {
            ...state.selection,
            selectedElements: state.selection.selectedElements.filter(id => id !== elementId),
          },
          isDirty: true,
        };
      });

      get().saveSnapshot(`Deleted element`);
    },

    duplicateElement: elementId => {
      const state = get();

      for (const pageId in state.elements) {
        const pageElements = state.elements[pageId];
        if (!pageElements) continue;
        const element = pageElements.find(el => el.id === elementId);
        if (element) {
          const duplicatedElement = {
            ...element,
            position_x: (element.position_x || 0) + 20,
            position_y: (element.position_y || 0) + 20,
          };

          state.addElement(pageId, duplicatedElement);
          break;
        }
      }
    },

    // Selection actions
    selectElement: (elementId, isMultiSelect = false) => {
      set(state => {
        let selectedElements: string[];

        if (isMultiSelect) {
          selectedElements = state.selection.selectedElements.includes(elementId)
            ? state.selection.selectedElements.filter(id => id !== elementId)
            : [...state.selection.selectedElements, elementId];
        } else {
          selectedElements = [elementId];
        }

        return {
          selection: {
            ...state.selection,
            selectedElements,
            isMultiSelect,
          },
        };
      });
    },

    selectElements: elementIds => {
      set(state => ({
        selection: {
          ...state.selection,
          selectedElements: elementIds,
          isMultiSelect: elementIds.length > 1,
        },
      }));
    },

    clearSelection: () => {
      set(state => ({
        selection: {
          ...state.selection,
          selectedElements: [],
          isMultiSelect: false,
        },
      }));
    },

    selectAll: pageId => {
      const state = get();
      const pageElements = state.elements[pageId] || [];

      set(state => ({
        selection: {
          ...state.selection,
          selectedElements: pageElements.map(el => el.id),
          isMultiSelect: pageElements.length > 1,
        },
      }));
    },

    // Clipboard actions
    copySelection: () => {
      const state = get();
      const selectedElements = state.selection.selectedElements;
      const clipboard: EbookElement[] = [];

      for (const pageId in state.elements) {
        const pageElements = state.elements[pageId];
        if (!pageElements) continue;
        for (const element of pageElements) {
          if (selectedElements.includes(element.id)) {
            clipboard.push(element);
          }
        }
      }

      set(state => ({
        selection: {
          ...state.selection,
          clipboard,
        },
      }));
    },

    cutSelection: () => {
      const state = get();
      state.copySelection();

      // Delete selected elements
      state.selection.selectedElements.forEach(elementId => {
        state.deleteElement(elementId);
      });
    },

    paste: (pageId, position) => {
      const state = get();
      const clipboard = state.selection.clipboard;

      if (clipboard.length === 0) return;

      const offset = position || { x: 20, y: 20 };

      clipboard.forEach(element => {
        const pastedElement = {
          ...element,
          position_x: (element.position_x || 0) + offset.x,
          position_y: (element.position_y || 0) + offset.y,
        };

        state.addElement(pageId, pastedElement);
      });

      get().saveSnapshot(`Pasted ${clipboard.length} element(s)`);
    },

    // View actions
    setZoom: zoom => {
      set(state => ({
        view: { ...state.view, zoom: Math.max(0.1, Math.min(5, zoom)) },
      }));
    },

    setPan: pan => {
      set(state => ({
        view: { ...state.view, pan },
      }));
    },

    resetView: () => {
      set(state => ({
        view: { ...state.view, zoom: 1, pan: { x: 0, y: 0 } },
      }));
    },

    toggleGrid: () => {
      set(state => ({
        view: { ...state.view, showGrid: !state.view.showGrid },
      }));
    },

    toggleGuides: () => {
      set(state => ({
        view: { ...state.view, showGuides: !state.view.showGuides },
      }));
    },

    toggleSnapToGrid: () => {
      set(state => ({
        view: { ...state.view, snapToGrid: !state.view.snapToGrid },
      }));
    },

    // Tool actions
    setTool: tool => {
      set({ currentTool: tool });
    },

    // History actions
    undo: () => {
      const state = get();
      const snapshot = state.history.undoStack[state.history.undoStack.length - 1];

      if (!snapshot) return;

      // Save current state to redo stack
      const currentSnapshot: EditorSnapshot = {
        timestamp: Date.now(),
        pages: state.pages,
        elements: state.elements,
        description: 'Redo point',
      };

      set(state => ({
        pages: snapshot.pages,
        elements: snapshot.elements,
        history: {
          ...state.history,
          undoStack: state.history.undoStack.slice(0, -1),
          redoStack: [...state.history.redoStack, currentSnapshot],
        },
        isDirty: true,
      }));
    },

    redo: () => {
      const state = get();
      const snapshot = state.history.redoStack[state.history.redoStack.length - 1];

      if (!snapshot) return;

      // Save current state to undo stack
      const currentSnapshot: EditorSnapshot = {
        timestamp: Date.now(),
        pages: state.pages,
        elements: state.elements,
        description: 'Undo point',
      };

      set(state => ({
        pages: snapshot.pages,
        elements: snapshot.elements,
        history: {
          ...state.history,
          undoStack: [...state.history.undoStack, currentSnapshot],
          redoStack: state.history.redoStack.slice(0, -1),
        },
        isDirty: true,
      }));
    },

    clearHistory: () => {
      set(state => ({
        history: {
          ...state.history,
          undoStack: [],
          redoStack: [],
        },
      }));
    },

    saveSnapshot: description => {
      const state = get();

      const snapshot: EditorSnapshot = {
        timestamp: Date.now(),
        pages: state.pages,
        elements: state.elements,
        description,
      };

      set(state => {
        const newUndoStack = [...state.history.undoStack, snapshot];

        // Limit history size
        if (newUndoStack.length > state.history.maxHistorySize) {
          newUndoStack.shift();
        }

        return {
          history: {
            ...state.history,
            undoStack: newUndoStack,
            redoStack: [], // Clear redo stack when new action is performed
          },
        };
      });
    },

    // Save actions
    markDirty: () => set({ isDirty: true }),
    markClean: () => set({ isDirty: false }),
    setLastSaved: date => set({ lastSaved: date }),

    // Export actions
    setCurrentExport: exportData => set({ currentExport: exportData }),

    addExportToHistory: exportData => {
      set(state => ({
        exportHistory: [exportData, ...state.exportHistory.slice(0, 9)], // Keep last 10 exports
      }));
    },

    // Error handling
    setError: error => set({ error }),
    setLoading: loading => set({ isLoading: loading }),

    // Reset
    reset: () => {
      set({
        currentEbook: null,
        pages: [],
        elements: {},
        view: initialView,
        selection: initialSelection,
        history: initialHistory,
        currentTool: initialTool,
        isLoading: false,
        error: null,
        isDirty: false,
        lastSaved: null,
        currentExport: null,
        exportHistory: [],
      });
    },
  })),
);

// Auto-save hook - implementation coming in next phase
// export const useAutoSave = () => {
//   // Auto-save logic would go here
// };
