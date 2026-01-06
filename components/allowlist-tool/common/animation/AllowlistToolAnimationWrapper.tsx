import type { AnimatePresenceProps } from "framer-motion";
import { AnimatePresence } from "framer-motion";
import React from "react";

export default function AllowlistToolAnimationWrapper({
  children,
  mode = "wait",
  initial = false,
}: {
  children: React.ReactNode;
  mode?: AnimatePresenceProps["mode"] | undefined;
  initial?: AnimatePresenceProps["initial"] | undefined;
}) {
  return (
    <AnimatePresence mode={mode} initial={initial} >
      {children}
    </AnimatePresence>
  );
}
