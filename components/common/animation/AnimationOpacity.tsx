import { motion } from "framer-motion";

export default function AnimationOpacity({
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