"use client";

import { DROPDOWN_TRIGGER_CLASSES, DROPDOWN_CHEVRON_CLASSES } from "@/components/utils/select/dropdown/dropdownTriggerStyles";
import AllowlistToolAnimationWrapper from "@/components/allowlist-tool/common/animation/AllowlistToolAnimationWrapper";
import type { DistributionPlanSnapshot } from "@/components/distribution-plan-tool/build-phases/build-phase/form/BuildPhaseFormConfigModal";
import { motion, useAnimate } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useClickAway, useKeyPressEvent } from "react-use";
import SelectSnapshotDropdownList from "./SelectSnapshotDropdownList";

export default function SelectSnapshotDropdown({
  snapshots,
  selectedSnapshot,
  setSelectedSnapshot,
}: {
  snapshots: DistributionPlanSnapshot[];
  selectedSnapshot: DistributionPlanSnapshot | null;
  setSelectedSnapshot: (snapshot: DistributionPlanSnapshot) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [iconScope, animateIcon] = useAnimate();
  const toggleOpen = () => setIsOpen(!isOpen);
  useEffect(() => {
    if (isOpen) {
      animateIcon(iconScope.current, { rotate: 180 });
    } else {
      animateIcon(iconScope.current, { rotate: 0 });
    }
  });

  const onSelect = (option: DistributionPlanSnapshot) => {
    setSelectedSnapshot(option);
    setIsOpen(false);
  };

  const listRef = useRef<HTMLDivElement>(null);
  useClickAway(listRef, () => setIsOpen(false));
  useKeyPressEvent("Escape", () => setIsOpen(false));

  const [title, setTitle] = useState("");

  useEffect(
    () => setTitle(selectedSnapshot?.name ?? "Select snapshot"),
    [selectedSnapshot]
  );
  return (
    <div ref={listRef}>
      <label
        id="listbox-label"
        className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-iron-100">
        Snapshot
      </label>
      <div className="tw-relative tw-mt-1.5">
        <button
          type="button"
          className={`${DROPDOWN_TRIGGER_CLASSES} tw-relative tw-flex tw-w-full tw-items-center tw-px-3.5 tw-py-3 tw-pr-9 tw-text-base tw-caret-primary-400 sm:tw-leading-6`}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-labelledby="listbox-label"
          onClick={(e) => {
            e.stopPropagation();
            toggleOpen();
          }}>
          <span className="tw-block tw-truncate">{title}</span>
          <span className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-right-0 tw-flex tw-items-center tw-pr-3.5">
            <svg
              ref={iconScope}
              className={DROPDOWN_CHEVRON_CLASSES}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path
                d="M6 9L12 15L18 9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>
        <AllowlistToolAnimationWrapper>
          {isOpen && (
            <motion.div
              className="tw-origin-top-right tw-absolute tw-right-0 tw-mt-1 tw-w-full tw-rounded-lg tw-shadow-xl tw-bg-iron-800 tw-ring-1 tw-ring-black tw-ring-opacity-5"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}>
              <SelectSnapshotDropdownList
                snapshots={snapshots}
                setSelectedSnapshot={onSelect}
                selectedSnapshot={selectedSnapshot}
              />
            </motion.div>
          )}
        </AllowlistToolAnimationWrapper>
      </div>
    </div>
  );
}
