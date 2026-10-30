"use client";

import { useEffect } from "react";
import CommonTabs from "@/components/utils/select/tabs/CommonTabs";
import type { ApiCreateGroupDescription } from "@/generated/models/ApiCreateGroupDescription";
import { ApiGroupBeneficiaryGrantMatchMode } from "@/generated/models/ApiGroupBeneficiaryGrantMatchMode";
import type { ApiXTdhGrant } from "@/generated/models/ApiXTdhGrant";
import { ApiXTdhGrantTargetTokenMode } from "@/generated/models/ApiXTdhGrantTargetTokenMode";

export const DEFAULT_BENEFICIARY_GRANT_MATCH_MODE =
  ApiGroupBeneficiaryGrantMatchMode.AnyToken;

const MATCH_MODE_OPTIONS = [
  {
    key: ApiGroupBeneficiaryGrantMatchMode.AnyToken,
    value: ApiGroupBeneficiaryGrantMatchMode.AnyToken,
    label: "Own any",
  },
  {
    key: ApiGroupBeneficiaryGrantMatchMode.AllTokens,
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
  quiet = false,
}: {
  readonly grant: ApiXTdhGrant | null | undefined;
  readonly matchMode: ApiCreateGroupDescription["is_beneficiary_of_grant_match_mode"];
  readonly setMatchMode: (
    matchMode: ApiCreateGroupDescription["is_beneficiary_of_grant_match_mode"]
  ) => void;
  readonly className?: string | undefined;
  readonly quiet?: boolean;
}) {
  const normalizedMode = matchMode ?? DEFAULT_BENEFICIARY_GRANT_MATCH_MODE;

  if (!grant) {
    return null;
  }

  if (!supportsAllTokensGrantMatchMode(grant)) {
    if (grant.target_token_mode !== ApiXTdhGrantTargetTokenMode.All) {
      return null;
    }

    return (
      <div
        className={`${quiet ? "" : "tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-iron-900/60 tw-p-3"} ${
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
      className={`${quiet ? "tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-2" : "tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-iron-900/60 tw-p-3"} ${
        className ?? ""
      }`.trim()}
    >
      <span
        className={`tw-text-[11px] tw-uppercase tw-tracking-wide tw-text-iron-500 ${quiet ? "tw-font-medium" : "tw-mb-2 tw-block tw-font-semibold"}`}
      >
        Token requirement
      </span>
      <div
        data-group-criteria-tabs
        className="tw-w-fit tw-min-w-0 tw-max-w-full"
      >
        <CommonTabs<ApiGroupBeneficiaryGrantMatchMode>
          items={MATCH_MODE_OPTIONS}
          activeItem={normalizedMode}
          setSelected={setMatchMode}
          filterLabel="Token requirement"
          fill={false}
          size="sm"
        />
      </div>
    </div>
  );
}
