"use client";

import { Fragment, useContext, useRef, useState } from "react";
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
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
} from "@headlessui/react";

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
    <Menu as="div" className="tw-relative">
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
      <MenuButton className="tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-size-7 tw-border-0 tw-bg-transparent tw-text-iron-300 hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-200 tw-transition tw-duration-300 tw-ease-out">
        <span className="tw-sr-only">Group options</span>
        <Cog6ToothIcon className="tw-size-5 tw-flex-shrink-0" />
      </MenuButton>
      <Transition
        as={Fragment}
        enter="tw-transition tw-duration-150 tw-ease-out"
        enterFrom="tw-opacity-0 tw-translate-y-1"
        enterTo="tw-opacity-100 tw-translate-y-0"
        leave="tw-transition tw-duration-100 tw-ease-in"
        leaveFrom="tw-opacity-100 tw-translate-y-0"
        leaveTo="tw-opacity-0 tw-translate-y-1">
        <MenuItems
          anchor="bottom end"
          className="tw-z-50 tw-w-40 tw-rounded-lg tw-bg-iron-900 tw-py-1 tw-shadow-lg tw-ring-1 tw-ring-white/10 focus:tw-outline-none">
          <div className="tw-flex tw-flex-col">
            <MenuItem>
              {({ close }) => (
                <button
                  type="button"
                  onClick={() => {
                    close();
                    openEditRef.current?.();
                  }}
                  className="tw-flex tw-w-full tw-items-center tw-gap-x-2 tw-rounded-md tw-bg-transparent tw-px-3 tw-py-2 tw-text-left tw-text-sm tw-font-semibold tw-text-iron-200 hover:tw-bg-iron-800 tw-transition tw-duration-200 tw-ease-out">
                  Change group
                </button>
              )}
            </MenuItem>
            {haveGroup && type !== WaveGroupType.ADMIN && (
              <MenuItem>
                {({ close }) => (
                  <button
                    type="button"
                    onClick={() => {
                      close();
                      openRemoveRef.current?.();
                    }}
                    className="tw-flex tw-w-full tw-items-center tw-gap-x-2 tw-rounded-md tw-bg-transparent tw-px-3 tw-py-2 tw-text-left tw-text-sm tw-font-semibold tw-text-red hover:tw-bg-iron-800 tw-transition tw-duration-200 tw-ease-out">
                    Remove group
                  </button>
                )}
              </MenuItem>
            )}
          </div>
        </MenuItems>
      </Transition>
    </Menu>
  );
}
