import { motion } from "framer-motion";
import React from "react";

interface Props {
  children: React.ReactNode;
  elementClasses?: string | undefined;
  elementRole?: string | undefined;
  onClicked?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}

export default function CommonAnimationOpacity(props: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={props.elementClasses}
      role={props.elementRole}
      onClick={props.onClicked}
    >
      {props.children}
    </motion.div>
  );
}
