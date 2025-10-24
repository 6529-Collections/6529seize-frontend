"use client";

import { useKeyPressEvent } from "react-use";
import { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import SelectGroupSearchPanel from "./SelectGroupSearchPanel";

export default function SelectGroupInlinePanel({
  onClose,
  onGroupSelect,
}: {
  readonly onClose: () => void;
  readonly onGroupSelect: (group: ApiGroupFull) => void;
}) {
  useKeyPressEvent("Escape", onClose);

  return (
    <div className="tw-relative tw-w-full">
      <SelectGroupSearchPanel
        onClose={onClose}
        onGroupSelect={onGroupSelect}
        containerClassName="tw-w-full tw-rounded-xl tw-bg-iron-900 tw-border tw-border-iron-800 tw-text-left tw-shadow-xl tw-transition-all tw-duration-300 tw-pb-6"
        bodyClassName="tw-h-64 tw-overflow-y-auto tw-mt-4 tw-px-4"
      />
    </div>
  );
}
