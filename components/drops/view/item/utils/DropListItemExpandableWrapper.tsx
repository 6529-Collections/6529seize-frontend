import { AnimatePresence, motion } from "framer-motion";
import { DropFull } from "../../../../../entities/IDrop";
import { RepActionExpandable } from "../DropsListItem";
import DropListItemDiscussion from "../discussion/DropListItemDiscussion";
import DropListItemQuote from "../quote/DropListItemQuote";
import CommonAnimationHeight from "../../../../utils/animation/CommonAnimationHeight";
import { useEffect, useState } from "react";

export default function DropListItemExpandableWrapper({
  drop,
  state,
  setState,
}: {
  readonly drop: DropFull;
  readonly state: RepActionExpandable;
  readonly setState: (newState: RepActionExpandable) => void;
}) {
  const [init, setInit] = useState(false);
  useEffect(() => setInit(true), []);
  const open = state !== RepActionExpandable.IDLE;
  const component: Record<RepActionExpandable, JSX.Element> = {
    [RepActionExpandable.DISCUSSION]: <DropListItemDiscussion />,
    [RepActionExpandable.QUOTE]: (
      <DropListItemQuote
        quotedDropId={drop.id}
        init={init}
        onSuccessfulDrop={() => setState(RepActionExpandable.IDLE)}
      />
    ),
    [RepActionExpandable.IDLE]: <></>,
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
              key={state}
            >
              {component[state]}
            </motion.div>
          </CommonAnimationHeight>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
