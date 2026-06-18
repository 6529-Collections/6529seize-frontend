"use client";

import clsx from "clsx";
import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/24/outline";
import { CompactMenu, type CompactMenuItem } from "@/components/compact-menu";
import { useAuth } from "@/components/auth/Auth";
import MyStreamWaveCurationCreateDialog from "@/components/brain/my-stream/tabs/MyStreamWaveCurationCreateDialog";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import CommonConfirmationModal from "@/components/utils/modal/CommonConfirmationModal";
import type { ApiGroup } from "@/generated/models/ApiGroup";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveCuration } from "@/generated/models/ApiWaveCuration";
import WaveGroupScope from "@/components/waves/specs/groups/group/WaveGroupScope";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import type { DropCurationMembership } from "@/hooks/drops/useDropCurations";
import {
  getWaveCurationsQueryKey,
  useWaveCurations,
} from "@/hooks/waves/useWaveCurations";
import { useWaveCurationReorderMutation } from "@/hooks/waves/useWaveCurationReorderMutation";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { commonApiDelete, commonApiFetch } from "@/services/api/common-api";

const toScopeGroup = (group: ApiGroupFull): ApiGroup => ({
  id: group.id,
  name: group.name,
  author: group.created_by,
  is_hidden: !group.visible,
  is_direct_message: group.is_direct_message ?? false,
});

