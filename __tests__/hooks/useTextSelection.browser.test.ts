import { renderHook, act } from '@testing-library/react';
import { useTextSelection } from '../../hooks/useTextSelection';

// Mock browser-specific APIs for different browser scenarios
const createBrowserMock = (browserType: 'chrome' | 'firefox' | 'safari' | 'edge' | 'legacy') => {
  const mocks = {
    caretPositionFromPoint: jest.fn(),
    caretRangeFromPoint: jest.fn(),
    createRange: jest.fn(),
    createTreeWalker: jest.fn(),
    elementFromPoint: jest.fn(),
    getSelection: jest.fn(),
    getComputedStyle: jest.fn()
  };

  switch (browserType) {
    case 'chrome':
      // Chrome supports caretRangeFromPoint
      Object.defineProperty(document, 'caretRangeFromPoint', {
        value: mocks.caretRangeFromPoint,
        configurable: true
      });
      delete (document as any).caretPositionFromPoint;
      break;

    case 'firefox':
      // Firefox supports caretPositionFromPoint
      Object.defineProperty(document, 'caretPositionFromPoint', {
        value: mocks.caretPositionFromPoint,
        configurable: true
      });
      delete (document as any).caretRangeFromPoint;
      break;

    case 'safari':
      // Safari supports caretRangeFromPoint
      Object.defineProperty(document, 'caretRangeFromPoint', {
        value: mocks.caretRangeFromPoint,
        configurable: true
      });
      delete (document as any).caretPositionFromPoint;
      break;

    case 'edge':
      // Edge supports caretRangeFromPoint
      Object.defineProperty(document, 'caretRangeFromPoint', {
        value: mocks.caretRangeFromPoint,
        configurable: true
      });
      delete (document as any).caretPositionFromPoint;
      break;

    case 'legacy':
      // Legacy browser with no caret APIs
      delete (document as any).caretPositionFromPoint;
      delete (document as any).caretRangeFromPoint;
      break;
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

// Mock RAF for all tests
beforeAll(() => {
  global.requestAnimationFrame = jest.fn((cb) => {
    cb(0);
    return 0;
  });
  global.cancelAnimationFrame = jest.fn();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('useTextSelection Browser Compatibility', () => {
  let containerRef: { current: HTMLElement | null };
  let mockContainer: HTMLElement;

  beforeEach(() => {
    mockContainer = document.createElement('div');
    mockContainer.innerHTML = `
      <div class="tw-group" data-drop-id="drop1">
        <p>Sample text content for testing</p>
      </div>
    `;
    document.body.appendChild(mockContainer);
    containerRef = { current: mockContainer };
  });

  afterEach(() => {
    if (mockContainer && document.body.contains(mockContainer)) {
      document.body.removeChild(mockContainer);
    }
  });

  describe('Chrome browser compatibility', () => {
    beforeEach(() => {
      createBrowserMock('chrome');
    });

    it('should use caretRangeFromPoint in Chrome', () => {
      const mocks = createBrowserMock('chrome');
      const { result } = renderHook(() => useTextSelection(containerRef));

      // Mock successful caretRangeFromPoint response
      mocks.caretRangeFromPoint.mockReturnValue({
        startContainer: { nodeType: Node.TEXT_NODE },
        startOffset: 5
      });

      const mouseEvent = new MouseEvent('mousedown', {
        button: 0,
        clientX: 100,
        clientY: 100
      });
      
      // Add target property to the event
      Object.defineProperty(mouseEvent, 'target', {
        value: document.createElement('div'),
        configurable: true
      });

      act(() => {
        result.current.handlers.handleMouseDown(mouseEvent);
      });

      expect(result.current.state.isSelecting).toBe(true);
    });

    it('should handle caretRangeFromPoint returning null', () => {
      const mocks = createBrowserMock('chrome');
      const { result } = renderHook(() => useTextSelection(containerRef));

      mocks.caretRangeFromPoint.mockReturnValue(null);
      mocks.elementFromPoint.mockReturnValue(document.createElement('div'));

      const mouseEvent = new MouseEvent('mousedown', {
        button: 0,
        clientX: 100,
        clientY: 100
      });
      
      // Add target property to the event
      Object.defineProperty(mouseEvent, 'target', {
        value: document.createElement('div'),
        configurable: true
      });

      expect(() => {
        act(() => {
          result.current.handlers.handleMouseDown(mouseEvent);
        });
      }).not.toThrow();
    });
  });

  describe('Firefox browser compatibility', () => {
    beforeEach(() => {
      createBrowserMock('firefox');
    });

    it('should use caretPositionFromPoint in Firefox', () => {
      const mocks = createBrowserMock('firefox');
      const { result } = renderHook(() => useTextSelection(containerRef));

      mocks.caretPositionFromPoint.mockReturnValue({
        offsetNode: { nodeType: Node.TEXT_NODE },
        offset: 3
      });

      const mouseEvent = new MouseEvent('mousedown', {
        button: 0,
        clientX: 100,
        clientY: 100
      });
      
      // Add target property to the event
      const targetElement = document.createElement('div');
      targetElement.closest = jest.fn().mockReturnValue(null);
      Object.defineProperty(mouseEvent, 'target', {
        value: targetElement,
        configurable: true
      });

      act(() => {
        result.current.handlers.handleMouseDown(mouseEvent);
      });

      expect(result.current.state.isSelecting).toBe(true);
    });

    it('should handle caretPositionFromPoint returning null', () => {
      const mocks = createBrowserMock('firefox');
      const { result } = renderHook(() => useTextSelection(containerRef));

      mocks.caretPositionFromPoint.mockReturnValue(null);
      mocks.elementFromPoint.mockReturnValue(document.createElement('div'));

      const mouseEvent = new MouseEvent('mousedown', {
        button: 0,
        clientX: 100,
        clientY: 100
      });
      
      // Add target property to the event
      const targetElement = document.createElement('div');
      targetElement.closest = jest.fn().mockReturnValue(null);
      Object.defineProperty(mouseEvent, 'target', {
        value: targetElement,
        configurable: true
      });

      expect(() => {
        act(() => {
          result.current.handlers.handleMouseDown(mouseEvent);
        });
      }).not.toThrow();
    });
  });

  describe('Safari browser compatibility', () => {
    beforeEach(() => {
      createBrowserMock('safari');
    });

    it('should work with Safari-specific behaviors', () => {
      const mocks = createBrowserMock('safari');
      const { result } = renderHook(() => useTextSelection(containerRef));

      mocks.caretRangeFromPoint.mockReturnValue({
        startContainer: { nodeType: Node.TEXT_NODE },
        startOffset: 2
      });

      const mouseEvent = new MouseEvent('mousedown', {
        button: 0,
        clientX: 100,
        clientY: 100
      });
      
      // Add target property to the event
      const targetElement = document.createElement('div');
      targetElement.closest = jest.fn().mockReturnValue(null);
      Object.defineProperty(mouseEvent, 'target', {
        value: targetElement,
        configurable: true
      });

      act(() => {
        result.current.handlers.handleMouseDown(mouseEvent);
      });

      expect(result.current.state.isSelecting).toBe(true);
    });

    it('should handle Safari selection quirks', () => {
      const mocks = createBrowserMock('safari');
      const { result } = renderHook(() => useTextSelection(containerRef));

      // Safari sometimes returns different values
      mocks.caretRangeFromPoint.mockReturnValue({
        startContainer: { nodeType: Node.ELEMENT_NODE }, // Not a text node
        startOffset: 0
      });

      const mouseEvent = new MouseEvent('mousedown', {
        button: 0,
        clientX: 100,
        clientY: 100
      });
      
      // Add target property to the event
      const targetElement = document.createElement('div');
      targetElement.closest = jest.fn().mockReturnValue(null);
      Object.defineProperty(mouseEvent, 'target', {
        value: targetElement,
        configurable: true
      });

      expect(() => {
        act(() => {
          result.current.handlers.handleMouseDown(mouseEvent);
        });
      }).not.toThrow();
    });
  });

  describe('Legacy browser compatibility', () => {
    beforeEach(() => {
      createBrowserMock('legacy');
    });

    it('should work without modern caret APIs', () => {
      const mocks = createBrowserMock('legacy');
      const { result } = renderHook(() => useTextSelection(containerRef));

      // Setup fallback mocks
      const mockElement = document.createElement('div');
      const mockTextNode = document.createTextNode('sample text');
      mockElement.appendChild(mockTextNode);

      mocks.elementFromPoint.mockReturnValue(mockElement);

      const mockTreeWalker = {
        nextNode: jest.fn()
          .mockReturnValueOnce(mockTextNode)
          .mockReturnValue(null)
      };

      mocks.createTreeWalker.mockReturnValue(mockTreeWalker);

      const mockRange = {
        selectNodeContents: jest.fn(),
        getBoundingClientRect: jest.fn(() => ({
          left: 90,
          right: 110,
          top: 90,
          bottom: 110,
          width: 20,
          height: 20
        }))
      };

      mocks.createRange.mockReturnValue(mockRange);

      const mouseEvent = new MouseEvent('mousedown', {
        button: 0,
        clientX: 100,
        clientY: 100
      });
      
      // Add target property to the event
      const targetElement = document.createElement('div');
      targetElement.closest = jest.fn().mockReturnValue(null);
      Object.defineProperty(mouseEvent, 'target', {
        value: targetElement,
        configurable: true
      });

      expect(() => {
        act(() => {
          result.current.handlers.handleMouseDown(mouseEvent);
        });
      }).not.toThrow();

      expect(result.current.state.isSelecting).toBe(true);
    });

    it('should handle complete API unavailability gracefully', () => {
      const mocks = createBrowserMock('legacy');
      const { result } = renderHook(() => useTextSelection(containerRef));

      // Mock all APIs to be unavailable or throw errors
      mocks.elementFromPoint.mockReturnValue(null);
      mocks.createTreeWalker.mockImplementation(() => {
        throw new Error('TreeWalker not supported');
      });
      mocks.createRange.mockImplementation(() => {
        throw new Error('Range not supported');
      });

      const mouseEvent = new MouseEvent('mousedown', {
        button: 0,
        clientX: 100,
        clientY: 100
      });
      
      // Add target property to the event
      const targetElement = document.createElement('div');
      targetElement.closest = jest.fn().mockReturnValue(null);
      Object.defineProperty(mouseEvent, 'target', {
        value: targetElement,
        configurable: true
      });

      expect(() => {
        act(() => {
          result.current.handlers.handleMouseDown(mouseEvent);
        });
      }).not.toThrow();

      // Should still initialize but may not work fully
      expect(result.current.state.isSelecting).toBe(true);
    });
  });

  describe('Cross-browser text node detection', () => {
    it('should handle different text node types across browsers', () => {
      const mocks = createBrowserMock('chrome');
      const { result } = renderHook(() => useTextSelection(containerRef));

      // Test with different node types that browsers might return
      const testCases = [
        { nodeType: Node.TEXT_NODE, shouldWork: true },
        { nodeType: Node.ELEMENT_NODE, shouldWork: false },
        { nodeType: Node.COMMENT_NODE, shouldWork: false }
      ];

      testCases.forEach(({ nodeType, shouldWork }) => {
        mocks.caretRangeFromPoint.mockReturnValue({
          startContainer: { nodeType },
          startOffset: 0
        });

        const mouseEvent = new MouseEvent('mousedown', {
          button: 0,
          clientX: 100,
          clientY: 100
        });
        
        // Add target property to the event
        Object.defineProperty(mouseEvent, 'target', {
          value: document.createElement('div'),
          configurable: true
        });

        expect(() => {
          act(() => {
            result.current.handlers.handleMouseDown(mouseEvent);
          });
        }).not.toThrow();
      });
    });
  });

  describe('Browser-specific getSelection behavior', () => {
    it('should handle different getSelection implementations', () => {
      const { result } = renderHook(() => useTextSelection(containerRef));

      // Test different getSelection scenarios
      const testCases = [
        // Standard implementation
        {
          getSelection: () => ({
            removeAllRanges: jest.fn(),
            addRange: jest.fn(),
            rangeCount: 0,
            empty: jest.fn()
          })
        },
        // Implementation without empty method (older browsers)
        {
          getSelection: () => ({
            removeAllRanges: jest.fn(),
            addRange: jest.fn(),
            rangeCount: 0
          })
        },
        // Null getSelection (edge case)
        {
          getSelection: () => null
        }
      ];

      testCases.forEach(({ getSelection }) => {
        (window.getSelection as jest.Mock).mockImplementation(getSelection);

        expect(() => {
          act(() => {
            result.current.handlers.clearSelection();
          });
        }).not.toThrow();
      });
    });
  });

  describe('Browser-specific range behavior', () => {
    it('should handle different range implementations', () => {
      const mocks = createBrowserMock('chrome');
      const { result } = renderHook(() => useTextSelection(containerRef));

      // Test different range behaviors
      const mockRanges = [
        // Standard range
        {
          selectNodeContents: jest.fn(),
          getBoundingClientRect: jest.fn(() => ({
            left: 0, right: 100, top: 0, bottom: 20, width: 100, height: 20
          })),
          collapsed: false,
          toString: jest.fn(() => 'text')
        },
        // Range that throws on getBoundingClientRect (some edge cases)
        {
          selectNodeContents: jest.fn(),
          getBoundingClientRect: jest.fn(() => {
            throw new Error('getBoundingClientRect failed');
          }),
          collapsed: false,
          toString: jest.fn(() => 'text')
        },
        // Collapsed range
        {
          selectNodeContents: jest.fn(),
          getBoundingClientRect: jest.fn(() => ({
            left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0
          })),
          collapsed: true,
          toString: jest.fn(() => '')
        }
      ];

      mockRanges.forEach((mockRange) => {
        mocks.createRange.mockReturnValue(mockRange);

        const mouseEvent = new MouseEvent('mousedown', {
          button: 0,
          clientX: 100,
          clientY: 100
        });
        
        // Add target property to the event
        const targetElement = document.createElement('div');
        targetElement.closest = jest.fn().mockReturnValue(null);
        Object.defineProperty(mouseEvent, 'target', {
          value: targetElement,
          configurable: true
        });

        expect(() => {
          act(() => {
            result.current.handlers.handleMouseDown(mouseEvent);
          });
        }).not.toThrow();
      });
    });
  });

  describe('Browser-specific CSS getComputedStyle', () => {
    it('should handle different getComputedStyle implementations', () => {
      const mocks = createBrowserMock('chrome');
      const { result } = renderHook(() => useTextSelection(containerRef));

      // Test different getComputedStyle scenarios
      const testCases = [
        // Standard implementation
        () => ({ overflow: 'visible', overflowY: 'visible' }),
        // Implementation returning different values
        () => ({ overflow: 'hidden', overflowY: 'hidden' }),
        // Implementation that throws (very old browsers)
        () => { throw new Error('getComputedStyle not supported'); },
        // Implementation returning null (edge case)
        () => null
      ];

      testCases.forEach((getComputedStyleImpl) => {
        mocks.getComputedStyle.mockImplementation(getComputedStyleImpl);

        const mouseEvent = new MouseEvent('mousedown', {
          button: 0,
          clientX: 100,
          clientY: 100
        });
        
        // Add target property to the event
        const targetElement = document.createElement('div');
        targetElement.closest = jest.fn().mockReturnValue(null);
        Object.defineProperty(mouseEvent, 'target', {
          value: targetElement,
          configurable: true
        });

        expect(() => {
          act(() => {
            result.current.handlers.handleMouseDown(mouseEvent);
          });
        }).not.toThrow();
      });
    });
  });

  describe('Mobile browser compatibility', () => {
    it('should handle touch-based browsers', () => {
      const mocks = createBrowserMock('chrome');
      const { result } = renderHook(() => useTextSelection(containerRef));

      // Simulate touch browser behavior (limited API support)
      mocks.caretRangeFromPoint.mockReturnValue(null);
      mocks.elementFromPoint.mockReturnValue(null);

      const touchEvent = new MouseEvent('mousedown', {
        button: 0,
        clientX: 100,
        clientY: 100
      });
      
      // Add target property to the event
      const targetElement = document.createElement('div');
      targetElement.closest = jest.fn().mockReturnValue(null);
      Object.defineProperty(touchEvent, 'target', {
        value: targetElement,
        configurable: true
      });

      expect(() => {
        act(() => {
          result.current.handlers.handleMouseDown(touchEvent);
        });
      }).not.toThrow();

      expect(result.current.state.isSelecting).toBe(true);
    });

    it('should handle viewport and zoom differences', () => {
      const mocks = createBrowserMock('safari');
      const { result } = renderHook(() => useTextSelection(containerRef));

      // Simulate coordinates that might be affected by mobile viewport/zoom
      mocks.caretRangeFromPoint.mockReturnValue({
        startContainer: { nodeType: Node.TEXT_NODE },
        startOffset: 1
      });

      // Test with various coordinate scenarios
      const coordinates = [
        { x: 50, y: 50 },   // Normal coordinates
        { x: 0, y: 0 },     // Edge coordinates
        { x: -10, y: -10 }, // Negative coordinates
        { x: 1000, y: 1000 } // Large coordinates
      ];

      coordinates.forEach(({ x, y }) => {
        const mouseEvent = new MouseEvent('mousedown', {
          button: 0,
          clientX: x,
          clientY: y
        });
        
        // Add target property to the event
        const targetElement = document.createElement('div');
        targetElement.closest = jest.fn().mockReturnValue(null);
        Object.defineProperty(mouseEvent, 'target', {
          value: targetElement,
          configurable: true
        });

        expect(() => {
          act(() => {
            result.current.handlers.handleMouseDown(mouseEvent);
          });
        }).not.toThrow();
      });
    });
  });
});