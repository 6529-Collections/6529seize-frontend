"use client";

import { useEffect, useId } from "react";
import type { ApiCreateGroupDescription } from "@/generated/models/ApiCreateGroupDescription";
import { ApiGroupBeneficiaryGrantMatchMode } from "@/generated/models/ApiGroupBeneficiaryGrantMatchMode";
import type { ApiXTdhGrant } from "@/generated/models/ApiXTdhGrant";
import { ApiXTdhGrantTargetTokenMode } from "@/generated/models/ApiXTdhGrantTargetTokenMode";

export const DEFAULT_BENEFICIARY_GRANT_MATCH_MODE =
  ApiGroupBeneficiaryGrantMatchMode.AnyToken;

const MATCH_MODE_OPTIONS = [
  {
    value: ApiGroupBeneficiaryGrantMatchMode.AnyToken,
    label: "Own any",
  },
  {
    value: ApiGroupBeneficiaryGrantMatchMode.AllTokens,
    label: "Own all",
  },
] as const;

const supportsAllTokensGrantMatchMode = (
  grant: ApiXTdhGrant | null | undefined
): boolean => grant?.target_token_mode === ApiXTdhGrantTargetTokenMode.Include;

export const getGrantCompatibleMatchMode = (
  grant: ApiXTdhGrant | null | undefined,
  matchMode:
    | ApiCreateGroupDescription["is_beneficiary_of_grant_match_mode"]
    | undefined
): ApiGroupBeneficiaryGrantMatchMode => {
  const normalizedMode = matchMode ?? DEFAULT_BENEFICIARY_GRANT_MATCH_MODE;
  if (!supportsAllTokensGrantMatchMode(grant)) {
    return DEFAULT_BENEFICIARY_GRANT_MATCH_MODE;
  }
  return normalizedMode;
};

export const useCompatibleXtdhGrantMatchMode = ({
  grant,
  hasSelectedGrant,
  isLookupFresh,
  matchMode,
  setMatchMode,
}: {
  readonly grant: ApiXTdhGrant | null | undefined;
  readonly hasSelectedGrant: boolean;
  readonly isLookupFresh: boolean;
  readonly matchMode: ApiCreateGroupDescription["is_beneficiary_of_grant_match_mode"];
  readonly setMatchMode: (
    matchMode: ApiCreateGroupDescription["is_beneficiary_of_grant_match_mode"]
  ) => void;
}): ApiGroupBeneficiaryGrantMatchMode => {
  const effectiveMatchMode = matchMode ?? DEFAULT_BENEFICIARY_GRANT_MATCH_MODE;

  useEffect(() => {
    if (!hasSelectedGrant) {
      if (effectiveMatchMode !== DEFAULT_BENEFICIARY_GRANT_MATCH_MODE) {
        setMatchMode(DEFAULT_BENEFICIARY_GRANT_MATCH_MODE);
      }
      return;
    }

    if (!isLookupFresh || !grant) {
      return;
    }

    const compatibleMode = getGrantCompatibleMatchMode(
      grant,
      effectiveMatchMode
    );
    if (compatibleMode !== effectiveMatchMode) {
      setMatchMode(compatibleMode);
    }
  }, [
    effectiveMatchMode,
    grant,
    hasSelectedGrant,
    isLookupFresh,
    setMatchMode,
  ]);

  return effectiveMatchMode;
};

export default function GroupCreateXtdhGrantMatchMode({
  grant,
  matchMode,
  setMatchMode,
  className,
}: {
  readonly grant: ApiXTdhGrant | null | undefined;
  readonly matchMode: ApiCreateGroupDescription["is_beneficiary_of_grant_match_mode"];
  readonly setMatchMode: (
    matchMode: ApiCreateGroupDescription["is_beneficiary_of_grant_match_mode"]
  ) => void;
  readonly className?: string | undefined;
}) {
  const normalizedMode = matchMode ?? DEFAULT_BENEFICIARY_GRANT_MATCH_MODE;
  const tokenRequirementLabelId = useId();

  if (!grant) {
    return null;
  }

  if (!supportsAllTokensGrantMatchMode(grant)) {
    if (grant.target_token_mode !== ApiXTdhGrantTargetTokenMode.All) {
      return null;
    }

    return (
      <div
        className={`tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-iron-900/60 tw-p-3 ${
          className ?? ""
        }`.trim()}
      >
        <p className="tw-m-0 tw-text-xs tw-font-medium tw-text-iron-400">
          Full-collection grants match holders of at least one collection token.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-iron-900/60 tw-p-3 ${
        className ?? ""
      }`.trim()}
    >
      <span
        id={tokenRequirementLabelId}
        className="tw-mb-2 tw-block tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-500"
      >
        Token requirement
      </span>
      <div
        role="group"
        aria-labelledby={tokenRequirementLabelId}
        className="tw-flex tw-flex-wrap tw-gap-2"
      >
        {MATCH_MODE_OPTIONS.map((option) => {
          const isActive = normalizedMode === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isActive}
              onClick={() => setMatchMode(option.value)}
              className={`tw-rounded-md tw-border tw-border-solid tw-px-2.5 tw-py-1.5 tw-text-xs tw-font-semibold tw-outline-none tw-transition tw-duration-200 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 ${
                isActive
                  ? "tw-border-primary-400 tw-bg-primary-400/20 tw-text-primary-300"
                  : "tw-border-iron-700 tw-bg-iron-950 tw-text-iron-300 desktop-hover:hover:tw-border-iron-600 desktop-hover:hover:tw-bg-iron-900"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
