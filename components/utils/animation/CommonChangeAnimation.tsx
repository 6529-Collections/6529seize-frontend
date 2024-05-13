import { motion } from "framer-motion";
import CommonAnimationWrapper from "./CommonAnimationWrapper";

export default function CommonChangeAnimation({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <CommonAnimationWrapper>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{
          opacity: 1,
          transition: {
            opacity: { duration: 0.3 },
            ease: "easeInOut",
          },
        }}
        exit={{
          opacity: 0,
          transition: {
            opacity: { duration: 0.3 },
            ease: "easeInOut",
          },
        }}
      >
        {children}
      </motion.div>
    </CommonAnimationWrapper>
  );
}
