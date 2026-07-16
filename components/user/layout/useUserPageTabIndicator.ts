"use client";

import { useCallback, useState, type RefObject } from "react";

type ActiveIndicator = {
  readonly left: number;
  readonly width: number;
  readonly visible: boolean;
};

const HIDDEN_ACTIVE_INDICATOR: ActiveIndicator = {
  left: 0,
  width: 0,
  visible: false,
};

export function useUserPageTabIndicator(
  contentContainerRef: RefObject<HTMLDivElement | null>
) {
  const [activeIndicator, setActiveIndicator] = useState<ActiveIndicator>(
    HIDDEN_ACTIVE_INDICATOR
  );

  const updateActiveIndicator = useCallback(() => {
    const activeLink =
      contentContainerRef.current?.querySelector<HTMLElement>(
        '[aria-current="page"]'
      );

    if (!activeLink) {
      setActiveIndicator((current) =>
        current.visible ? HIDDEN_ACTIVE_INDICATOR : current
      );
      return;
    }

    const nextIndicator = {
      left: activeLink.offsetLeft,
      width: activeLink.offsetWidth,
      visible: true,
    };
    setActiveIndicator((current) =>
      current.left === nextIndicator.left &&
      current.width === nextIndicator.width &&
      current.visible
        ? current
        : nextIndicator
    );
  }, [contentContainerRef]);

  return { activeIndicator, updateActiveIndicator };
}
