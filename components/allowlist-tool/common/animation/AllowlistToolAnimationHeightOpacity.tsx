import { motion } from "framer-motion";

export default function AllowlistToolAnimationHeightOpacity({
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
      layout
      initial={{ height: "0", opacity: 0 }}
      animate={{
        height: "auto",
        opacity: 1,
        transition: {
          height: { duration: 0.3 },
          opacity: { duration: 0.3, delay: 0.3 },
        },
      }}
      exit={{
        height: "0",
        opacity: 0,
        transition: {
          opacity: { duration: 0 },
          height: { duration: 0.3 },
        },
      }}
      className={elementClasses}
      role={elementRole}
      onClick={onClicked}
    >
      {children}
    </motion.div>
  );
}
