import { AnimatePresence } from "framer-motion";
import React from "react";

import type { AnimatePresenceProps } from "framer-motion";

export default function CommonAnimationWrapper({
  children,
  mode = "wait",
  initial = false,
}: {
  readonly children: React.ReactNode;
  readonly mode?: AnimatePresenceProps["mode"] | undefined;
  readonly initial?: AnimatePresenceProps["initial"] | undefined;
}) {
  return (
    <AnimatePresence mode={mode} initial={initial}>
      {children}
    </AnimatePresence>
  );
}
