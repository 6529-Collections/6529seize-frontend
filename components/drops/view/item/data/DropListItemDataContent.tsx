import { AnimatePresence, motion } from "framer-motion";
import DropListItemDataContentProfiles from "./DropListItemDataContentProfiles";
import DropListItemDataContentMetadata from "./DropListItemDataContentMetadata";
import { Drop } from "../../../../../generated/models/Drop";

export default function DropListItemDataContent({
  open,
  drop,
}: {
  readonly open: boolean;
  readonly drop: Drop;
}) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      {open && (
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
          <div className="tw-space-y-1">
            {!!drop.mentioned_users.length && (
              <DropListItemDataContentProfiles
                profiles={drop.mentioned_users}
              />
            )}
            {!!drop.metadata.length && (
              <DropListItemDataContentMetadata metadata={drop.metadata} />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
