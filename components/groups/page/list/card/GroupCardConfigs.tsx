"use client";

import { useState } from "react";
import { GroupDescriptionType } from "@/entities/IGroup";
import type { ApiGroupDescription } from "@/generated/models/ApiGroupDescription";
import { ApiGroupBeneficiaryGrantMatchMode } from "@/generated/models/ApiGroupBeneficiaryGrantMatchMode";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { ApiGroupTdhInclusionStrategy } from "@/generated/models/ApiGroupTdhInclusionStrategy";
import { ApiXTdhGrantStatus } from "@/generated/models/ApiXTdhGrantStatus";
import { ApiXTdhGrantTargetTokenMode } from "@/generated/models/ApiXTdhGrantTargetTokenMode";
import { toShortGrantId } from "@/components/groups/page/create/config/xtdh-grant/utils";
import { getGroupNftOwnershipCardSummary } from "@/helpers/groups/group-nft-ownership";
import { useGroupCriteriaIdentityLabels } from "@/hooks/useGroupCriteriaIdentityLabels";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import GroupCardConfigsScroller from "./GroupCardConfigsScroller";
import { getGroupCardIdentityValue } from "./group-card-config-identity";

export interface GroupCardConfigProps {
  readonly key: GroupDescriptionType;
  readonly value: string;
  readonly label?: string | undefined;
  readonly tooltip?: string | undefined;
  readonly muted?: boolean | undefined;
}

const MANUAL_LIST_TOOLTIP =
  "Wallets explicitly listed in this group. Filter-matching wallets are not counted here.";

const GRANT_TOOLTIP =
  "Identity must be a beneficiary of the selected xTDH grant.";

const GRANT_STATUS_LABELS: Record<ApiXTdhGrantStatus, string> = {
  [ApiXTdhGrantStatus.Pending]: "PENDING",
  [ApiXTdhGrantStatus.Failed]: "FAILED",
  [ApiXTdhGrantStatus.Disabled]: "REVOKED",
  [ApiXTdhGrantStatus.Granted]: "GRANTED",
};

const getGrantModeLabel = (
  groupDescription: ApiGroupDescription
): string | null => {
  if (
    groupDescription.is_beneficiary_of_grant_match_mode ===
    ApiGroupBeneficiaryGrantMatchMode.AllTokens
  ) {
    return "All specified tokens";
  }

  const grant = groupDescription.is_beneficiary_of_grant;
  if (!grant) {
    return null;
  }

  return grant.target_token_mode === ApiXTdhGrantTargetTokenMode.All
    ? "Any collection token"
    : "Any specified token";
};

