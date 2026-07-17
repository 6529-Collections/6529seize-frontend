"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";

const CONTAINER_WIDTH_THRESHOLD = 500;

export const useCreateDropContainerWidth = () => {
  const actionsContainerRef = useRef<HTMLDivElement>(null);
  const [actionsContainerElement, setActionsContainerElement] =
    useState<HTMLDivElement | null>(null);
  const [isWideContainer, setIsWideContainer] = useState(false);

  const setActionsContainerRef = useCallback((node: HTMLDivElement | null) => {
    actionsContainerRef.current = node;
    setActionsContainerElement(node);
  }, []);

  useLayoutEffect(() => {
    if (!actionsContainerElement) {
      return;
    }

    const setWidthState = (width: number) => {
      const isWide = width >= CONTAINER_WIDTH_THRESHOLD;
      setIsWideContainer((previous) =>
        previous === isWide ? previous : isWide
      );
    };
    const measureWidth = () => {
      setWidthState(actionsContainerElement.getBoundingClientRect().width);
    };

    measureWidth();
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setWidthState(entry.contentRect.width);
      }
    });

    observer.observe(actionsContainerElement);
    return () => observer.disconnect();
  }, [actionsContainerElement]);

  return {
    actionsContainerRef,
    isWideContainer,
    setActionsContainerRef,
  };
};
