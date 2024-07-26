import { AnimatePresence, motion } from "framer-motion";
import CommonAnimationHeight from "../../../../utils/animation/CommonAnimationHeight";
import DropListItemQuote from "./DropListItemQuote";
import { useEffect, useRef, useState } from "react";
import { Drop } from "../../../../../generated/models/Drop";

export default function DropListItemCreateQuote({
  drop,
  quotedPartId,
  onSuccessfulQuote,
}: {
  readonly drop: Drop;
  readonly quotedPartId: number | null;
  readonly onSuccessfulQuote: () => void;
}) {
  const [init, setInit] = useState(false);
  useEffect(() => setInit(true), []);
  const isOpen = quotedPartId !== null;
  const elemRef = useRef<HTMLDivElement | null>(null);

  const scrollIntoView = () => {
    if (!isOpen || !elemRef.current) {
      return;
    }
    elemRef.current.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  return (
    <div ref={elemRef}>
      <AnimatePresence mode="wait" initial={false}>
        {isOpen && (
          <motion.div
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
            <CommonAnimationHeight onAnimationCompleted={scrollIntoView}>
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
                  quotedDrop={drop}
                  quotedPartId={quotedPartId}
                  init={init}
                  onSuccessfulDrop={onSuccessfulQuote}
                />
              </motion.div>
            </CommonAnimationHeight>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
