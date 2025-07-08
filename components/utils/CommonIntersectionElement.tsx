"use client";

import { useEffect, useRef } from "react";
import { useIntersection } from "react-use";

export default function CommonIntersectionElement({
  onIntersection,
}: {
  readonly onIntersection: (state: boolean) => void;
}) {
  const elementRef = useRef<HTMLDivElement>(null);
  const intersection = useIntersection(
    elementRef as React.RefObject<HTMLElement>,
    {
      root: null,
      rootMargin: "0px",
      threshold: 1,
    }
  );

  useEffect(
    () => onIntersection(intersection?.isIntersecting ?? false),
    [intersection]
  );
  return <div ref={elementRef} />;
}
