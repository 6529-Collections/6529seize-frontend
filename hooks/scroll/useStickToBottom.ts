import { RefObject, useLayoutEffect, useRef } from 'react';

export function useStickToBottom(
  scrollContainerRef: RefObject<HTMLElement | null>,
  contentLength: number,
  isAtBottom: boolean
): void {
  const wasAtBottomRef = useRef<boolean>(true);
  const previousContentLengthRef = useRef<number>(contentLength);

  useLayoutEffect(() => {
    // Update the wasAtBottom status before checking content length changes
    wasAtBottomRef.current = isAtBottom;
    
    const container = scrollContainerRef.current;
    if (!container) return;

    // Check if content length increased
    if (contentLength > previousContentLengthRef.current && wasAtBottomRef.current) {
      // Use requestAnimationFrame to ensure layout is complete before scrolling
      requestAnimationFrame(() => {
        if (container) {
          // In a flex-col-reverse container, the visual "bottom" (where new messages appear)
          // is actually the DOM top, so we scroll to 0
          container.scrollTo({ 
            top: 0, 
            behavior: 'smooth' 
          });
        }
      });
    }

    // Update the previous content length after the check
    previousContentLengthRef.current = contentLength;
  }, [contentLength, isAtBottom, scrollContainerRef]);
}