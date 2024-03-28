import { AnimatePresence, motion } from "framer-motion";
import { DropFull } from "../../../../../entities/IDrop";
import DropListItemDiscussion from "./DropListItemDiscussion";

export default function DropListItemDiscussionWrapper({
  drop,
  discussionOpen,
}: {
  readonly drop: DropFull;
  readonly discussionOpen: boolean;
}) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      {discussionOpen && (
        <motion.div
          key={drop.id}
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
          <DropListItemDiscussion />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
