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


// Helper to determine if a node should be included in selection
const shouldIncludeNode = (rect: DOMRect, minY: number, maxY: number, isMiddleNode: boolean): boolean => {
  if (!isMiddleNode) return true;
  
  // For middle nodes, be stricter about inclusion to prevent extra content
  const tolerance = 2; // pixels
  return rect.top >= minY + tolerance && rect.bottom <= maxY - tolerance;
};


// Helper to check if a text node is inside a mention link
const isNodeInMention = (node: Node): boolean => {
  let parent = node.parentElement;
  while (parent) {
    if (parent.tagName === 'A' && (parent.textContent?.startsWith('@') || parent.textContent?.startsWith('#'))) {
      return true;
    }
    parent = parent.parentElement;
  }
  return false;
};

// Helper to process text node for selection
interface SelectionBounds {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  minY: number;
  maxY: number;
}

const processTextNode = (
  nodeInfo: any,
  bounds: SelectionBounds,
  extractNodeText: Function
) => {
  const { node, rect, dropElement } = nodeInfo;
  const { startX, startY, endX, endY, minY, maxY } = bounds;
  
  // Check if this node should be included in the range
  if (rect.bottom < minY || rect.top > maxY) return null;

  // Determine selection direction and node types
  const isTopToBottom = startY < endY;
  const actualStartY = isTopToBottom ? startY : endY;
  const actualEndY = isTopToBottom ? endY : startY;
  
  const isStartNode = rect.top <= actualStartY && rect.bottom >= actualStartY;
  const isEndNode = rect.top <= actualEndY && rect.bottom >= actualEndY;
  const isMiddleNode = !isStartNode && !isEndNode;
  
  // Check if this node should be included - be more lenient for nodes near mentions
  if (!shouldIncludeNode(rect, minY, maxY, isMiddleNode)) {
    // Additional check for nodes that might be part of a sentence with mentions
    // If this node is very close to the selection area, include it
    const tolerance = 5; // pixels
    const isNearSelection = rect.bottom >= minY - tolerance && rect.top <= maxY + tolerance;
    if (!isNearSelection) {
      return null;
    }
  }
  
  // For middle nodes that are clearly within the selection, include full text
  if (isMiddleNode && rect.top >= minY && rect.bottom <= maxY) {
    const nodeText = node.textContent || '';
    if (!nodeText.trim()) return null;
    return { nodeText, dropElement };
  }
  
  // Get the text content for this node - pass actual coordinates based on direction
  const actualStartX = isTopToBottom ? startX : endX;
  const actualEndX = isTopToBottom ? endX : startX;
  const nodeText = extractNodeText(node, isStartNode, isEndNode, actualStartX, actualStartY, actualEndX, actualEndY);
  
  if (nodeText === null || !nodeText.trim()) {
    return null;
  }
  
  return { nodeText, dropElement };
};

// Helper to create a highlight span for a single node
const createHighlightForNode = (node: Node, spanId: string): HTMLSpanElement | null => {
  const range = document.createRange();
  range.setStart(node, 0);
  range.setEnd(node, node.textContent?.length || 0);
  
  if (range.collapsed || !range.toString().trim()) {
    return null;
  }
  
  try {
    const span = document.createElement('span');
    span.className = 'custom-text-highlight';
    span.dataset.highlightId = spanId;
    
    // Use surroundContents to wrap the selected text
    range.surroundContents(span);
    return span;
  } catch (e) {
    // If surroundContents fails, try extracting and reinserting
    try {
      const contents = range.extractContents();
      const span = document.createElement('span');
      span.className = 'custom-text-highlight';
      span.dataset.highlightId = spanId;
      span.appendChild(contents);
      range.insertNode(span);
      return span;
    } catch (e2) {
      return null;
    }
  }
};

