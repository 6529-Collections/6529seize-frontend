"use client"

import React, { useEffect } from 'react';
import { useTextSelection } from '../../../hooks/useTextSelection';

interface TextSelectionOverlayProps {
  containerRef: React.RefObject<HTMLElement | HTMLDivElement | null>;
  children: React.ReactNode;
}

export const TextSelectionOverlay: React.FC<TextSelectionOverlayProps> = ({
  containerRef,
  children
}) => {
  const { state, handlers } = useTextSelection(containerRef);

  // Attach mouse event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Handle mousedown in capture phase to intercept before browser's word selection
    const handleMouseDownCapture = (e: MouseEvent) => {
      // For right click with active selection
      if (e.button === 2 && state.selection?.text) {
        e.preventDefault();
        e.stopPropagation();
        // Ensure browser selection is populated before context menu
        handlers.populateBrowserSelection();
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      // Skip right clicks - already handled in capture phase
      if (e.button === 2) return;
      
      const target = e.target as HTMLElement;
      
      // Check if clicking on excluded elements
      const isExcluded = target.closest('[data-text-selection-exclude="true"], .text-selection-exclude');
      if (isExcluded) {
        return;
      }
      
      // Only prevent default for non-interactive elements during left click
      if (!target.closest('button, a, input, textarea, select') && e.button === 0) {
        // Don't prevent default immediately - let's see if user is making a long drag first
        // e.preventDefault();
      }
      handlers.handleMouseDown(e);
    };

    const handleContextMenu = (e: MouseEvent) => {
      // When right-clicking with custom selection
      if (state.selection?.text) {
        // Prevent any default context menu behavior that might interfere
        e.stopPropagation();
        
        // Always ensure browser selection is populated for context menu
        handlers.populateBrowserSelection();
      }
    };

    const handleSelectStart = (e: Event) => {
      const target = e.target as Node;
      const element = target.nodeType === Node.ELEMENT_NODE ? target as HTMLElement : target.parentElement;
      
      // Check if trying to select excluded elements
      const isExcluded = element?.closest('[data-text-selection-exclude="true"], .text-selection-exclude');
      if (isExcluded) {
        e.preventDefault();
        return;
      }
      
      // Only prevent selectstart if we're actively doing custom selection
      if (state.isSelecting) {
        if (!element?.closest('button, a, input, textarea, select')) {
          e.preventDefault();
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (state.isSelecting) {
        e.preventDefault();
      }
      handlers.handleMouseMove(e);
    };
    const handleMouseUp = (e: MouseEvent) => handlers.handleMouseUp(e);

    // Add capture phase listener for right-click interception
    container.addEventListener('mousedown', handleMouseDownCapture as EventListener, true);
    container.addEventListener('mousedown', handleMouseDown as EventListener);
    container.addEventListener('contextmenu', handleContextMenu as EventListener);
    container.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('mousemove', handleMouseMove as EventListener);
    document.addEventListener('mouseup', handleMouseUp as EventListener);

    return () => {
      container.removeEventListener('mousedown', handleMouseDownCapture as EventListener, true);
      container.removeEventListener('mousedown', handleMouseDown as EventListener);
      container.removeEventListener('contextmenu', handleContextMenu as EventListener);
      container.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('mousemove', handleMouseMove as EventListener);
      document.removeEventListener('mouseup', handleMouseUp as EventListener);
    };
  }, [containerRef, handlers, state.isSelecting, state.selection]);

  // Handle keyboard shortcuts 
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Copy shortcut
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && state.selection) {
        e.preventDefault();
        handlers.copySelection();
      }
      
      // Clear selection with Escape
      if (e.key === 'Escape' && state.selection) {
        e.preventDefault();
        handlers.clearSelection();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [state.selection, handlers]);


  return (
    <>
      {children}
    </>
  );
};

export default TextSelectionOverlay;