export default function GroupCardConfigs({
  group,
}: {
  readonly group?: ApiGroupFull | undefined;
}) {
  const [nowMs] = useState<number>(() => Date.now());
  const identityLabels = useGroupCriteriaIdentityLabels(group?.group);

  const getMinMaxValue = ({
    min,
    max,
  }: {
    readonly min: number | null;
    readonly max: number | null;
  }): string | null => {
    if (min === null && max === null) {
      return null;
    }
    if (min === null) {
      return `<= ${max}`;
    }
    if (max === null) {
      return `>= ${min}`;
    }
    return `${min} - ${max}`;
  };

  const getTdhConfig = (
    tdh: ApiGroupDescription["tdh"]
  ): GroupCardConfigProps | null => {
    const value = getMinMaxValue({ min: tdh.min, max: tdh.max });
    if (!value) {
      return null;
    }
    let label = "Tdh";
    if (tdh.inclusion_strategy === ApiGroupTdhInclusionStrategy.Xtdh) {
      label = "xTDH";
    } else if (tdh.inclusion_strategy === ApiGroupTdhInclusionStrategy.Both) {
      label = "TDH + xTDH";
    }

    return {
      key: GroupDescriptionType.TDH,
      value,
      label,
    };
  };

  const getRepConfig = (
    rep: ApiGroupDescription["rep"]
  ): GroupCardConfigProps | null => {
    const value = getMinMaxValue({ min: rep.min, max: rep.max });
    const category =
      typeof rep.category?.length === "number" && rep.category.length > 0
        ? `category: ${rep.category}`
        : null;
    const identity = getGroupCardIdentityValue({
      identity: rep.user_identity,
      direction: rep.direction,
      identityLabels,
    });
    const parts = [value, category, identity].filter(Boolean);
    if (!parts.length) {
      return null;
    }
    return {
      key: GroupDescriptionType.REP,
      value: parts.join(", "),
    };
  };

  const getCicConfig = (
    cic: ApiGroupDescription["cic"]
  ): GroupCardConfigProps | null => {
    const value = getMinMaxValue({ min: cic.min, max: cic.max });
    const identity = getGroupCardIdentityValue({
      identity: cic.user_identity,
      direction: cic.direction,
      identityLabels,
    });
    const parts = [value, identity].filter(Boolean);
    if (!parts.length) {
      return null;
    }

    return {
      key: GroupDescriptionType.NIC,
      value: parts.join(", "),
    };
  };

  const getLevelConfig = (
    level: ApiGroupDescription["level"]
  ): GroupCardConfigProps | null => {
    const value = getMinMaxValue({ min: level.min, max: level.max });
    if (!value) {
      return null;
    }
    return {
      key: GroupDescriptionType.LEVEL,
      value,
    };
  };

  const getNftsConfig = (
    owns_nfts: ApiGroupDescription["owns_nfts"]
  ): GroupCardConfigProps | null => {
    if (!owns_nfts.length) {
      return null;
    }

    const value = owns_nfts
      .map((nft) => getGroupNftOwnershipCardSummary(nft))
      .join(", ");

    return {
      key: GroupDescriptionType.OWNS_NFTS,
      value,
      tooltip: t(DEFAULT_LOCALE, "groups.nftOwnership.card.tooltip"),
    };
  };

  const getWalletsConfig = (
    wallet_group_wallets_count: ApiGroupDescription["identity_group_identities_count"]
  ): GroupCardConfigProps => {
    const hasManualList = wallet_group_wallets_count > 0;

    return {
      key: GroupDescriptionType.WALLETS,
      value: hasManualList ? `${wallet_group_wallets_count}` : "No manual list",
      label: "Manual list",
      tooltip: MANUAL_LIST_TOOLTIP,
      muted: !hasManualList,
    };
  };

  const getGrantStatusLabel = (
    grant: ApiGroupDescription["is_beneficiary_of_grant"]
  ): string | null => {
    if (grant?.status === undefined) {
      return null;
    }

    if (grant.status === ApiXTdhGrantStatus.Granted) {
      const from = grant.valid_from ?? null;
      const to = grant.valid_to ?? null;

      if (typeof to === "number" && to > 0 && to < nowMs) {
        return "ENDED";
      }
      if (typeof from === "number" && from > nowMs) {
        return "SCHEDULED";
      }
      return "ACTIVE";
    }

    return GRANT_STATUS_LABELS[grant.status];
  };

  const getGrantConfig = (
    groupDescription: ApiGroupDescription
  ): GroupCardConfigProps | null => {
    const grantId = groupDescription.is_beneficiary_of_grant_id;
    if (!grantId) {
      return null;
    }

    const statusLabel = getGrantStatusLabel(
      groupDescription.is_beneficiary_of_grant
    );
    const shortGrantId = toShortGrantId(grantId);
    const grantModeLabel = getGrantModeLabel(groupDescription);
    const grantValue = statusLabel
      ? `${statusLabel} (${shortGrantId})`
      : shortGrantId;
    const value = grantModeLabel
      ? `${grantValue} · ${grantModeLabel}`
      : grantValue;

    return {
      key: GroupDescriptionType.XTDH_GRANT,
      value,
      label: "Grant",
      tooltip: GRANT_TOOLTIP,
    };
  };

  const getConfigs = (): GroupCardConfigProps[] => {
    if (!group) {
      return [
        {
          key: GroupDescriptionType.WALLETS,
          value: "No manual list",
          label: "Manual list",
          tooltip: MANUAL_LIST_TOOLTIP,
          muted: true,
        },
      ];
    }
    const configs: GroupCardConfigProps[] = [];
    const { tdh, rep, cic, level, owns_nfts, identity_group_identities_count } =
      group.group;
    const tdhConfig = getTdhConfig(tdh);
    const repConfig = getRepConfig(rep);
    const cicConfig = getCicConfig(cic);
    const levelConfig = getLevelConfig(level);
    const nftsConfig = getNftsConfig(owns_nfts);
    const grantConfig = getGrantConfig(group.group);
    const walletsConfig = getWalletsConfig(identity_group_identities_count);
    if (tdhConfig) configs.push(tdhConfig);
    if (repConfig) configs.push(repConfig);
    if (cicConfig) configs.push(cicConfig);
    if (levelConfig) configs.push(levelConfig);
    if (nftsConfig) configs.push(nftsConfig);
    if (grantConfig) configs.push(grantConfig);
    configs.push(walletsConfig);

    return configs;
  };

  const configs = getConfigs();
  return <GroupCardConfigsScroller configs={configs} />;
}
