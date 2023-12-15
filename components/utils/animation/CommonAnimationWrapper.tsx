import { AnimatePresence, AnimatePresenceProps } from "framer-motion";
import React from "react";

export default function CommonAnimationWrapper({
  children,
  mode = "wait",
  initial = false,
}: {
  readonly children: React.ReactNode;
  readonly mode?: AnimatePresenceProps["mode"];
  readonly initial?: AnimatePresenceProps["initial"];
}) {
  return (
    <AnimatePresence mode={mode} initial={initial}>
      {children}
    </AnimatePresence>
  );
}
