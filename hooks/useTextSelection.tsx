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
    console.log('🔍 getAllTextNodesInRange called with range:', { startX, startY, endX, endY });
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
        
        console.log('✅ Including text node:', {
          text: node.textContent.substring(0, 50) + '...',
          nodeRect: { left: nodeLeft, top: nodeTop, right: nodeRight, bottom: nodeBottom },
          dropElement: dropElement?.tagName,
          visualTop: rect.top
        });
      }
    }

    // Sort by visual position (top to bottom as user sees it)
    textNodes.sort((a, b) => a.visualTop - b.visualTop);
    
    console.log('📊 Total text nodes found:', textNodes.length, 'sorted by visual position');
    return textNodes;
  }, []);

  const calculateSelection = useCallback((startX: number, startY: number, endX: number, endY: number): SelectionRange | null => {
    if (!containerRef.current) return null;

    try {
      // Get all text nodes in the vertical range
      const minY = Math.min(startY, endY);
      const maxY = Math.max(startY, endY);
      
      console.log('🎯 calculateSelection called:', {
        startCoords: { x: startX, y: startY },
        endCoords: { x: endX, y: endY },
        calculatedRange: { minY, maxY },
        rangeDifference: maxY - minY
      });
      
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
        
        // For middle nodes, be stricter about inclusion to prevent extra content
        if (isMiddleNode) {
          // Only include middle nodes that are FULLY within the selection bounds
          // Add a small tolerance for rounding errors
          const tolerance = 2; // pixels
          if (rect.top < minY + tolerance || rect.bottom > maxY - tolerance) {
            console.log('🚫 Skipping middle node outside bounds:', {
              text: node.textContent?.substring(0, 30) + '...',
              nodeTop: rect.top,
              nodeBottom: rect.bottom,
              selectionTop: minY,
              selectionBottom: maxY,
              reason: 'Middle node extends outside selection'
            });
            continue; // Skip nodes that extend outside selection
          }
        }

        console.log('✅ Including node in text:', {
          text: node.textContent?.substring(0, 30) + '...',
          nodeType: isStartNode ? 'start' : isEndNode ? 'end' : 'middle',
          nodeTop: rect.top,
          nodeBottom: rect.bottom,
          selectionTop: minY,
          selectionBottom: maxY
        });

        // Add line break when moving to a different drop
        if (!isFirstNode && dropElement !== lastDropElement && lastDropElement !== null) {
          selectedText += '\n';
        }
        
        // Get the text content for this node
        const nodeText = extractNodeText(node, isStartNode, isEndNode, startX, startY, endX, endY);
        
        // Skip if we couldn't extract text (precise position not found)
        if (nodeText === null) {
          console.log('⚠️ Skipping node - cannot determine precise character position');
          continue;
        }
        
        console.log('📍 Extracted text from node:', {
          nodeType: isStartNode && isEndNode ? 'start+end' : isStartNode ? 'start' : isEndNode ? 'end' : 'middle',
          text: nodeText.substring(0, 30) + '...'
        });
        
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

      console.log('📝 Built formatted text:', selectedText.substring(0, 100) + '...');
      return { startX, startY, endX, endY, text: selectedText };
    } catch (e) {
      console.error('Selection error:', e);
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
      console.log('🎨 createHighlightSpans called for selection:', {
        coords: { startX: selection.startX, startY: selection.startY, endX: selection.endX, endY: selection.endY },
        range: { minY, maxY },
        text: selection.text.substring(0, 50) + '...'
      });
      
      const textNodeInfos = getAllTextNodesInRange(containerRef.current, selection.startX, selection.startY, selection.endX, selection.endY);
      const textNodes = textNodeInfos.map(info => info.node);
      
      console.log('🎨 Found nodes for highlighting:', textNodes.length);

      for (const node of textNodes) {
        // Skip nodes that are already inside a highlight span
        let parentElement = node.parentElement;
        while (parentElement) {
          if (parentElement.classList.contains('custom-text-highlight')) {
            break; // Skip this node, it's already highlighted
          }
          parentElement = parentElement.parentElement;
        }
        if (parentElement) continue; // Skip if we found a highlight ancestor

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
        
        console.log('🎨 Highlighting node fully:', {
          nodeText: node.textContent?.substring(0, 30) + '...',
          rangeText: range.toString().substring(0, 30) + '...'
        });

        // Only create span if range has content
        console.log('🎨 Range created for node:', {
          nodeText: node.textContent?.substring(0, 30) + '...',
          rangeText: range.toString(),
          collapsed: range.collapsed,
          startOffset: range.startOffset,
          endOffset: range.endOffset
        });
        
        if (!range.collapsed && range.toString().trim()) {
          try {
            const span = document.createElement('span');
            span.className = 'custom-text-highlight';
            span.dataset.highlightId = `highlight-${Date.now()}-${spans.length}`;
            
            console.log('🎨 Creating highlight span with text:', range.toString().substring(0, 30) + '...');
            
            // Use surroundContents to wrap the selected text
            range.surroundContents(span);
            spans.push(span);
            
            console.log('🎨 Successfully created highlight span');
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
              console.warn('Could not create highlight span:', e2);
            }
          }
        }
      }

      return spans;
    } catch (e) {
      console.error('Highlight error:', e);
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
          console.log('Copy intercepted and handled with custom text');
        }
      };
      
      // Store reference and add listener
      copyListenerRef.current = handleCopy;
      document.addEventListener('copy', handleCopy);
      
      console.log('Browser selection populated with:', sel.toString().substring(0, 50) + '...');
    } catch (e) {
      console.error('Error populating browser selection:', e);
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
    navigator.clipboard.writeText(textToCopy).catch(() => {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = textToCopy;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
      } catch (err) {
        console.warn('Copy failed:', err);
      }
      document.body.removeChild(textarea);
    });
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