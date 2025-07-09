import { useRef, useState, useCallback, useEffect } from 'react';

interface SelectionRange {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  text: string;
}

interface TextSelectionState {
  isSelecting: boolean;
  selection: SelectionRange | null;
  highlightSpans: HTMLSpanElement[];
}

// Helper function to check if a node is already highlighted
const isNodeHighlighted = (node: Node): boolean => {
  let parentElement = node.parentElement;
  while (parentElement) {
    if (parentElement.classList.contains('custom-text-highlight')) {
      return true;
    }
    parentElement = parentElement.parentElement;
  }
  return false;
};

// Helper function to handle auto-scroll when dragging near edges
const handleAutoScroll = (container: HTMLElement, clientY: number) => {
  const rect = container.getBoundingClientRect();
  const scrollSpeed = 5;
  const edgeThreshold = 50;
  
  if (clientY < rect.top + edgeThreshold) {
    container.scrollTop -= scrollSpeed;
  } else if (clientY > rect.bottom - edgeThreshold) {
    container.scrollTop += scrollSpeed;
  }
};

// Helper to determine if a node should be included in selection
const shouldIncludeNode = (rect: DOMRect, minY: number, maxY: number, isMiddleNode: boolean): boolean => {
  if (!isMiddleNode) return true;
  
  // For middle nodes, be stricter about inclusion to prevent extra content
  const tolerance = 2; // pixels
  return rect.top >= minY + tolerance && rect.bottom <= maxY - tolerance;
};

// Helper to get node type
const getNodeType = (isStartNode: boolean, isEndNode: boolean): string => {
  if (isStartNode && isEndNode) return 'start+end';
  if (isStartNode) return 'start';
  if (isEndNode) return 'end';
  return 'middle';
};

