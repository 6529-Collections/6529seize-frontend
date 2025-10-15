"use client";

import { useContext, useRef, useState } from "react";
import { ApiWave } from "@/generated/models/ApiWave";
import { WaveGroupType } from "../WaveGroup";
import { useMutation } from "@tanstack/react-query";
import { commonApiPost } from "@/services/api/common-api";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { AuthContext } from "@/components/auth/Auth";
import WaveGroupEditButton from "./WaveGroupEditButton";
import WaveGroupRemoveButton from "./WaveGroupRemoveButton";
import { ApiUpdateWaveRequest } from "@/generated/models/ApiUpdateWaveRequest";
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";
import { CompactMenu } from "@/components/common/CompactMenu";

export default function WaveGroupEditButtons({
  haveGroup,
  wave,
  type,
}: {
  readonly haveGroup: boolean;
  readonly wave: ApiWave;
  readonly type: WaveGroupType;
}) {
  const { setToast, requestAuth } = useContext(AuthContext);
  const { onWaveCreated } = useContext(ReactQueryWrapperContext);
  const [mutating, setMutating] = useState(false);
  const openEditRef = useRef<(() => void) | null>(null);
  const openRemoveRef = useRef<(() => void) | null>(null);

  const editWaveMutation = useMutation({
    mutationFn: async (body: ApiUpdateWaveRequest) =>
      await commonApiPost<ApiUpdateWaveRequest, ApiWave>({
        endpoint: `waves/${wave.id}`,
        body,
      }),
    onSuccess: () => {
      onWaveCreated();
    },
    onError: (error) => {
      setToast({
        message: error as unknown as string,
        type: "error",
      });
    },
    onSettled: () => {
      setMutating(false);
    },
  });

  const onEdit = async (body: ApiUpdateWaveRequest) => {
    setMutating(true);
    const { success } = await requestAuth();
    if (!success) {
      setToast({
        type: "error",
        message: "Failed to authenticate",
      });
      setMutating(false);
      return;
    }
    await editWaveMutation.mutateAsync(body);
  };

  if (mutating) {
    return <CircleLoader />;
  }

  if (!haveGroup || type === WaveGroupType.ADMIN) {
    openRemoveRef.current = null;
  }

  return (
    <div className="tw-relative">
      <div className="tw-hidden">
        <WaveGroupEditButton
          wave={wave}
          type={type}
          onEdit={onEdit}
          renderTrigger={({ open }) => {
            openEditRef.current = open;
            return null;
          }}
        />
        {haveGroup && type !== WaveGroupType.ADMIN && (
          <WaveGroupRemoveButton
            wave={wave}
            type={type}
            onEdit={onEdit}
            renderTrigger={({ open }) => {
              openRemoveRef.current = open;
              return null;
            }}
          />
        )}
      </div>
      <CompactMenu
        triggerClassName="tw-flex tw-size-7 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-300 desktop-hover:hover:tw-text-iron-200 hover:tw-bg-iron-800 tw-transition tw-duration-300 tw-ease-out"
        trigger={() => (
          <>
            <span className="tw-sr-only">Group options</span>
            <Cog6ToothIcon className="tw-size-5 tw-flex-shrink-0" />
          </>
        )}
        aria-label="Group options"
        itemsWrapperClassName="tw-flex tw-flex-col"
        unstyledItems
        itemClassName="tw-flex tw-items-center tw-gap-x-2 tw-rounded-md tw-px-3 tw-py-2 tw-text-left tw-text-sm tw-font-semibold tw-transition tw-duration-200 tw-ease-out"
        focusItemClassName="tw-bg-iron-800 tw-text-iron-50"
        items={[
          {
            id: "change",
            label: "Change group",
            onSelect: () => {
              openEditRef.current?.();
            },
            className:
              "tw-text-iron-200 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-50",
          },
          ...(haveGroup && type !== WaveGroupType.ADMIN
            ? [
                {
                  id: "remove",
                  label: "Remove group",
                  onSelect: () => {
                    openRemoveRef.current?.();
                  },
                  className:
                    "tw-text-red desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-red",
                } as const,
              ]
            : []),
        ]}
      />
    </div>
  );
}
