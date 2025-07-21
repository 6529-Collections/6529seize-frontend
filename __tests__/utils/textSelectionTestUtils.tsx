/**
 * Shared utilities for text selection tests to reduce code duplication
 */
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { editSlice } from '../../store/editSlice';

// Browser mock types
export type BrowserType = 'chrome' | 'firefox' | 'safari' | 'edge' | 'legacy';

export interface MockBrowserAPIs {
  caretPositionFromPoint: jest.Mock;
  caretRangeFromPoint: jest.Mock;
  createRange: jest.Mock;
  createTreeWalker: jest.Mock;
  elementFromPoint: jest.Mock;
  getSelection: jest.Mock;
  getComputedStyle: jest.Mock;
}

/**
 * Creates a Redux store for testing
 */
export const createTestStore = () => configureStore({
  reducer: {
    edit: editSlice.reducer,
  },
});

/**
 * Creates a Redux wrapper for renderHook
 */
export const createReduxWrapper = () => {
  const store = createTestStore();
  return ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
      {children}
    </Provider>
  );
};

/**
 * Creates browser-specific API mocks for different browser scenarios
 */
export const createBrowserMock = (browserType: BrowserType): MockBrowserAPIs => {
  const mocks: MockBrowserAPIs = {
    caretPositionFromPoint: jest.fn(),
    caretRangeFromPoint: jest.fn(),
    createRange: jest.fn(),
    createTreeWalker: jest.fn(),
    elementFromPoint: jest.fn(),
    getSelection: jest.fn(),
    getComputedStyle: jest.fn()
  };

  // Configure browser-specific APIs
  if (browserType === 'firefox') {
    // Firefox supports caretPositionFromPoint
    Object.defineProperty(document, 'caretPositionFromPoint', {
      value: mocks.caretPositionFromPoint,
      configurable: true
    });
    delete (document as any).caretRangeFromPoint;
  } else if (browserType === 'legacy') {
    // Legacy browser with no caret APIs
    delete (document as any).caretPositionFromPoint;
    delete (document as any).caretRangeFromPoint;
  } else {
    // Chrome, Safari, Edge all support caretRangeFromPoint
    Object.defineProperty(document, 'caretRangeFromPoint', {
      value: mocks.caretRangeFromPoint,
      configurable: true
    });
    delete (document as any).caretPositionFromPoint;
  }

  // Common APIs available in all browsers
  Object.defineProperty(document, 'createRange', {
    value: mocks.createRange,
    configurable: true
  });

  Object.defineProperty(document, 'createTreeWalker', {
    value: mocks.createTreeWalker,
    configurable: true
  });

  Object.defineProperty(document, 'elementFromPoint', {
    value: mocks.elementFromPoint,
    configurable: true
  });

  Object.defineProperty(window, 'getSelection', {
    value: mocks.getSelection,
    configurable: true
  });

  Object.defineProperty(window, 'getComputedStyle', {
    value: mocks.getComputedStyle,
    configurable: true
  });

  return mocks;
};

/**
 * Sets up common DOM mocks for text selection tests
 */
export const setupTextSelectionTestMocks = () => {
  // Mock RAF for all tests
  global.requestAnimationFrame = jest.fn((cb) => {
    cb(0);
    return 0;
  });
  global.cancelAnimationFrame = jest.fn();

  // Mock common DOM APIs
  Object.defineProperty(document, 'createRange', {
    value: jest.fn(),
    configurable: true
  });

  Object.defineProperty(document, 'createTreeWalker', {
    value: jest.fn(),
    configurable: true
  });

  Object.defineProperty(document, 'elementFromPoint', {
    value: jest.fn(),
    configurable: true
  });

  Object.defineProperty(window, 'getSelection', {
    value: jest.fn(() => ({
      removeAllRanges: jest.fn(),
      addRange: jest.fn(),
      rangeCount: 0,
      empty: jest.fn()
    })),
    configurable: true
  });

  Object.defineProperty(window, 'getComputedStyle', {
    value: jest.fn(() => ({ overflow: 'visible', overflowY: 'visible' })),
    configurable: true
  });
};

/**
 * Creates a MouseEvent with proper target property for testing
 */
export const createMouseEventWithTarget = (
  type: string = 'mousedown',
  options: MouseEventInit = {},
  targetElement?: HTMLElement
): MouseEvent => {
  const mouseEvent = new MouseEvent(type, {
    button: 0,
    clientX: 100,
    clientY: 100,
    ...options
  });

  const target = targetElement || document.createElement('div');
  if (!target.closest) {
    target.closest = jest.fn().mockReturnValue(null);
  }

  Object.defineProperty(mouseEvent, 'target', {
    value: target,
    configurable: true
  });

  return mouseEvent;
};

/**
 * Creates a test container with sample drop content
 */
export const createTestContainer = (dropId: string = 'drop1'): HTMLElement => {
  const container = document.createElement('div');
  container.innerHTML = `
    <div class="tw-group" data-drop-id="${dropId}">
      <p>Sample text content for testing</p>
    </div>
  `;
  document.body.appendChild(container);
  return container;
};

/**
 * Cleans up test container from DOM
 */
export const cleanupTestContainer = (container: HTMLElement): void => {
  if (container && document.body.contains(container)) {
    document.body.removeChild(container);
  }
};

/**
 * Creates mock range object for testing
 */
