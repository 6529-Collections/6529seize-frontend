"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { useNearViewport } from "@/hooks/useNearViewport";
import { observeHeight } from "@/helpers/observeHeight";
import { getMessageDomId } from "./E2eeMessageItem";

/** Uses the regular timeline's measured-height primitive, without wave hydration. */
export function E2eeViewportRow({
  children,
  scrollRef,
  messageId,
  forceVisible = false,
  restoreAnchor,
  position,
  setSize,
  estimate = 96,
}: {
  readonly children: ReactNode;
  readonly scrollRef: RefObject<HTMLDivElement | null>;
  readonly messageId: string;
  readonly estimate?: number;
  readonly forceVisible?: boolean;
  readonly restoreAnchor: () => boolean;
  readonly position: number;
  readonly setSize: number;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const near = useNearViewport(ref, "600px 0px", scrollRef);
  const [height, setHeight] = useState(estimate);
  const [focused, setFocused] = useState(false);
  const visible = near || forceVisible || focused;
  const heightRef = useRef(estimate);
  useEffect(() => {
    const element = ref.current;
    if (!element || !near) return;
    return observeHeight(element, {
      updateHeight: (value) => {
        if (value <= 0) return;
        const delta = value - heightRef.current;
        heightRef.current = value;
        const root = scrollRef.current;
        if (
          !restoreAnchor() &&
          root &&
          element.getBoundingClientRect().bottom <=
            root.getBoundingClientRect().top
        )
          root.scrollBy({ top: delta, behavior: "auto" });
        setHeight(value);
      },
    });
  }, [near, scrollRef, restoreAnchor]);
  return (
    <li
      ref={ref}
      role="listitem"
      id={getMessageDomId(messageId)}
      tabIndex={-1}
      aria-hidden={visible ? undefined : true}
      aria-posinset={position}
      aria-setsize={setSize}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setFocused(false);
      }}
      data-e2ee-row={messageId}
      data-e2ee-mounted={visible ? "" : undefined}
      style={visible ? undefined : { height }}
    >
      {visible ? children : null}
    </li>
  );
}
