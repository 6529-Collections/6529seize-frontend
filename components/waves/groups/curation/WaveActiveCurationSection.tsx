"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EllipsisHorizontalIcon } from "@heroicons/react/24/outline";
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
import {
  getWaveCurationsQueryKey,
  useWaveCurationGroups,
} from "@/hooks/waves/useWaveCurationGroups";
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

  const { data: curations = [] } = useWaveCurationGroups({
    waveId: wave.id,
    enabled: !!activeCurationId,
  });

  const activeCuration = useMemo(
    () =>
      curations.find((curation) => curation.id === activeCurationId) ?? null,
    [curations, activeCurationId]
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

  const removeActiveCurationFromUrl = () => {
    const params = new URLSearchParams(searchParams.toString() || "");
    params.delete("curation");
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
    onSuccess: () => {
      if (!activeCuration) {
        return;
      }

      queryClient.setQueryData<ApiWaveCuration[]>(
        getWaveCurationsQueryKey(wave.id),
        (current) =>
          current?.filter((item) => item.id !== activeCuration.id) ?? current
      );
      void queryClient.invalidateQueries({
        queryKey: getWaveCurationsQueryKey(wave.id),
      });
      setToast({
        type: "success",
        message: "Curation deleted.",
      });
      setIsDeleteOpen(false);
      removeActiveCurationFromUrl();
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Failed to delete curation.";
      setToast({
        type: "error",
        message,
      });
    },
  });

  const menuItems: CompactMenuItem[] = [
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

  if (!activeCurationId || !activeCuration) {
    return null;
  }

  return (
    <>
      <div className="tw-pb-4">
        <div className="tw-flex tw-items-start tw-justify-between tw-gap-x-6 tw-px-4 tw-pt-4">
          <div className="tw-min-w-0">
            <p className="tw-mb-1 tw-text-base tw-font-semibold tw-tracking-tight tw-text-iron-200">
              Curation
            </p>
            <p className="tw-mb-0 tw-truncate tw-text-sm tw-font-medium tw-text-iron-400">
              {activeCuration.name}
            </p>
          </div>

          {canManageCurations && (
            <CompactMenu
              triggerClassName="tw-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-300 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-100"
              trigger={<EllipsisHorizontalIcon className="tw-size-5" />}
              aria-label="Active curation options"
              items={menuItems}
              menuWidthClassName="tw-w-44"
            />
          )}
        </div>

        <div className="tw-mt-2 tw-flex tw-flex-col tw-gap-y-2 tw-px-4">
          <div className="tw-flex tw-h-6 tw-items-center tw-justify-between tw-text-sm">
            <span className="tw-font-medium tw-text-iron-500">Group</span>
            {activeGroup ? (
              <WaveGroupScope group={toScopeGroup(activeGroup)} />
            ) : (
              <span className="tw-max-w-40 tw-truncate tw-text-sm tw-font-medium tw-text-iron-200">
                {isFetchingActiveGroup ? "Loading..." : activeCuration.group_id}
              </span>
            )}
          </div>
        </div>
      </div>

      {isEditOpen && activeGroup && (
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
        message={`Delete "${activeCuration.name}" from this wave?`}
        confirmText="Delete"
        isConfirming={deleteMutation.isPending}
      />
    </>
  );
}
