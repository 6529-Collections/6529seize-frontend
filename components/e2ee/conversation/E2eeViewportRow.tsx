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

/** Uses the regular timeline's measured-height primitive, without wave hydration. */
export function E2eeViewportRow({
  children,
  scrollRef,
  messageId,
  forceVisible = false,
  estimate = 96,
}: {
  readonly children: ReactNode;
  readonly scrollRef: RefObject<HTMLDivElement | null>;
  readonly messageId: string;
  readonly estimate?: number;
  readonly forceVisible?: boolean;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const near = useNearViewport(ref, "600px 0px", scrollRef);
  const [height, setHeight] = useState(estimate);
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
          root &&
          element.getBoundingClientRect().bottom <=
            root.getBoundingClientRect().top
        )
          root.scrollBy({ top: delta, behavior: "auto" });
        setHeight(value);
      },
    });
  }, [near, scrollRef]);
  return (
    <li
      ref={ref}
      role="presentation"
      data-e2ee-row={messageId}
      style={near || forceVisible ? undefined : { height }}
    >
      {near || forceVisible ? children : null}
    </li>
  );
}
