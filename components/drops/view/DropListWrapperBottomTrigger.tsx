import { useEffect, useRef } from "react";
import { useIntersection } from "react-use";

export default function DropListWrapperBottomTrigger({
  onBottomIntersection,
}: {
  readonly onBottomIntersection: (state: boolean) => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const bottomIntersection = useIntersection(bottomRef, {
    root: null,
    rootMargin: "0px",
    threshold: 1,
  });

  useEffect(
    () => onBottomIntersection(bottomIntersection?.isIntersecting ?? false),
    [bottomIntersection]
  );
  return <div ref={bottomRef} />;
}