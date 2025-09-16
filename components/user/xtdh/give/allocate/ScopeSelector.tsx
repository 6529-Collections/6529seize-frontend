"use client";

import type { XtdhTargetScope } from "../../types";

export default function ScopeSelector({
  scope,
  onChange,
}: {
  readonly scope: XtdhTargetScope;
  readonly onChange: (s: XtdhTargetScope) => void;
}) {
  return (
    <div className="tw-flex tw-gap-3 tw-flex-wrap">
      {(["COLLECTION", "TOKENS"] as XtdhTargetScope[]).map((s) => (
        <label key={s} className="tw-flex tw-items-center tw-gap-2 tw-text-iron-200 tw-text-sm">
          <input type="radio" name="xtdh-scope" checked={scope === s} onChange={() => onChange(s)} />
          {s === "COLLECTION" ? "Whole collection" : "Specific tokens"}
        </label>
      ))}
    </div>
  );
}

