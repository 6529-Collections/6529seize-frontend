import { renderHook, act } from '@testing-library/react';
import { useTextSelection } from '../../hooks/useTextSelection';
import {
  createBrowserMock,
  setupTextSelectionTestMocks,
  cleanupTextSelectionMocks,
  createMouseEventWithTarget,
  createTestContainer,
  cleanupTestContainer,
  createMockRange,
  createMockTreeWalker,
  testMouseEventHandling,
  testBrowserAPI
} from '../utils/textSelectionTestUtils';

// Setup common mocks
beforeAll(() => {
  setupTextSelectionTestMocks();
});

afterEach(() => {
  cleanupTextSelectionMocks();
});

describe('useTextSelection Browser Compatibility', () => {
  let containerRef: { current: HTMLElement | null };
  let mockContainer: HTMLElement;

  beforeEach(() => {
    mockContainer = createTestContainer('drop1');
    containerRef = { current: mockContainer };
  });

  afterEach(() => {
    cleanupTestContainer(mockContainer);
  });

  describe('Chrome browser compatibility', () => {
    beforeEach(() => {
      createBrowserMock('chrome');
    });

    it('should use caretRangeFromPoint in Chrome', () => {
      const mocks = createBrowserMock('chrome');
      
      const setupChromeCaretRange = () => {
        // Mock successful caretRangeFromPoint response
        mocks.caretRangeFromPoint.mockReturnValue({
          startContainer: { nodeType: Node.TEXT_NODE },
          startOffset: 5
        });
      };

      const result = testBrowserAPI(setupChromeCaretRange, useTextSelection, containerRef);
      expect(result.current.state.isSelecting).toBe(true);
    });

    it('should handle caretRangeFromPoint returning null', () => {
      const mocks = createBrowserMock('chrome');
      
      const setupNullCaretRange = () => {
        mocks.caretRangeFromPoint.mockReturnValue(null);
        mocks.elementFromPoint.mockReturnValue(document.createElement('div'));
      };

      testBrowserAPI(setupNullCaretRange, useTextSelection, containerRef);
    });
  });

  describe('Firefox browser compatibility', () => {
    beforeEach(() => {
      createBrowserMock('firefox');
    });

    it('should use caretPositionFromPoint in Firefox', () => {
      const mocks = createBrowserMock('firefox');
      
      const setupFirefoxCaretPosition = () => {
        mocks.caretPositionFromPoint.mockReturnValue({
          offsetNode: { nodeType: Node.TEXT_NODE },
          offset: 3
        });
      };

      const result = testBrowserAPI(setupFirefoxCaretPosition, useTextSelection, containerRef);
      expect(result.current.state.isSelecting).toBe(true);
    });

    it('should handle caretPositionFromPoint returning null', () => {
      const mocks = createBrowserMock('firefox');
      
      const setupNullCaretPosition = () => {
        mocks.caretPositionFromPoint.mockReturnValue(null);
        mocks.elementFromPoint.mockReturnValue(document.createElement('div'));
      };

      testBrowserAPI(setupNullCaretPosition, useTextSelection, containerRef);
    });
  });

  describe('Safari browser compatibility', () => {
    beforeEach(() => {
      createBrowserMock('safari');
    });

    it('should work with Safari-specific behaviors', () => {
      const mocks = createBrowserMock('safari');
      
      const setupSafariBehavior = () => {
        mocks.caretRangeFromPoint.mockReturnValue({
          startContainer: { nodeType: Node.TEXT_NODE },
          startOffset: 2
        });
      };

      const result = testBrowserAPI(setupSafariBehavior, useTextSelection, containerRef);
      expect(result.current.state.isSelecting).toBe(true);
    });

    it('should handle Safari selection quirks', () => {
      const mocks = createBrowserMock('safari');
      
      const setupSafariQuirks = () => {
        // Safari sometimes returns different values
        mocks.caretRangeFromPoint.mockReturnValue({
          startContainer: { nodeType: Node.ELEMENT_NODE }, // Not a text node
          startOffset: 0
        });
      };

      testBrowserAPI(setupSafariQuirks, useTextSelection, containerRef);
    });
  });

  describe('Legacy browser compatibility', () => {
    beforeEach(() => {
      createBrowserMock('legacy');
    });

    it('should work without modern caret APIs', () => {
      const mocks = createBrowserMock('legacy');
      
      const createMockBoundingClientRect = () => ({
        left: 90,
        right: 110,
        top: 90,
        bottom: 110,
        width: 20,
        height: 20
      });
      
      const setupLegacyFallback = () => {
        // Setup fallback mocks
        const mockElement = document.createElement('div');
        const mockTextNode = document.createTextNode('sample text');
        mockElement.appendChild(mockTextNode);

        mocks.elementFromPoint.mockReturnValue(mockElement);
        mocks.createTreeWalker.mockReturnValue(createMockTreeWalker(mockTextNode));
        const mockBoundingClientRect = jest.fn(createMockBoundingClientRect);
        
        mocks.createRange.mockReturnValue(createMockRange({
          getBoundingClientRect: mockBoundingClientRect
        }));
      };

      const result = testBrowserAPI(setupLegacyFallback, useTextSelection, containerRef);
      expect(result.current.state.isSelecting).toBe(true);
    });

    it('should handle complete API unavailability gracefully', () => {
      const mocks = createBrowserMock('legacy');
      
      const throwTreeWalkerError = () => {
        throw new Error('TreeWalker not supported');
      };
      
      const throwRangeError = () => {
        throw new Error('Range not supported');
      };
      
      const setupUnavailableAPIs = () => {
        // Mock all APIs to be unavailable or throw errors
        mocks.elementFromPoint.mockReturnValue(null);
        mocks.createTreeWalker.mockImplementation(throwTreeWalkerError);
        mocks.createRange.mockImplementation(throwRangeError);
      };

      const result = testBrowserAPI(setupUnavailableAPIs, useTextSelection, containerRef);
      
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

      const setupNodeTypeMock = (nodeType: number) => {
        mocks.caretRangeFromPoint.mockReturnValue({
          startContainer: { nodeType },
          startOffset: 0
        });
      };
      
      const testNodeTypeHandling = ({ nodeType }: { nodeType: number }) => {
        setupNodeTypeMock(nodeType);
        const mouseEvent = createMouseEventWithTarget('mousedown', {
          button: 0,
          clientX: 100,
          clientY: 100
        });
        testMouseDownAction(mouseEvent);
      };
      
      const testMouseDownAction = (mouseEvent: MouseEvent) => {
        const handleMouseDownAction = () => {
          act(() => {
            result.current.handlers.handleMouseDown(mouseEvent);
          });
        };
        expect(handleMouseDownAction).not.toThrow();
      };

      testCases.forEach(testNodeTypeHandling);
    });
  });

  describe('Browser-specific getSelection behavior', () => {
    it('should handle different getSelection implementations', () => {
      const { result } = renderHook(() => useTextSelection(containerRef));

      // Test different getSelection scenarios
      const testCases = [
        // Standard implementation
        () => ({
          removeAllRanges: jest.fn(),
          addRange: jest.fn(),
          rangeCount: 0,
          empty: jest.fn()
        }),
        // Implementation without empty method (older browsers)
        () => ({
          removeAllRanges: jest.fn(),
          addRange: jest.fn(),
          rangeCount: 0
        }),
        // Null getSelection (edge case)
        () => null
      ];

      const setupGetSelectionMock = (getSelectionImpl: () => any) => {
        (window.getSelection as jest.Mock).mockImplementation(getSelectionImpl);
      };
      
      const testGetSelectionImpl = (getSelectionImpl: () => any) => {
        setupGetSelectionMock(getSelectionImpl);
        testClearSelectionAction();
      };
      
      const testClearSelectionAction = () => {
        const clearSelectionAction = () => {
          act(() => {
            result.current.handlers.clearSelection();
          });
        };
        expect(clearSelectionAction).not.toThrow();
      };

      testCases.forEach(testGetSelectionImpl);
    });
  });

  describe('Browser-specific range behavior', () => {
    it('should handle different range implementations', () => {
      const mocks = createBrowserMock('chrome');
      
      const createErrorRange = () => {
        const throwBoundingClientRectError = () => {
          throw new Error('getBoundingClientRect failed');
        };
        
        return {
          selectNodeContents: jest.fn(),
          getBoundingClientRect: jest.fn(throwBoundingClientRectError),
          collapsed: false,
          toString: jest.fn(() => 'text')
        };
      };

      const createStandardRange = () => ({
        selectNodeContents: jest.fn(),
        getBoundingClientRect: jest.fn(() => ({
          left: 0, right: 100, top: 0, bottom: 20, width: 100, height: 20
        })),
        collapsed: false,
        toString: jest.fn(() => 'text')
      });

      const createCollapsedRange = () => ({
        selectNodeContents: jest.fn(),
        getBoundingClientRect: jest.fn(() => ({
          left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0
        })),
        collapsed: true,
        toString: jest.fn(() => '')
      });

      // Test different range behaviors
      const mockRanges = [
        createStandardRange(),
        createErrorRange(),
        createCollapsedRange()
      ];

      const testRangeImplementation = (mockRange: any) => {
        const setupRangeMock = () => {
          mocks.createRange.mockReturnValue(mockRange);
        };
        
        testBrowserAPI(setupRangeMock, useTextSelection, containerRef);
      };

      mockRanges.forEach(testRangeImplementation);
    });
  });

  describe('Browser-specific CSS getComputedStyle', () => {
    it('should handle different getComputedStyle implementations', () => {
      const mocks = createBrowserMock('chrome');
      
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

      const setupGetComputedStyleMock = (getComputedStyleImpl: () => any) => {
        mocks.getComputedStyle.mockImplementation(getComputedStyleImpl);
      };

      const testGetComputedStyleImpl = (getComputedStyleImpl: () => any) => {
        setupGetComputedStyleMock(getComputedStyleImpl);
        testBrowserAPI(emptySetup, useTextSelection, containerRef);
      };
      
      const emptySetup = () => {};

      testCases.forEach(testGetComputedStyleImpl);
    });
  });

  describe('Mobile browser compatibility', () => {
    it('should handle touch-based browsers', () => {
      const mocks = createBrowserMock('chrome');
      
      const setupTouchBrowser = () => {
        // Simulate touch browser behavior (limited API support)
        mocks.caretRangeFromPoint.mockReturnValue(null);
        mocks.elementFromPoint.mockReturnValue(null);
      };

      const result = testBrowserAPI(setupTouchBrowser, useTextSelection, containerRef);
      expect(result.current.state.isSelecting).toBe(true);
    });

    it('should handle viewport and zoom differences', () => {
      const mocks = createBrowserMock('safari');
      
      const setupViewportTest = () => {
        // Simulate coordinates that might be affected by mobile viewport/zoom
        mocks.caretRangeFromPoint.mockReturnValue({
          startContainer: { nodeType: Node.TEXT_NODE },
          startOffset: 1
        });
      };

      setupViewportTest();
      
      // Test with various coordinate scenarios
      const coordinates = [
        { x: 50, y: 50 },   // Normal coordinates
        { x: 0, y: 0 },     // Edge coordinates
        { x: -10, y: -10 }, // Negative coordinates
        { x: 1000, y: 1000 } // Large coordinates
      ];

      const testCoordinate = ({ x, y }: { x: number; y: number }) => {
        testMouseEventHandling(useTextSelection, containerRef, {
          clientX: x,
          clientY: y
        });
      };

      coordinates.forEach(testCoordinate);
    });
  });
});