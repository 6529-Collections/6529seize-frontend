import { useState } from "react";
import { DropFull } from "../../../../../entities/IDrop";
import DropListItemDiscussion from "../discussion/DropListItemDiscussion";
import { ProfileActivityLogType } from "../../../../../entities/IProfile";
import { AnimatePresence, motion } from "framer-motion";
import CommonAnimationHeight from "../../../../utils/animation/CommonAnimationHeight";
import { DropDiscussionExpandableState } from "../DropsListItem";

export default function DropListItemLogsWrapper({
  drop,
  discussionExpandableState,
}: {
  readonly drop: DropFull;
  readonly discussionExpandableState: DropDiscussionExpandableState;
}) {
  const open = discussionExpandableState !== DropDiscussionExpandableState.IDLE;
  const [animating, setAnimating] = useState(false);
  const component: Record<DropDiscussionExpandableState, JSX.Element> = {
    [DropDiscussionExpandableState.DISCUSSION]: (
      <DropListItemDiscussion
        drop={drop}
        initialFilter={ProfileActivityLogType.DROP_COMMENT}
        animating={animating}
      />
    ),
    [DropDiscussionExpandableState.RATES]: (
      <DropListItemDiscussion
        drop={drop}
        initialFilter={ProfileActivityLogType.DROP_REP_EDIT}
        animating={animating}
      />
    ),
    [DropDiscussionExpandableState.IDLE]: <></>,
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      {open && (
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
              onAnimationStart={() => setAnimating(true)}
              onAnimationComplete={() => setAnimating(false)}
              key={discussionExpandableState}
            >
              {component[discussionExpandableState]}
            </motion.div>
          </CommonAnimationHeight>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
