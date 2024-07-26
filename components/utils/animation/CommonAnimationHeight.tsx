import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

export default function CommonAnimationHeight({
  className,
  children,
  onAnimationCompleted,
}: {
  readonly children: React.ReactNode;
  readonly className?: string;
  readonly onAnimationCompleted?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState<number | "auto">("auto");

  useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        // We only have one entry, so we can use entries[0].
        const observedHeight = entries[0].contentRect.height;
        setHeight(observedHeight);
      });

      resizeObserver.observe(containerRef.current);

      return () => {
        // Cleanup the observer when the component is unmounted
        resizeObserver.disconnect();
      };
    }
  }, []);

  return (
    <motion.div
      className={`${className} tw-overflow-hidden `}
      style={{ height }}
      animate={{ height }}
      transition={{ duration: 0.3 }}
      onAnimationComplete={onAnimationCompleted}
    >
      <div ref={containerRef}>{children}</div>
    </motion.div>
  );
}