export default function WaveActiveCurationSection({
  wave,
}: {
  readonly wave: ApiWave;
}) {
  const { isApp } = useDeviceInfo();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { requestAuth, setToast } = useAuth();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const activeCurationId = searchParams.get("curation");
  const canManageCurations =
    wave.wave.authenticated_user_eligible_for_admin === true;
  const shouldLoadCurations = isApp || activeCurationId !== null;

  const { data: curations = [] } = useWaveCurations({
    waveId: wave.id,
    enabled: shouldLoadCurations,
  });
  const {
    moveCuration,
    isPending: isCurationReorderPending,
    pendingCurationId,
  } = useWaveCurationReorderMutation({ waveId: wave.id });
  const resolvedActiveCurationId =
    activeCurationId ?? (isApp ? (curations[0]?.id ?? null) : null);

  const activeCuration = useMemo(
    () =>
      curations.find((curation) => curation.id === resolvedActiveCurationId) ??
      null,
    [curations, resolvedActiveCurationId]
  );
  const activeCurationIndex = useMemo(
    () =>
      resolvedActiveCurationId
        ? curations.findIndex(
            (curation) => curation.id === resolvedActiveCurationId
          )
        : -1,
    [curations, resolvedActiveCurationId]
  );
  const activeGroupId = activeCuration?.group_id ?? null;

  const { data: activeGroup, isFetching: isFetchingActiveGroup } =
    useQuery<ApiGroupFull>({
      queryKey: [QueryKey.GROUP, activeGroupId],
      queryFn: async () => {
        if (!activeGroupId) {
          throw new Error("No active group selected.");
        }

        return await commonApiFetch<ApiGroupFull>({
          endpoint: `groups/${activeGroupId}`,
        });
      },
      enabled: !!activeGroupId,
      staleTime: 5 * 60 * 1000,
    });

  const setSelectedCuration = (curationId: string | null) => {
    const params = new URLSearchParams(searchParams.toString() || "");

    if (curationId) {
      params.set("curation", curationId);
    } else {
      params.delete("curation");
    }

    const nextQuery = params.toString();
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    router.replace(nextUrl, { scroll: false });
  };

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!activeCuration) {
        throw new Error("No active curation selected.");
      }

      const auth = await requestAuth();
      if (!auth.success) {
        throw new Error("Authentication was cancelled.");
      }

      await commonApiDelete({
        endpoint: `waves/${wave.id}/curations/${activeCuration.id}`,
      });
    },
    onSuccess: async () => {
      if (!activeCuration) {
        return;
      }

      queryClient.setQueryData<ApiWaveCuration[]>(
        getWaveCurationsQueryKey(wave.id),
        (current) =>
          current?.filter((item) => item.id !== activeCuration.id) ?? current
      );
      queryClient.setQueriesData<DropCurationMembership[]>(
        { queryKey: ["drop-curations"] },
        (current) =>
          current?.filter((item) => item.id !== activeCuration.id) ?? current
      );
      await queryClient.invalidateQueries({
        queryKey: getWaveCurationsQueryKey(wave.id),
      });
      await queryClient.invalidateQueries({
        queryKey: ["drop-curations"],
      });
      setToast({
        type: "success",
        message: "Curation deleted.",
      });
      setIsDeleteOpen(false);
      setSelectedCuration(null);
    },
    onError: (error) => {
      setToast({
        type: "error",
        title: "Couldn't delete this curation.",
        description: "Please try again.",
        details: getToastErrorDetails(error, "Could not delete curation."),
      });
    },
  });

  const canMoveActiveCuration =
    canManageCurations && activeCuration !== null && curations.length > 1;
  const activeCurationIsReordering = activeCuration
    ? pendingCurationId === activeCuration.id
    : false;
  const moveActiveCuration = (direction: "previous" | "next") => {
    if (!activeCuration) {
      return;
    }

    if (!activeCurationId) {
      setSelectedCuration(activeCuration.id);
    }

    moveCuration({
      curation: activeCuration,
      direction,
      curations,
    });
  };

  const menuItems: CompactMenuItem[] = [
    ...(canMoveActiveCuration
      ? [
          {
            id: "move-up",
            label: "Move up",
            icon: <ArrowUpIcon className="tw-size-4" />,
            disabled: activeCurationIndex <= 0 || isCurationReorderPending,
            onSelect: () => moveActiveCuration("previous"),
          },
          {
            id: "move-down",
            label: "Move down",
            icon: <ArrowDownIcon className="tw-size-4" />,
            disabled:
              activeCurationIndex < 0 ||
              activeCurationIndex >= curations.length - 1 ||
              isCurationReorderPending,
            onSelect: () => moveActiveCuration("next"),
          },
        ]
      : []),
    {
      id: "edit",
      label: "Edit curation",
      onSelect: () => setIsEditOpen(true),
      disabled: !activeGroup,
    },
    {
      id: "delete",
      label: "Delete curation",
      onSelect: () => setIsDeleteOpen(true),
      className: "tw-text-red desktop-hover:hover:tw-text-red",
    },
  ];

  if (!isApp && (!activeCurationId || !activeCuration)) {
    return null;
  }

  const desktopActiveCuration = isApp ? null : activeCuration;

  return (
    <>
      {isApp ? (
        curations.length > 0 && (
          <div className="tw-pb-4">
            <div className="tw-flex tw-items-start tw-justify-between tw-gap-x-6 tw-px-4 tw-pt-4">
              <p className="tw-mb-0 tw-text-base tw-font-semibold tw-tracking-tight tw-text-iron-200">
                Curation
              </p>
            </div>

            <div className="tw-mt-2 tw-flex tw-flex-col tw-gap-y-1 tw-px-4">
              {curations.map((curation) => {
                const isActive = curation.id === resolvedActiveCurationId;

                return (
                  <div
                    key={curation.id}
                    className={clsx(
                      "tw-rounded-xl tw-border tw-border-solid tw-transition-colors tw-duration-200",
                      isActive
                        ? "tw-border-iron-800 tw-bg-iron-950/70"
                        : "tw-border-transparent"
                    )}
                  >
                    <div className="tw-flex tw-items-center">
                      <button
                        type="button"
                        onClick={() => setSelectedCuration(curation.id)}
                        className={clsx(
                          "tw-flex tw-h-10 tw-min-w-0 tw-flex-1 tw-items-center tw-rounded-xl tw-border-0 tw-bg-transparent tw-px-4 tw-text-left tw-transition-colors tw-duration-200",
                          isActive
                            ? "tw-text-iron-50"
                            : "tw-text-iron-300 desktop-hover:hover:tw-bg-iron-900/55 desktop-hover:hover:tw-text-iron-100"
                        )}
                        aria-pressed={isActive}
                      >
                        <span
                          className={clsx(
                            "tw-min-w-0 tw-flex-1 tw-truncate tw-text-sm tw-leading-tight",
                            isActive ? "tw-font-semibold" : "tw-font-medium"
                          )}
                        >
                          {curation.name}
                        </span>
                      </button>

                      {isActive && canManageCurations && (
                        <CompactMenu
                          triggerClassName="tw-mr-1 tw-flex tw-size-8 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-300 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-100"
                          trigger={
                            <EllipsisHorizontalIcon className="tw-size-5" />
                          }
                          aria-label="Active curation options"
                          items={menuItems}
                          menuWidthClassName="tw-w-44"
                          disabled={activeCurationIsReordering}
                        />
                      )}
                    </div>

                    {isActive && (
                      <div className="tw-flex tw-min-h-6 tw-items-center tw-justify-between tw-gap-x-4 tw-pb-2.5 tw-pl-4 tw-pr-4 tw-text-sm">
                        <span className="tw-font-medium tw-text-iron-500">
                          Group
                        </span>
                        {activeGroup ? (
                          <WaveGroupScope group={toScopeGroup(activeGroup)} />
                        ) : (
                          <span className="tw-max-w-40 tw-truncate tw-text-sm tw-font-medium tw-text-iron-200">
                            {isFetchingActiveGroup
                              ? "Loading..."
                              : activeCuration?.group_id}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )
      ) : (
        <div className="tw-pb-4">
          <div className="tw-flex tw-items-start tw-justify-between tw-gap-x-6 tw-px-4 tw-pt-4">
            <div className="tw-min-w-0">
              <p className="tw-mb-1 tw-text-base tw-font-semibold tw-tracking-tight tw-text-iron-200">
                Curation
              </p>
              <p className="tw-mb-0 tw-truncate tw-text-sm tw-font-medium tw-text-iron-400">
                {desktopActiveCuration?.name}
              </p>
            </div>
          </div>

          <div className="tw-mt-2 tw-flex tw-flex-col tw-gap-y-2 tw-px-4">
            <div className="tw-flex tw-h-6 tw-items-center tw-justify-between tw-text-sm">
              <span className="tw-font-medium tw-text-iron-500">Group</span>
              {activeGroup ? (
                <WaveGroupScope group={toScopeGroup(activeGroup)} />
              ) : (
                <span className="tw-max-w-40 tw-truncate tw-text-sm tw-font-medium tw-text-iron-200">
                  {isFetchingActiveGroup
                    ? "Loading..."
                    : desktopActiveCuration?.group_id}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {isEditOpen && activeCuration && activeGroup && (
        <MyStreamWaveCurationCreateDialog
          key={`${activeCuration.id}:${activeGroup.id}`}
          wave={wave}
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onSaved={() => undefined}
          curation={activeCuration}
          initialGroup={activeGroup}
        />
      )}

      <CommonConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete curation"
        message={
          activeCuration
            ? `Delete "${activeCuration.name}" from this wave?`
            : "Delete this curation from this wave?"
        }
        confirmText="Delete"
        isConfirming={deleteMutation.isPending}
      />
    </>
  );
}
