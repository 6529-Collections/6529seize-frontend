import { AnimatePresence, AnimatePresenceProps } from "framer-motion";
import React from "react";
import { getRandomObjectId } from "../../../../helpers/AllowlistToolHelpers";

export default function AllowlistToolAnimationWrapper({
  children,
  mode = "wait",
  initial = false,
}: {
  children: React.ReactNode;
  mode?: AnimatePresenceProps["mode"];
  initial?: AnimatePresenceProps["initial"];
}) {
  return (
    <AnimatePresence mode={mode} initial={initial} >
      {children}
    </AnimatePresence>
  );
}
