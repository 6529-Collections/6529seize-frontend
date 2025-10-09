"use client";

import { classNames } from "@/helpers/Helpers";
import type { XtdhView } from "./filters/types";

interface XtdhViewSwitcherProps {
  readonly view: XtdhView;
  readonly onViewChange: (nextView: XtdhView) => void;
}

export default function XtdhViewSwitcher({
  view,
  onViewChange,
}: Readonly<XtdhViewSwitcherProps>) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-3 lg:tw-flex-row lg:tw-items-center lg:tw-justify-between">
      <div className="tw-inline-flex tw-overflow-hidden tw-rounded-lg tw-border tw-border-iron-800">
        <button
          type="button"
          className={classNames(
            "tw-px-4 tw-py-2 tw-text-sm tw-font-semibold",
            view === "collections"
              ? "tw-bg-primary-500 tw-text-iron-50"
              : "tw-bg-transparent tw-text-iron-200 hover:tw-bg-iron-800"
          )}
          onClick={() => onViewChange("collections")}
          aria-pressed={view === "collections"}
        >
          Collections
        </button>
        <button
          type="button"
          className={classNames(
            "tw-px-4 tw-py-2 tw-text-sm tw-font-semibold",
            view === "tokens"
              ? "tw-bg-primary-500 tw-text-iron-50"
              : "tw-bg-transparent tw-text-iron-200 hover:tw-bg-iron-800"
          )}
          onClick={() => onViewChange("tokens")}
          aria-pressed={view === "tokens"}
        >
          Tokens
        </button>
      </div>
      <p className="tw-text-sm tw-text-iron-300 tw-m-0">
        Discover where xTDH is flowing and how communities allocate influence.
      </p>
    </div>
  );
}
