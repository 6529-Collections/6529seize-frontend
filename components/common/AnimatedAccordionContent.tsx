import React, { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AnimatedAccordionContentProps {
  readonly isVisible: boolean;
  readonly children: ReactNode;
  readonly duration?: number;
}

export const AnimatedAccordionContent: React.FC<AnimatedAccordionContentProps> = ({
  isVisible,
  children,
  duration = 0.25,
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 1 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};