// Helper to create a precise highlight that matches the extracted text
const createPreciseHighlightForNode = (node: Node, extractedText: string, spanId: string): HTMLSpanElement | null => {
  const fullText = node.textContent || '';
  
  // If extracted text is the full node text, use the original function
  if (extractedText === fullText) {
    return createHighlightForNode(node, spanId);
  }
  
  // Find where the extracted text starts and ends in the full text
  const startIndex = fullText.indexOf(extractedText);
  if (startIndex === -1) {
    // If we can't find the text, highlight the whole node as fallback
    return createHighlightForNode(node, spanId);
  }
  
  const endIndex = startIndex + extractedText.length;
  
  try {
    const range = document.createRange();
    range.setStart(node, startIndex);
    range.setEnd(node, endIndex);
    
    if (range.collapsed || !range.toString().trim()) {
      return null;
    }
    
    const span = document.createElement('span');
    span.className = 'custom-text-highlight';
    span.dataset.highlightId = spanId;
    
    // Use surroundContents to wrap the selected text
    range.surroundContents(span);
    return span;
  } catch (e) {
    // If precise highlighting fails, fall back to whole node
    return createHighlightForNode(node, spanId);
  }
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
    
    // Fallback: try to find text node at point using elementFromPoint
    const element = document.elementFromPoint(x, y);
    if (element) {
      // Walk through text nodes to find one at this position
      const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null
      );
      
      let node;
      while (node = walker.nextNode()) {
        if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
          const range = document.createRange();
          range.selectNodeContents(node);
          const rect = range.getBoundingClientRect();
          if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
            // Estimate offset based on position
            const textLength = node.textContent.length;
            const relativeX = x - rect.left;
            const charWidth = rect.width / textLength;
            const offset = Math.round(relativeX / charWidth);
            return { node, offset: Math.max(0, Math.min(offset, textLength)) };
          }
        }
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
    
    // For mentions, we'll use a simpler approach
    const inMention = isNodeInMention(node);
    
    // Both start and end in same node
    if (isStartNode && isEndNode && startX !== undefined && startY !== undefined && endX !== undefined && endY !== undefined) {
      if (inMention) {
        // For mentions, include the whole thing if any part is selected
        return nodeText;
      }
      
      const startPos = getTextNodeAtPoint(startX, startY);
      const endPos = getTextNodeAtPoint(endX, endY);
      
      // If we found exact positions in this node, use them
      if (startPos?.node === node && endPos?.node === node) {
        const startOffset = Math.min(startPos.offset, endPos.offset);
        const endOffset = Math.max(startPos.offset, endPos.offset);
        return nodeText.substring(startOffset, endOffset);
      }
      
      // Special case: Check if this node is part of a mention-adjacent text flow
      // This happens when selecting "testing @mention, more text" where nodes are split
      const range = document.createRange();
      range.selectNodeContents(node);
      const nodeRect = range.getBoundingClientRect();
      
      // Special handling for single-line selections where getTextNodeAtPoint fails
      // This often happens with text split by mentions
      const selectionLeft = Math.min(startX, endX);
      const selectionRight = Math.max(startX, endX);
      
      // Check if the selection clearly spans across this node
      if (nodeRect.left >= selectionLeft && nodeRect.right <= selectionRight) {
        // Node is completely within selection - include it
        return nodeText;
      }
      
      // Be more lenient with edge detection for nodes near mentions
      const edgeTolerance = 10; // pixels
      
      // Check if we're at the edges of the selection
      if (nodeRect.left < selectionLeft + edgeTolerance && nodeRect.right > selectionLeft - edgeTolerance) {
        // This node contains or is near the start of the selection
        const startPos = getTextNodeAtPoint(selectionLeft, startY);
        if (startPos && startPos.node === node) {
          return nodeText.substring(startPos.offset);
        }
        // If we can't get precise position but node is close, include from start
        if (nodeRect.right > selectionLeft) {
          return nodeText;
        }
      }
      
      if (nodeRect.left < selectionRight + edgeTolerance && nodeRect.right > selectionRight - edgeTolerance) {
        // This node contains or is near the end of the selection
        const endPos = getTextNodeAtPoint(selectionRight, endY);
        if (endPos && endPos.node === node) {
          return nodeText.substring(0, endPos.offset);
        }
        // If we can't get precise position but node is close, include to end
        if (nodeRect.left < selectionRight) {
          return nodeText;
        }
      }
      
      return null;
    }
    
    // Start node only
    if (isStartNode && startX !== undefined && startY !== undefined) {
      if (inMention) {
        // For mentions at start, include the whole mention
        return nodeText;
      }
      const startPos = getTextNodeAtPoint(startX, startY);
      if (startPos?.node === node) {
        return nodeText.substring(startPos.offset);
      }
      return null;
    }
    
    // End node only
    if (isEndNode && endX !== undefined && endY !== undefined) {
      if (inMention) {
        // For mentions at end, include the whole mention
        return nodeText;
      }
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
      {
        acceptNode: () => {
          // Accept all text nodes, even those inside mention/handle elements
          return NodeFilter.FILTER_ACCEPT;
        }
      }
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
        
        // Check if text node is clipped by any overflow:hidden ancestor
        let isClipped = false;
        let checkElement = node.parentElement;
        while (checkElement && checkElement !== container) {
          const styles = window.getComputedStyle(checkElement);
          if (styles.overflow === 'hidden' || styles.overflowY === 'hidden') {
            const parentRect = checkElement.getBoundingClientRect();
            // If the text node is below the visible area of its overflow:hidden container
            if (nodeTop >= parentRect.bottom) {
              isClipped = true;
              break;
            }
          }
          checkElement = checkElement.parentElement;
        }
        
        if (!isClipped) {
          textNodes.push({
            node,
            rect,
            dropElement,
            visualTop: rect.top
          });
        }
      }
    }

    // Always sort by visual position (top to bottom) to maintain document order
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

      // Track processed nodes to avoid duplicates
      const processedNodes = new Set<Node>();
      
      for (const nodeInfo of textNodeInfos) {
        // Skip if we've already processed this node
        if (processedNodes.has(nodeInfo.node)) {
          continue;
        }
        
        const bounds: SelectionBounds = { startX, startY, endX, endY, minY, maxY };
        const result = processTextNode(nodeInfo, bounds, extractNodeText);
        
        if (!result) continue;
        
        const { nodeText, dropElement } = result;
        
        processedNodes.add(nodeInfo.node);

        // Add line break when moving to a different drop
        if (!isFirstNode && dropElement !== lastDropElement && lastDropElement !== null) {
          selectedText += '\n';
        }
        
        // Add the text with proper spacing
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
      

      for (const nodeInfo of textNodeInfos) {
        const node = nodeInfo.node;
        
        // Skip nodes that are already inside a highlight span
        if (isNodeHighlighted(node)) continue;

        const nodeRange = document.createRange();
        nodeRange.selectNodeContents(node);
        const nodeRect = nodeRange.getBoundingClientRect();

        // Skip nodes outside our range
        if (nodeRect.bottom < minY || nodeRect.top > maxY) continue;

        // Use the same logic as text extraction to determine what to highlight
        const bounds: SelectionBounds = { 
          startX: selection.startX, 
          startY: selection.startY, 
          endX: selection.endX, 
          endY: selection.endY, 
          minY, 
          maxY 
        };
        
        const result = processTextNode(nodeInfo, bounds, extractNodeText);
        if (!result) continue; // Skip nodes that wouldn't be included in selection
        
        const { nodeText } = result;
        
        // Create precise highlight based on what text would actually be selected
        const spanId = `highlight-${Date.now()}-${spans.length}`;
        const span = createPreciseHighlightForNode(node, nodeText, spanId);
        
        if (span) {
          spans.push(span);
        }
      }

      return spans;
    } catch (e) {
      return [];
    }
  }, [containerRef, getAllTextNodesInRange, processTextNode, extractNodeText]);


  // Detect when scrolling to avoid interfering
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Don't treat auto-scroll during selection as user scrolling
      if (state.isSelecting) return;
      
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
  }, [containerRef, state.isSelecting]);

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

    // Check if clicking on interactive elements (but allow links for text selection)
    const target = e.target as HTMLElement;
    if (target.closest('button, input, textarea, select')) return;
    
    // For links, we'll allow selection but prevent default click behavior
    const linkElement = target.closest('a');
    if (linkElement) {
      e.preventDefault();
    }
    
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
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(textToCopy).catch(() => {
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
              setData: (type: string) => {
                if (type === 'text/plain') {
                  // Store for manual fallback
                }
              },
              getData: () => textToCopy
            }
          });
          document.dispatchEvent(copyEvent);
        } catch {
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