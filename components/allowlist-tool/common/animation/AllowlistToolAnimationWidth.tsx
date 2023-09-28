import { motion } from "framer-motion";

export default function AllowlistToolAnimationWidth({
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
      initial={{ width: 0 }}
      animate={{
        width: '20rem'
      }}
      exit={{
        width: 0
      }}
      className={elementClasses}
      role={elementRole}
      onClick={onClicked}
    >
      {children}
    </motion.div>
  );
}
