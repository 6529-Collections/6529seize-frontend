"use client";

import { useLayout } from "@/components/brain/my-stream/layout/LayoutContext";
import { SingleWaveDrop } from "@/components/waves/drop/SingleWaveDrop";
import { DropSize } from "@/helpers/waves/drop.helpers";
import { useDropModal } from "@/hooks/useDropModal";
import { useEffect } from "react";

export default function UserPageDropModal() {
  const { activeDrop, isDropOpen, onDropClose } = useDropModal();
  const { spaces } = useLayout();

  useEffect(() => {
    if (!isDropOpen) {
      return;
    }

    const { body, documentElement } = document;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyOverscrollBehavior = body.style.overscrollBehavior;
    const previousHtmlOverflow = documentElement.style.overflow;
    const previousHtmlOverscrollBehavior = documentElement.style.overscrollBehavior;

    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";
    documentElement.style.overflow = "hidden";
    documentElement.style.overscrollBehavior = "none";

    return () => {
      body.style.overflow = previousBodyOverflow;
      body.style.overscrollBehavior = previousBodyOverscrollBehavior;
      documentElement.style.overflow = previousHtmlOverflow;
      documentElement.style.overscrollBehavior = previousHtmlOverscrollBehavior;
    };
  }, [isDropOpen]);

  if (!isDropOpen || !activeDrop) return null;

  const extendedDrop = {
    type: DropSize.FULL as const,
    ...activeDrop,
    stableKey: activeDrop.id,
    stableHash: activeDrop.id,
  };

  return (
    <div
      className="tw-fixed tw-bottom-0 tw-left-[var(--left-rail,0px)] tw-right-0 tw-z-[49] tw-overflow-hidden tw-overscroll-none tw-bg-iron-950 tailwind-scope"
      style={{
        top: spaces.headerSpace,
        height: `calc(100dvh - ${spaces.headerSpace}px)`,
        maxHeight: `calc(100dvh - ${spaces.headerSpace}px)`,
      }}
    >
      <SingleWaveDrop drop={extendedDrop} onClose={onDropClose} />
    </div>
  );
}
