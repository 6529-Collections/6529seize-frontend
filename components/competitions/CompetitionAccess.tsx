"use client";
import { ApiCompetitionLifecycle } from "@/generated/models/ApiCompetitionLifecycle";

import { ApiCompetitionType } from "@/generated/models/ApiCompetitionType";

import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/Auth";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import { getInlineGroupIdentityFromProfile } from "@/components/waves/create-wave/groups/createWaveInlineGroupBuilder";
import WaveGroupChangeDialog from "@/components/waves/specs/groups/group/edit/WaveGroupChangeDialog";
import WaveGroupEditButton from "@/components/waves/specs/groups/group/edit/buttons/subcomponents/WaveGroupEditButton";
import WaveGroupMembersScope from "@/components/waves/specs/groups/group/WaveGroupMembersScope";
import { WaveGroupType } from "@/components/waves/specs/groups/group/WaveGroup.types";
import { useCompetition } from "@/contexts/CompetitionContext";
import type { ApiCompetitionDraftInput } from "@/generated/models/ApiCompetitionDraftInput";
import type { ApiUpdateCompetitionRequest } from "@/generated/models/ApiUpdateCompetitionRequest";
import type { ApiCreateGroup } from "@/generated/models/ApiCreateGroup";
import type { ApiGroup } from "@/generated/models/ApiGroup";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import {
  isMultiCompetitionEnabled,
  newCompetitionRequestKey,
} from "@/helpers/competition.helpers";
import { useGroupMutations } from "@/hooks/groups/useGroupMutations";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  commonApiFetch,
  getStructuredApiErrorStatus,
} from "@/services/api/common-api";
import {
  competitionEndpoint,
  invalidateCompetition,
  updateCompetition,
} from "@/services/api/competitions-api";

export default function CompetitionAccess({
  type,
}: {
  readonly type: "participation" | "voting";
}) {
  const { competition, wave, hub } = useCompetition();
  const { requestAuth, setToast, connectedProfile } = useAuth();
  const client = useQueryClient();
  const locale = useBrowserLocale();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const version = useRef(competition.config_version);
  const pending = useRef<{
    groupId: string | null;
    request: ApiUpdateCompetitionRequest;
  } | null>(null);
  const { submit, isSubmitting } = useGroupMutations({ requestAuth });
  const groupId = competition[type].group_id;
  const groupQuery = useQuery({
    queryKey: [QueryKey.GROUP, groupId],
    queryFn: ({ signal }) =>
      commonApiFetch<ApiGroupFull>({
        endpoint: `groups/${encodeURIComponent(groupId ?? "")}`,
        signal,
      }),
    enabled: groupId !== null,
    staleTime: 60_000,
  });
  const group: ApiGroup | null =
    groupId === null
      ? null
      : {
          id: groupId,
          name: groupQuery.data?.name ?? "",
          is_hidden: !groupQuery.data,
          is_direct_message: groupQuery.data?.is_direct_message ?? false,
        };
  const editable =
    isMultiCompetitionEnabled() &&
    hub.legacy_primary_competition_id !== competition.id &&
    competition.permissions.administer &&
    (competition.lifecycle === ApiCompetitionLifecycle.Draft ||
      competition.lifecycle === ApiCompetitionLifecycle.Published);
  const groupLabel = t(
    locale,
    type === "participation"
      ? "waves.chatSettings.groups.drop"
      : "waves.chatSettings.groups.vote"
  );

  const reportError = (error: unknown) =>
    setToast({
      type: "error",
      message: t(
        locale,
        getStructuredApiErrorStatus(error) === 409
          ? "competitions.accessConflict"
          : "competitions.failure"
      ),
    });
  const changeGroup = async (next: ApiGroupFull | null): Promise<boolean> => {
    if (!editable || inFlight.current) return false;
    inFlight.current = true;
    setBusy(true);
    try {
      if (!(await requestAuth()).success) return false;
      const identity = { waveId: wave.id, competitionId: competition.id };
      const nextGroupId = next?.id ?? null;
      if (pending.current?.groupId !== nextGroupId) {
        const config = await commonApiFetch<ApiCompetitionDraftInput>({
          endpoint: `${competitionEndpoint(identity)}/configuration`,
          errorMode: "structured",
        });
        pending.current = {
          groupId: nextGroupId,
          request: {
            config_version: version.current,
            idempotency_key: newCompetitionRequestKey(),
            config: {
              ...config,
              [type]: {
                ...config[type],
                scope: { ...config[type].scope, group_id: nextGroupId },
              },
            },
          },
        };
      }
      await updateCompetition(identity, pending.current.request);
      pending.current = null;
      await invalidateCompetition(client, identity);
      setOpen(false);
      return true;
    } catch (error) {
      reportError(error);
      if (getStructuredApiErrorStatus(error) === 409) {
        await invalidateCompetition(client, {
          waveId: wave.id,
          competitionId: competition.id,
        });
      }
      return false;
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  const createGroup = async (payload: ApiCreateGroup) => {
    const result = await submit({
      payload,
      currentHandle: connectedProfile?.handle ?? null,
    });
    if (result.ok) return result.group;
    if (result.reason !== "auth") reportError(result.error);
    return null;
  };

  return (
    <div className="tw-flex tw-min-w-0 tw-items-center tw-justify-end tw-gap-2">
      {group ? (
        <WaveGroupMembersScope group={group} />
      ) : (
        t(locale, "competitions.everyone")
      )}
      {editable && (
        <span className="tw-shrink-0">
          <WaveGroupEditButton
            disabled={busy || isSubmitting}
            loading={busy}
            label={t(locale, "waves.create.groups.editAccess.triggerLabel", {
              groupLabel,
            })}
            onClick={() => {
              version.current = competition.config_version;
              pending.current = null;
              setOpen(true);
            }}
          />
        </span>
      )}
      {open && editable && (
        <WaveGroupChangeDialog
          wave={{
            ...wave,
            name: competition.title,
            wave: {
              ...wave.wave,
              type:
                competition.type === ApiCompetitionType.Rank
                  ? ApiWaveType.Rank
                  : ApiWaveType.Approve,
            },
          }}
          type={
            type === "participation" ? WaveGroupType.DROP : WaveGroupType.VOTE
          }
          currentGroup={group}
          defaultIncludedIdentity={getInlineGroupIdentityFromProfile(
            connectedProfile
          )}
          accessLabel={groupLabel}
          disabled={busy || isSubmitting}
          onClose={() => {
            if (!inFlight.current) setOpen(false);
          }}
          onGroupChange={changeGroup}
          onCreateGroup={createGroup}
        />
      )}
    </div>
  );
}
