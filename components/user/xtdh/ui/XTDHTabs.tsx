"use client";

import Link from "next/link";
import { XtdhInnerTab } from "../types";

export default function XTDHTabs({
  active,
  basePath,
}: {
  readonly active: XtdhInnerTab;
  readonly basePath: string; // e.g. "/alice/xtdh"
}) {
  const tabs = [
    { id: XtdhInnerTab.OVERVIEW, label: "Overview", slug: "overview" },
    { id: XtdhInnerTab.GIVEN, label: "Given", slug: "given" },
    { id: XtdhInnerTab.RECEIVED, label: "Received", slug: "received" },
    { id: XtdhInnerTab.HISTORY, label: "History", slug: "history" },
  ];
  return (
    <div className="tw-flex tw-gap-2 tw-flex-wrap">
      {tabs.map((t) => (
        <Link
          key={t.id}
          href={`${basePath}/${t.slug}`}
          className={`tw-text-sm tw-rounded tw-border tw-px-3 tw-py-1 tw-transition ${
            active === t.id
              ? "tw-bg-primary-600 tw-border-primary-600 tw-text-white"
              : "tw-bg-iron-900 tw-border-iron-700 tw-text-iron-200 hover:tw-bg-iron-800"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