export const useTextSelection = (containerRef: React.RefObject<HTMLElement | null>) => {
  const [state, setState] = useState<TextSelectionState>({
    isSelecting: false,
    selection: null,
    highlightSpans: []
  });

  const startPointRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tempSelectionElementRef = useRef<HTMLDivElement | null>(null);

  // Detect when scrolling to avoid interfering
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      isScrollingRef.current = true;
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false;
      }, 150);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [containerRef]);

  const getTextNodeAtPoint = useCallback((x: number, y: number): { node: Node; offset: number } | null => {
    // Use native browser APIs to find text at coordinates
    if ('caretPositionFromPoint' in document) {
      const pos = (document as any).caretPositionFromPoint(x, y);
      if (pos?.offsetNode?.nodeType === Node.TEXT_NODE) {
        return { node: pos.offsetNode, offset: pos.offset };
      }
    } else if ('caretRangeFromPoint' in document) {
      const range = (document as any).caretRangeFromPoint(x, y);
      if (range?.startContainer?.nodeType === Node.TEXT_NODE) {
        return { node: range.startContainer, offset: range.startOffset };
      }
    }
    return null;
  }, []);

  // Auto-scroll container when dragging near edges
  const handleAutoScroll = useCallback((container: HTMLElement, clientY: number) => {
    const containerRect = container.getBoundingClientRect();
    const scrollZone = 50; // pixels from edge to trigger scroll
    const scrollSpeed = 10; // pixels per scroll
    
    // Check if mouse is near bottom edge
    if (clientY > containerRect.bottom - scrollZone && clientY < containerRect.bottom) {
      container.scrollTop += scrollSpeed;
    }
    // Check if mouse is near top edge  
    else if (clientY < containerRect.top + scrollZone && clientY > containerRect.top) {
      container.scrollTop -= scrollSpeed;
    }
  }, []);

  // Extract text from a node with optional start/end offsets
  const extractNodeText = useCallback((
    node: Node, 
    isStartNode: boolean,
    isEndNode: boolean,
    startX?: number,
    startY?: number,
    endX?: number,
    endY?: number
  ): string | null => {
    const nodeText = node.textContent || '';
    
    // Both start and end in same node
    if (isStartNode && isEndNode && startX !== undefined && startY !== undefined && endX !== undefined && endY !== undefined) {
      const startPos = getTextNodeAtPoint(startX, startY);
      const endPos = getTextNodeAtPoint(endX, endY);
      if (startPos?.node === node && endPos?.node === node) {
        const startOffset = Math.min(startPos.offset, endPos.offset);
        const endOffset = Math.max(startPos.offset, endPos.offset);
        return nodeText.substring(startOffset, endOffset);
      }
      return null;
    }
    
    // Start node only
    if (isStartNode && startX !== undefined && startY !== undefined) {
      const startPos = getTextNodeAtPoint(startX, startY);
      if (startPos?.node === node) {
        return nodeText.substring(startPos.offset);
      }
      return null;
    }
    
    // End node only
    if (isEndNode && endX !== undefined && endY !== undefined) {
      const endPos = getTextNodeAtPoint(endX, endY);
      if (endPos?.node === node) {
        return nodeText.substring(0, endPos.offset);
      }
      return null;
    }
    
    // Middle node - return full text
    return nodeText;
  }, [getTextNodeAtPoint]);

  interface TextNodeInfo {
    node: Node;
    rect: DOMRect;
    dropElement: Element | null;
    visualTop: number;
  }

  const getAllTextNodesInRange = useCallback((container: HTMLElement, startX: number, startY: number, endX: number, endY: number): TextNodeInfo[] => {
    const textNodes: TextNodeInfo[] = [];
    
    // Calculate selection rectangle
    const minX = Math.min(startX, endX);
    const maxX = Math.max(startX, endX);
    const minY = Math.min(startY, endY);
    const maxY = Math.max(startY, endY);
    
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      null
    );

    let node;
    while (node = walker.nextNode()) {
      if (!node.textContent?.trim()) continue;
      
      // Get the position of the text node
      const range = document.createRange();
      range.selectNodeContents(node);
      const rect = range.getBoundingClientRect();
      
      // Check if this text node intersects with our selection rectangle
      const nodeLeft = rect.left;
      const nodeRight = rect.right;
      const nodeTop = rect.top;
      const nodeBottom = rect.bottom;
      
      // Rectangle intersection check
      const intersects = !(nodeRight < minX || nodeLeft > maxX || nodeBottom < minY || nodeTop > maxY);
      
      if (intersects) {
        // Find the closest drop element (look for component with drop data)
        let dropElement: Element | null = null;
        let parent = node.parentElement;
        while (parent && parent !== container) {
          if (parent.classList.contains('tw-group') || parent.getAttribute('data-drop-id')) {
            dropElement = parent;
            break;
          }
          parent = parent.parentElement;
        }
        
        textNodes.push({
          node,
          rect,
          dropElement,
          visualTop: rect.top
        });
        
      }
    }

    // Sort by visual position (top to bottom as user sees it)
    textNodes.sort((a, b) => a.visualTop - b.visualTop);
    
    return textNodes;
  }, []);

  const calculateSelection = useCallback((startX: number, startY: number, endX: number, endY: number): SelectionRange | null => {
    if (!containerRef.current) return null;

    try {
      // Get all text nodes in the vertical range
      const minY = Math.min(startY, endY);
      const maxY = Math.max(startY, endY);
      
      
      const textNodeInfos = getAllTextNodesInRange(containerRef.current, startX, startY, endX, endY);
      
      if (textNodeInfos.length === 0) return null;

      // Build formatted text with proper spacing and line breaks
      let selectedText = '';
      let lastDropElement: Element | null = null;
      let isFirstNode = true;

      for (const nodeInfo of textNodeInfos) {
        const { node, rect, dropElement } = nodeInfo;
        
        // Check if this node should be included in the range
        if (rect.bottom < minY || rect.top > maxY) continue;

        // Determine node type relative to selection
        const isStartNode = rect.top <= startY && rect.bottom >= startY;
        const isEndNode = rect.top <= endY && rect.bottom >= endY;
        const isMiddleNode = !isStartNode && !isEndNode;
        
        // Check if this node should be included
        if (!shouldIncludeNode(rect, minY, maxY, isMiddleNode)) {
          continue;
        }


        // Add line break when moving to a different drop
        if (!isFirstNode && dropElement !== lastDropElement && lastDropElement !== null) {
          selectedText += '\n';
        }
        
        // Get the text content for this node
        const nodeText = extractNodeText(node, isStartNode, isEndNode, startX, startY, endX, endY);
        
        // Skip if we couldn't extract text (precise position not found)
        if (nodeText === null) {
          continue;
        }
        
        
        // Add the text with proper spacing
        if (nodeText.trim()) {
          if (!isFirstNode && dropElement === lastDropElement) {
            // Same drop, add space if needed
            if (!selectedText.endsWith(' ') && !nodeText.startsWith(' ')) {
              selectedText += ' ';
            }
          }
          selectedText += nodeText;
          lastDropElement = dropElement;
          isFirstNode = false;
        }
      }

      if (!selectedText.trim()) return null;

      return { startX, startY, endX, endY, text: selectedText };
    } catch (e) {
      return null;
    }
  }, [containerRef, getAllTextNodesInRange, extractNodeText]);

  const createHighlightSpans = useCallback((selection: SelectionRange): HTMLSpanElement[] => {
    if (!containerRef.current) return [];

    try {
      const spans: HTMLSpanElement[] = [];
      
      // Get all text nodes in the selection range
      const minY = Math.min(selection.startY, selection.endY);
      const maxY = Math.max(selection.startY, selection.endY);
      
      const textNodeInfos = getAllTextNodesInRange(containerRef.current, selection.startX, selection.startY, selection.endX, selection.endY);
      const textNodes = textNodeInfos.map(info => info.node);
      

      for (const node of textNodes) {
        // Skip nodes that are already inside a highlight span
        if (isNodeHighlighted(node)) continue;

        const nodeRange = document.createRange();
        nodeRange.selectNodeContents(node);
        const nodeRect = nodeRange.getBoundingClientRect();

        // Skip nodes outside our range
        if (nodeRect.bottom < minY || nodeRect.top > maxY) continue;

        // Create a range for this specific node
        const range = document.createRange();
        
        // Always try to highlight any node that's in our selection
        range.setStart(node, 0);
        range.setEnd(node, node.textContent?.length || 0);
        

        // Only create span if range has content
        
        if (!range.collapsed && range.toString().trim()) {
          try {
            const span = document.createElement('span');
            span.className = 'custom-text-highlight';
            span.dataset.highlightId = `highlight-${Date.now()}-${spans.length}`;
            
            
            // Use surroundContents to wrap the selected text
            range.surroundContents(span);
            spans.push(span);
            
          } catch (e) {
            // If surroundContents fails (e.g., range spans multiple elements),
            // try extracting and reinserting the content
            try {
              const contents = range.extractContents();
              const span = document.createElement('span');
              span.className = 'custom-text-highlight';
              span.dataset.highlightId = `highlight-${Date.now()}-${spans.length}`;
              span.appendChild(contents);
              range.insertNode(span);
              spans.push(span);
            } catch (e2) {
              // Span creation failed, skip this node
            }
          }
        }
      }

      return spans;
    } catch (e) {
      return [];
    }
  }, [containerRef, getTextNodeAtPoint, getAllTextNodesInRange]);

  // Utility function to remove highlight spans from DOM
  const removeHighlightSpans = useCallback((container: HTMLElement) => {
    const highlights = container.querySelectorAll('span.custom-text-highlight');
    highlights.forEach(span => {
      const parent = span.parentNode;
      if (parent) {
        // Move all children out of the span
        while (span.firstChild) {
          parent.insertBefore(span.firstChild, span);
        }
        // Remove the empty span
        parent.removeChild(span);
        // Normalize to merge adjacent text nodes
        parent.normalize();
      }
    });
  }, []);

  // Cleanup temp selection element
  const cleanupTempSelectionElement = useCallback(() => {
    if (tempSelectionElementRef.current && document.body.contains(tempSelectionElementRef.current)) {
      document.body.removeChild(tempSelectionElementRef.current);
      tempSelectionElementRef.current = null;
    }
    
    // Also remove copy listener
    if (copyListenerRef.current) {
      document.removeEventListener('copy', copyListenerRef.current);
      copyListenerRef.current = null;
    }
  }, []);

  const clearSelection = useCallback(() => {
    // 1. Collapse any live browser selection
    const sel = window.getSelection();
    if (sel) sel.removeAllRanges();

    // 2. Clean up any temporary selection element
    cleanupTempSelectionElement();

    // 3. Remove all highlight spans
    const container = containerRef.current;
    if (container) {
      removeHighlightSpans(container);
    }

    // 4. Update React state
    setState({
      isSelecting: false,
      selection: null,
      highlightSpans: []
    });
    startPointRef.current = null;
  }, [containerRef, cleanupTempSelectionElement, removeHighlightSpans]);


  const handleMouseDown = useCallback((e: MouseEvent) => {
    // Only handle left click
    if (e.button !== 0) return;
    
    // Don't interfere during scrolling
    if (isScrollingRef.current) return;

    // Check if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, textarea, select')) return;
    
    startPointRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now()
    };

    // Clear any existing highlights from DOM before starting new selection
    const container = containerRef.current;
    if (container) {
      removeHighlightSpans(container);
    }

    setState({
      isSelecting: true,
      selection: null,
      highlightSpans: []
    });

    // Clear any existing browser selection immediately and aggressively
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.empty?.(); // Alternative method for older browsers
    }
  }, [containerRef]);

  // Global copy event listener reference
  const copyListenerRef = useRef<((e: ClipboardEvent) => void) | null>(null);

  // Populate browser selection for context menu copy
  const populateBrowserSelection = useCallback(() => {
    if (!state.selection?.text) return;
    
    try {
      const sel = window.getSelection();
      if (!sel) return;
      
      // Clear existing selection
      sel.removeAllRanges();
      
      // Clean up any existing temp element
      cleanupTempSelectionElement();
      
      // Remove any existing copy listener
      if (copyListenerRef.current) {
        document.removeEventListener('copy', copyListenerRef.current);
        copyListenerRef.current = null;
      }
      
      // Always use the temporary element approach for consistent behavior
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'fixed';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      tempDiv.style.whiteSpace = 'pre-wrap';
      tempDiv.style.userSelect = 'text';
      (tempDiv.style as any).webkitUserSelect = 'text';
      (tempDiv.style as any).mozUserSelect = 'text';
      (tempDiv.style as any).msUserSelect = 'text';
      tempDiv.style.zIndex = '-1';
      // Removed contentEditable to prevent paste conflicts
      tempDiv.textContent = state.selection.text;
      tempDiv.setAttribute('data-temp-selection', 'true');
      document.body.appendChild(tempDiv);
      
      // Store reference for cleanup
      tempSelectionElementRef.current = tempDiv;
      
      // Select all content in the temp div without focusing it
      const range = document.createRange();
      range.selectNodeContents(tempDiv);
      sel.removeAllRanges();
      sel.addRange(range);
      
      // Create persistent copy handler
      const handleCopy = (e: ClipboardEvent) => {
        if (e.clipboardData && state.selection?.text) {
          e.preventDefault();
          e.clipboardData.setData('text/plain', state.selection.text);
        }
      };
      
      // Store reference and add listener
      copyListenerRef.current = handleCopy;
      document.addEventListener('copy', handleCopy);
      
    } catch (e) {
      // Error populating browser selection
    }
  }, [state.selection, cleanupTempSelectionElement]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!state.isSelecting || !startPointRef.current) return;

    // Auto-scroll when dragging near container edges
    const container = containerRef.current;
    if (container) {
      handleAutoScroll(container, e.clientY);
    }

    // Cancel any pending update
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }

    rafIdRef.current = requestAnimationFrame(() => {
      const start = startPointRef.current;
      if (!start) return;

      // Clear any native selection that might have appeared
      const nativeSelection = window.getSelection();
      if (nativeSelection && nativeSelection.rangeCount > 0) {
        nativeSelection.removeAllRanges();
      }

      // Check minimum drag distance
      const distance = Math.hypot(e.clientX - start.x, e.clientY - start.y);
      if (distance < 5) return;

      const selection = calculateSelection(start.x, start.y, e.clientX, e.clientY);
      if (selection) {
        // Clear any existing spans before creating new ones
        const container = containerRef.current;
        if (container) {
          removeHighlightSpans(container);
        }
        
        const highlightSpans = createHighlightSpans(selection);
        setState({
          isSelecting: true,
          selection,
          highlightSpans
        });
      }
    });
  }, [state.isSelecting, containerRef, calculateSelection, createHighlightSpans, removeHighlightSpans, handleAutoScroll]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!state.isSelecting) return;

    const start = startPointRef.current;
    if (!start) return;

    // Check if it was a click (short duration, small movement)
    const duration = Date.now() - start.time;
    const distance = Math.hypot(e.clientX - start.x, e.clientY - start.y);
    
    if (duration < 200 && distance < 5) {
      // It was a click, clear selection
      clearSelection();
    } else {
      // Keep the selection, just stop selecting mode
      setState(prev => ({
        ...prev,
        isSelecting: false
      }));
      
      // Immediately populate browser selection so it's ready for right-click
      if (state.selection) {
        populateBrowserSelection();
      }
    }

    startPointRef.current = null;
  }, [state.isSelecting, clearSelection, state.selection, populateBrowserSelection]);

  const copySelection = useCallback(() => {
    if (!state.selection?.text) return;

    const textToCopy = state.selection.text;
    
    // Try modern clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy).catch((err) => {
        // Fallback: dispatch copy event
        try {
          const copyEvent = new ClipboardEvent('copy', {
            clipboardData: new DataTransfer(),
            bubbles: true,
            cancelable: true
          });
          // Set the data on the event
          Object.defineProperty(copyEvent, 'clipboardData', {
            value: {
              setData: (type: string, data: string) => {
                if (type === 'text/plain') {
                  // Store for manual fallback
                }
              },
              getData: () => textToCopy
            }
          });
          document.dispatchEvent(copyEvent);
        } catch (fallbackErr) {
          // All copy methods failed
        }
      });
    }
  }, [state.selection]);



  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      cleanupTempSelectionElement();
    };
  }, [cleanupTempSelectionElement]);

  return {
    state,
    handlers: {
      handleMouseDown,
      handleMouseMove,
      handleMouseUp,
      clearSelection,
      copySelection,
      populateBrowserSelection
    }
  };
};