export const createMockRange = (overrides: Partial<Range> = {}): Partial<Range> => {
  return {
    selectNodeContents: jest.fn(),
    getBoundingClientRect: jest.fn(() => ({
      left: 0,
      right: 100,
      top: 0,
      bottom: 20,
      width: 100,
      height: 20
    })),
    collapsed: false,
    toString: jest.fn(() => 'sample text'),
    ...overrides
  };
};

/**
 * Creates mock TreeWalker for testing
 */
export const createMockTreeWalker = (textNode?: Text): Partial<TreeWalker> => {
  const mockTextNode = textNode || document.createTextNode('sample text');
  return {
    nextNode: jest.fn()
      .mockReturnValueOnce(mockTextNode)
      .mockReturnValue(null)
  };
};

/**
 * Common test cleanup function
 */
export const cleanupTextSelectionMocks = (): void => {
  jest.clearAllMocks();
};

/**
 * Creates a state object with selection for testing
 */
export const createMockSelectionState = (text: string = 'selected text') => ({
  isSelecting: false,
  selection: {
    startX: 100,
    startY: 100,
    endX: 200,
    endY: 120,
    text
  },
  highlightSpans: []
});

/**
 * Creates a selecting state object for testing
 */
export const createMockSelectingState = () => ({
  isSelecting: true,
  selection: null,
  highlightSpans: []
});

/**
 * Sets up DOM event mocks for overlay components
 */
export const setupOverlayEventMocks = (): void => {
  // Mock event listener methods
  Element.prototype.addEventListener = jest.fn();
  Element.prototype.removeEventListener = jest.fn();
  Document.prototype.addEventListener = jest.fn();
  Document.prototype.removeEventListener = jest.fn();
  
  // Mock preventDefault and stopPropagation
  Event.prototype.preventDefault = jest.fn();
  Event.prototype.stopPropagation = jest.fn();
};

/**
 * Creates a mock keyboard event with preventDefault
 */
export const createMockKeyboardEvent = (
  key: string,
  options: { ctrlKey?: boolean; metaKey?: boolean } = {}
): KeyboardEvent => {
  const event = new KeyboardEvent('keydown', {
    key,
    ...options
  });
  event.preventDefault = jest.fn();
  return event;
};

/**
 * Creates a mock mouse event with preventDefault and stopPropagation
 */
export const createMockMouseEvent = (
  type: string = 'mousedown',
  button: number = 0
): MouseEvent => {
  const event = new MouseEvent(type, { button });
  event.preventDefault = jest.fn();
  event.stopPropagation = jest.fn();
  return event;
};

/**
 * Test helper to reduce nesting in browser compatibility tests
 */
export const testBrowserScenario = (
  scenario: { name: string; setup: () => void },
  containerRef: { current: HTMLElement | null },
  useTextSelection: any
) => {
  scenario.setup();
  
  const { result } = renderHook(() => useTextSelection(containerRef));
  
  const mouseEvent = createMouseEventWithTarget('mousedown', {
    button: 0,
    clientX: 100,
    clientY: 100
  });
  
  expect(() => {
    act(() => {
      result.current.handlers.handleMouseDown(mouseEvent);
    });
  }).not.toThrow();
  
  expect(result.current.state.isSelecting).toBe(true);
};

/**
 * Test helper for getSelection implementations
 */
export const testGetSelectionImplementation = (
  getSelectionImpl: () => any,
  useTextSelection: any,
  containerRef: { current: HTMLElement | null }
) => {
  (window.getSelection as jest.Mock).mockImplementation(getSelectionImpl);
  
  const { result } = renderHook(() => useTextSelection(containerRef));
  
  expect(() => {
    act(() => {
      result.current.handlers.clearSelection();
    });
  }).not.toThrow();
};

/**
 * Helper to test mouse event handling without deep nesting
 */
export const testMouseEventHandling = (
  useTextSelection: any,
  containerRef: { current: HTMLElement | null },
  eventOptions: { button?: number; clientX?: number; clientY?: number } = {}
) => {
  const { result } = renderHook(() => useTextSelection(containerRef), {
    wrapper: createReduxWrapper()
  });
  
  const mouseEvent = createMouseEventWithTarget('mousedown', {
    button: 0,
    clientX: 100,
    clientY: 100,
    ...eventOptions
  });

  expect(() => {
    act(() => {
      result.current.handlers.handleMouseDown(mouseEvent);
    });
  }).not.toThrow();
  
  return result;
};

/**
 * Helper to test browser API scenarios
 */
export const testBrowserAPI = (
  apiSetup: () => void,
  useTextSelection: any,
  containerRef: { current: HTMLElement | null }
) => {
  apiSetup();
  
  const { result } = renderHook(() => useTextSelection(containerRef), {
    wrapper: createReduxWrapper()
  });
  
  const mouseEvent = createMouseEventWithTarget('mousedown', {
    button: 0,
    clientX: 100,
    clientY: 100
  });

  expect(() => {
    act(() => {
      result.current.handlers.handleMouseDown(mouseEvent);
    });
  }).not.toThrow();
  
  return result;
};

/**
 * Helper to test performance scenarios
 */
export const testPerformanceScenario = (
  setup: () => void,
  useTextSelection: any,
  containerRef: { current: HTMLElement | null },
  assertions?: (result: any) => void
) => {
  setup();
  
  const { result } = renderHook(() => useTextSelection(containerRef), {
    wrapper: createReduxWrapper()
  });
  
  const mouseEvent = createMouseEventWithTarget('mousedown', {
    button: 0,
    clientX: 100,
    clientY: 100
  });

  act(() => {
    result.current.handlers.handleMouseDown(mouseEvent);
  });

  if (assertions) {
    assertions(result);
  }
  
  return result;
};