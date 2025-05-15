import React, {
  useState,
  useRef,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { DropSize } from "../../../helpers/waves/drop.helpers";
import { useMyStream } from "../../../contexts/wave/MyStreamContext";

/**
 * Props for VirtualScrollWrapper
 */
interface VirtualScrollWrapperProps {
  /**
   * A manual delay in milliseconds to wait after media loads
   * before measuring (to account for any last-minute layout changes).
   */
  readonly delay?: number;

  readonly scrollContainerRef: React.RefObject<HTMLDivElement | null>;

  readonly dropSerialNo: number;
  readonly waveId: string;
  readonly type: DropSize;

  /**
   * The child components to be rendered or virtualized.
   */
  readonly children: ReactNode;
}

/**
 * VirtualScrollWrapper (TypeScript version)
 *
 * Wraps children, measuring their rendered height once all child media
 * (images/videos) are loaded. When out of the viewport, it replaces
 * the children with an empty <div> that maintains layout by having
 * the same measured height.
 *
 * Usage Example:
 * ---------------
 * <VirtualScrollWrapper delay={500}>
 *   <p>
 *     This block of content will only fully render when in the viewport.
 *   </p>
 *   <img src="https://via.placeholder.com/600x200" alt="Example" />
 *   <p>
 *     Scroll down so this content leaves the viewport. It will be replaced
 *     by a placeholder <div> of the same height.
 *   </p>
 * </VirtualScrollWrapper>
 */
export default function VirtualScrollWrapper({
  delay = 1000,
  scrollContainerRef,
  children,
  dropSerialNo,
  waveId,
  type,
}: VirtualScrollWrapperProps) {
  const { fetchAroundSerialNo } = useMyStream();

  /**
   * isInView: Tracks if the component is currently in the viewport.
   */
  const [isInView, setIsInView] = useState<boolean>(true);

  /**
   * measuredHeight: Holds the current measured height of the content.
   * If null, it means we haven't measured the content yet.
   */
  const [measuredHeight, setMeasuredHeight] = useState<number | null>(null);

  /**
   * containerRef: Reference to the top-level container element
   * to measure size, observe media, and attach an IntersectionObserver.
   */
  const containerRef = useRef<HTMLDivElement | null>(null);

  /**
   * measureHeight: Uses getBoundingClientRect to measure the
   * rendered height of the container element.
   */
  const measureHeight = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMeasuredHeight(rect.height);
    }
  }, []);

  /**
   * Once all media are loaded, optionally wait the provided `delay`
   * before measuring the height. This allows any final reflows or
   * async changes to settle.
   */
  useEffect(() => {
    if (type === DropSize.LIGHT) return;
    const timer = setTimeout(() => {
      measureHeight();
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, measureHeight]);

  /**
   * Intersection Observer to track if the element is in the viewport.
   * - If the component is about to leave the viewport, measure its
   *   height one more time (to capture possible changes).
   * - Update isInView state accordingly.
   */
  useEffect(() => {
    // Avoid running Intersection Observer on the server
    if (typeof window === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const inView = entry.isIntersecting;
        if (!inView && containerRef.current && type !== DropSize.LIGHT) {
          // If leaving viewport, measure height in case content changed
          measureHeight();
        }
        if (inView !== isInView) {
          setIsInView(inView);
        }
        if (inView && type === DropSize.LIGHT) {
          fetchAroundSerialNo(waveId, dropSerialNo);
        }
      },
      {
        // For a reversed layout, we need a large margin at both top and bottom
        // This ensures elements are detected well before they enter/leave the viewport
        // Using a large value for both directions ensures smooth operation in both regular and reversed layouts
        rootMargin: "1500px 0px 1500px 0px",
        threshold: 0.0,
        root: scrollContainerRef.current,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    // Cleanup observer on unmount
    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [isInView, measureHeight]);

  /**
   * Determine if we should render the actual children
   * or just the placeholder.
   *
   * 1. On server side (Next.js SSR), always render children.
   * 2. If in viewport, render children.
   * 3. If out of viewport, render a placeholder <div> with
   *    the same measured height.
   * 4. If we haven't measured yet (measuredHeight === null),
   *    also render children so we can measure them.
   */
  const isServer = typeof window === "undefined";
  const shouldRenderChildren = isServer || isInView || measuredHeight === null;

  return (
    <div ref={containerRef}>
      {shouldRenderChildren ? (
        children
      ) : (
        <div
          style={{
            height: measuredHeight ?? "auto",
          }}
        />
      )}
    </div>
  );
}
