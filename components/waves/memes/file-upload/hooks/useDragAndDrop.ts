"use client";

import { useCallback, useRef } from "react";

/**
 * Props for the useDragAndDrop hook
 */
interface UseDragAndDropProps {
  /** Whether drag and drop is enabled */
  enabled: boolean;
  /** Callback for when a file is dropped */
  onFileDrop: (file: File) => void;
  /** Callback to set the visual state during drag events */
  setVisualState: (state: "idle" | "dragging") => void;
}

/**
 * Interface for the return value of the useDragAndDrop hook
 */
interface DragAndDropHandlers {
  /** Reference to the drop area element */
  dropAreaRef: React.RefObject<HTMLDivElement | null>;
  /** Handler for drag enter events */
  handleDragEnter: (e: React.DragEvent<HTMLDivElement>) => void;
  /** Handler for drag over events */
  handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  /** Handler for drag leave events */
  handleDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  /** Handler for drop events */
  handleDrop: (e: React.DragEvent<HTMLDivElement>) => void;
}

/**
 * Hook for managing drag and drop interactions
 *
 * Provides event handlers and ref for implementing drag and drop functionality.
 *
 * @param props Hook props
 * @returns Object with ref and event handlers
 */
const useDragAndDrop = ({
  enabled,
  onFileDrop,
  setVisualState,
}: UseDragAndDropProps): DragAndDropHandlers => {
  const dropAreaRef = useRef<HTMLDivElement>(null);

  // Properly typed drag event handlers
  const handleDragEnter = useCallback(
    (e: React.DragEvent<HTMLDivElement>): void => {
      if (!enabled) return;

      e.preventDefault();
      e.stopPropagation();
      setVisualState("dragging");
    },
    [enabled, setVisualState]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>): void => {
      if (!enabled) return;

      e.preventDefault();
      e.stopPropagation();
      // Keep the dragging state active
      setVisualState("dragging");
    },
    [enabled, setVisualState]
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent<HTMLDivElement>): void => {
      if (!enabled) return;

      e.preventDefault();
      e.stopPropagation();

      // Only reset if leaving the component (not entering child elements)
      if (
        dropAreaRef.current &&
        !dropAreaRef.current.contains(e.relatedTarget as Node)
      ) {
        setVisualState("idle");
      }
    },
    [enabled, dropAreaRef, setVisualState]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>): void => {
      if (!enabled) return;

      e.preventDefault();
      e.stopPropagation();

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        onFileDrop(e.dataTransfer.files[0]!);
      } else {
        // Reset if no files were dropped
        setVisualState("idle");
      }
    },
    [enabled, onFileDrop, setVisualState]
  );

  return {
    dropAreaRef,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
};

export default useDragAndDrop;
