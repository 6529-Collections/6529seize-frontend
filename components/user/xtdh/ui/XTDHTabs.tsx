"use client";

import { XtdhInnerTab } from "../types";

export default function XTDHTabs({
  active,
  onChange,
}: {
  readonly active: XtdhInnerTab;
  readonly onChange: (tab: XtdhInnerTab) => void;
}) {
  const tabs = [
    { id: XtdhInnerTab.OVERVIEW, label: "Overview" },
    { id: XtdhInnerTab.GIVEN, label: "Given" },
    { id: XtdhInnerTab.RECEIVED, label: "Received" },
    { id: XtdhInnerTab.HISTORY, label: "History" },
  ];
  return (
    <div className="tw-flex tw-gap-2 tw-flex-wrap">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`tw-text-sm tw-rounded tw-border tw-px-3 tw-py-1 tw-transition ${
            active === t.id
              ? "tw-bg-primary-600 tw-border-primary-600 tw-text-white"
              : "tw-bg-iron-900 tw-border-iron-700 tw-text-iron-200 hover:tw-bg-iron-800"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
