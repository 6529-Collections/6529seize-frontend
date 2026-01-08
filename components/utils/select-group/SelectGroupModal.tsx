"use client";

import { useEffect, useRef } from "react";
import { useClickAway, useKeyPressEvent } from "react-use";
import { createPortal } from "react-dom";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import SelectGroupSearchPanel from "./SelectGroupSearchPanel";
export default function SelectGroupModal({
  onClose,
  onGroupSelect,
}: {
  readonly onClose: () => void;
  readonly onGroupSelect: (group: ApiGroupFull) => void;
}) {
  const modalRef = useRef<HTMLDivElement>(null);
  const skipInitialOutsideClick = useRef(true);

  useEffect(() => {
    const timeout = globalThis.setTimeout(() => {
      skipInitialOutsideClick.current = false;
    }, 0);

    return () => {
      globalThis.clearTimeout(timeout);
    };
  }, []);

  useClickAway(modalRef, () => {
    if (skipInitialOutsideClick.current) {
      skipInitialOutsideClick.current = false;
      return;
    }

    onClose();
  });
  useKeyPressEvent("Escape", onClose);

  return createPortal(
    <div className="tw-relative tw-z-1000 tailwind-scope">
      <div className="tw-fixed tw-inset-0 tw-bg-gray-600 tw-bg-opacity-50"></div>
      <div className="tw-fixed tw-inset-0 tw-z-10 tw-overflow-y-auto">
        <div className="tw-flex tw-min-h-full tw-items-end tw-justify-center tw-text-center sm:tw-items-center tw-p-2 lg:tw-p-0">
          <div ref={modalRef}>
            <SelectGroupSearchPanel
              onClose={onClose}
              onGroupSelect={onGroupSelect}
            />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
