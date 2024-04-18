import { AnimatePresence, motion } from "framer-motion";
import CommonAnimationHeight from "../../../../utils/animation/CommonAnimationHeight";
import DropListItemQuote from "./DropListItemQuote";
import { DropFull } from "../../../../../entities/IDrop";
import { useEffect, useState } from "react";

export default function DropListItemCreateQuote({
  drop,
  isOpen,
  setIsOpen,
}: {
  readonly drop: DropFull;
  readonly isOpen: boolean;
  readonly setIsOpen: (newState: boolean) => void;
}) {
  const [init, setInit] = useState(false);
  useEffect(() => setInit(true), []);
  return (
    <AnimatePresence mode="wait" initial={false}>
      {isOpen && (
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
            >
              <DropListItemQuote
                quotedDropId={drop.id}
                init={init}
                onSuccessfulDrop={() => setIsOpen(false)}
              />
            </motion.div>
          </CommonAnimationHeight>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
