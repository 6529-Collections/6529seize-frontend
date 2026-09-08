"use client";

import { useMemo } from "react";
import Image from "next/image";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import type { CreateDropConfig } from "@/entities/IDrop";
import type { CreateWaveConfig } from "@/types/waves.types";
import type { WaveRuleRow } from "@/helpers/waves/wave-rules.shared";
import { buildCreateWaveReview } from "@/helpers/waves/create-wave-review.helpers";
import { useAuth } from "@/components/auth/Auth";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useObjectUrl } from "@/hooks/useObjectUrl";
import { t } from "@/i18n/messages";
import WaveRulesPanel from "../../specs/WaveRulesPanel";
import CreateWaveRulesGroupMembers from "../rules/CreateWaveRulesGroupMembers";
import { getOnlyMeGroupDescription } from "../services/waveGroupService";
import CreateWaveStepHeader from "../utils/CreateWaveStepHeader";
import CreateWaveReviewDescription from "./CreateWaveReviewDescription";

export default function CreateWaveReview({
  config,
  groupsCache,
  description,
  parentWaveName,
}: {
  readonly config: CreateWaveConfig;
  readonly groupsCache: Readonly<Record<string, ApiGroupFull>>;
  readonly description: CreateDropConfig | null;
  readonly parentWaveName?: string | null | undefined;
}) {
  const locale = useBrowserLocale();
  const { connectedProfile } = useAuth();
  const picture = useObjectUrl(config.overview.image);
  const rules = useMemo(
    () =>
      buildCreateWaveReview({
        config,
        groupsCache,
        locale,
        parentWaveName,
      }),
    [config, groupsCache, locale, parentWaveName]
  );
  const groupIdsByRuleId: Readonly<Record<string, string | null>> = {
    "can-view": config.groups.canView,
    "can-drop": config.groups.canDrop,
    "can-vote": config.groups.canVote,
    "chat-access": config.groups.canChat,
    admin: config.groups.admin,
  };
  const renderRuleValue = (row: WaveRuleRow) => {
    const groupId = groupIdsByRuleId[row.id];
    if (row.id === "admin" && !groupId && connectedProfile?.primary_wallet) {
      return (
        <CreateWaveRulesGroupMembers
          target={{
            kind: "draft",
            group: getOnlyMeGroupDescription(connectedProfile.primary_wallet),
            name: row.value,
            summary: row.value,
          }}
          roleLabel={row.label}
        />
      );
    }
    if (!groupId) {
      return undefined;
    }
    return (
      <CreateWaveRulesGroupMembers
        groupId={groupId}
        cachedGroup={groupsCache[groupId]}
        roleLabel={row.label}
      />
    );
  };
  return (
    <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-y-6">
      <CreateWaveStepHeader
        title={t(locale, "waves.create.review.title")}
        description={t(locale, "waves.create.review.description")}
      />
      {picture && (
        <Image
          src={picture}
          alt={t(locale, "waves.create.review.picture")}
          width={80}
          height={80}
          unoptimized
          className="tw-size-20 tw-rounded-full tw-object-cover"
        />
      )}
      <WaveRulesPanel
        rules={rules}
        showTitle={false}
        variant="form"
        renderRowValue={renderRuleValue}
      />
      {description && <CreateWaveReviewDescription description={description} />}
    </div>
  );
}
