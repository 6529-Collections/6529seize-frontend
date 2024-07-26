import { motion } from "framer-motion";
import React from "react";

export default function AllowlistToolAnimationOpacity({
  children,
  elementClasses = "",
  elementRole,
  onClicked = () => undefined,
}: {
  children: React.ReactNode;
  elementClasses?: string | undefined;
  elementRole?: string | undefined;
  onClicked?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={elementClasses}
      role={elementRole}
      onClick={onClicked}
    >
      {children}
    </motion.div>
  );
}
