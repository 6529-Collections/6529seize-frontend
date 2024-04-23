import { motion } from "framer-motion";
import CommonAnimationWrapper from "./CommonAnimationWrapper";
import { getRandomObjectId } from "../../../helpers/AllowlistToolHelpers";

export default function CommonChangeAnimation({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const key = getRandomObjectId();
  return (
    <CommonAnimationWrapper>
      <motion.div
        key={key}
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
