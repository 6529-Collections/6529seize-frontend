"use client";

import type { XtdhSelectedTarget } from "../../types";

export default function TargetSummary({ target }: { readonly target: XtdhSelectedTarget | null }) {
  if (!target) return null;
  const tokenCount = target.scope === "TOKENS" ? target.tokenIds.length : undefined;
  return (
    <div className="tw-text-iron-300 tw-text-xs tw-border tw-border-iron-800 tw-rounded tw-p-3">
      <div className="tw-flex tw-flex-wrap tw-gap-x-3 tw-gap-y-1">
        <span>
          <span className="tw-text-iron-400">Chain:</span> {target.chain}
        </span>
        <span>
          <span className="tw-text-iron-400">Contract:</span> {target.contractAddress}
        </span>
        <span>
          <span className="tw-text-iron-400">Standard:</span> {target.standard}
        </span>
        <span>
          <span className="tw-text-iron-400">Scope:</span> {target.scope}
        </span>
        {tokenCount != null && (
          <span>
            <span className="tw-text-iron-400">Tokens:</span> {tokenCount}
          </span>
        )}
      </div>
    </div>
  );
}

