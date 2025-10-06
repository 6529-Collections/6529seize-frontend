import { motion, AnimatePresence } from "framer-motion";
import React from "react";
import BrainLeftSidebarSearchWaveDropdownContent from "./BrainLeftSidebarSearchWaveDropdownContent";
import { useWaves } from "@/hooks/useWaves";

interface BrainLeftSidebarSearchWaveDropdownProps {
  readonly open: boolean;
  readonly searchCriteria: string | null;
  readonly onClose: () => void;
  readonly listType: 'waves' | 'messages';
}
const BrainLeftSidebarSearchWaveDropdown: React.FC<
  BrainLeftSidebarSearchWaveDropdownProps
> = ({ open, searchCriteria, onClose, listType }) => {
  const { waves, isFetching } = useWaves({
    identity: null,
    waveName: searchCriteria,
    limit: 5,
    // we can't filter server-side, filtering done in content
  });

  return (
    <AnimatePresence mode="wait" initial={false}>
      {open && (
        <motion.div
          className="tw-absolute tw-z-10 tw-mt-1 tw-w-full tw-rounded-lg tw-shadow-xl tw-bg-iron-900 tw-ring-1 tw-ring-black tw-ring-opacity-5"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          <div className="tw-absolute tw-z-20 tw-mt-1 tw-overflow-hidden tw-w-full tw-rounded-xl tw-bg-iron-900 tw-shadow-lg tw-ring-1 tw-ring-inset tw-ring-white/10">
            <div className="tw-py-1 tw-flow-root tw-overflow-x-hidden tw-overflow-y-auto">
              <ul className="tw-flex tw-flex-col tw-gap-y-1 tw-px-2 tw-mx-0 tw-mb-0 tw-list-none">
                <BrainLeftSidebarSearchWaveDropdownContent
                  loading={isFetching}
                  waves={waves}
                  onClose={onClose}
                  listType={listType}
                />
              </ul>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BrainLeftSidebarSearchWaveDropdown;
