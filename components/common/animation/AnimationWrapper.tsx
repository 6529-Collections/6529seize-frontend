import { AnimatePresence, AnimatePresenceProps } from "framer-motion";

export default function AnimationWrapper({
  children,
  mode = "wait",
  initial = false,
}: {
  children: React.ReactNode;
  mode?: AnimatePresenceProps["mode"];
  initial?: AnimatePresenceProps["initial"];
}) {
  return (
    <AnimatePresence mode={mode} initial={initial}>
      {children}
    </AnimatePresence>
  );
}
