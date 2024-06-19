import { useState } from "react";
import { DropPart } from "../../../../../../generated/models/DropPart";
import { AnimatePresence, motion } from "framer-motion";
import CommonAnimationHeight from "../../../../../utils/animation/CommonAnimationHeight";

export default function DropPartDiscussionWrapper({
  dropPart,
  isDiscussionOpen,
  children,
}: {
  readonly dropPart: DropPart;
  readonly isDiscussionOpen: boolean;
  readonly children: React.ReactNode;
}) {
  const [animatingDiscussion, setAnimatingDiscussion] = useState(false);
  return (
    <AnimatePresence mode="wait" initial={false}>
      {isDiscussionOpen && (
        <motion.div
          key={dropPart.part_id}
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
        >
          <CommonAnimationHeight>
            <motion.div
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
                transition: {
                  duration: 0.3,
                },
              }}
              exit={{
                opacity: 0,
                transition: {
                  duration: 0.3,
                },
              }}
              onAnimationStart={() => setAnimatingDiscussion(true)}
              onAnimationComplete={() => setAnimatingDiscussion(false)}
            >
              {children}
            </motion.div>
          </CommonAnimationHeight>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
