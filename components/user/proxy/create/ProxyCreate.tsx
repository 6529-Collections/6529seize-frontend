"use client";

import { ProxyMode } from "../UserPageProxy";
import { CommunityMemberMinimal } from "../../../../entities/IProfile";
import ProxyCreateTargetSearch from "./target/ProxyCreateTargetSearch";
import { useMutation } from "@tanstack/react-query";
import { ApiCreateNewProfileProxy } from "../../../../generated/models/ApiCreateNewProfileProxy";
import { commonApiPost } from "../../../../services/api/common-api";
import { ApiProfileProxy } from "../../../../generated/models/ApiProfileProxy";
import { useContext, useState } from "react";
import { AuthContext } from "../../../auth/Auth";
import { ReactQueryWrapperContext } from "../../../react-query-wrapper/ReactQueryWrapper";
import ProxyCreateAction from "../proxy/create-action/ProxyCreateAction";

export default function ProxyCreate({
  profileProxies,
  onModeChange,
}: {
  readonly profileProxies: ApiProfileProxy[];
  readonly onModeChange: (mode: ProxyMode) => void;
}) {
  const { requestAuth, setToast } = useContext(AuthContext);
  const { setProfileProxy, onProfileProxyModify } = useContext(
    ReactQueryWrapperContext
  );
  const [submitting, setSubmitting] = useState(false);
  const [newProfileProxy, setNewProfileProxy] =
    useState<ApiProfileProxy | null>(null);

  const createProxyMutation = useMutation({
    mutationFn: async (body: ApiCreateNewProfileProxy) => {
      return await commonApiPost<ApiCreateNewProfileProxy, ApiProfileProxy>({
        endpoint: `proxies`,
        body,
      });
    },
    onSuccess: (result) => {
      setNewProfileProxy(result);
    },
    onError: (error) => {
      setToast({
        message: error as unknown as string,
        type: "error",
      });
    },
    onSettled: () => {
      setSubmitting(false);
    },
  });

  const alreadyProxied = (
    target: CommunityMemberMinimal
  ): ApiProfileProxy | null =>
    profileProxies?.find(
      (proxy) =>
        proxy.granted_to.handle?.toLowerCase() === target.handle?.toLowerCase()
    ) ?? null;

  const onTargetSelect = async (target: CommunityMemberMinimal | null) => {
    if (!target?.profile_id) {
      setNewProfileProxy(null);
      return;
    }
    const existingProxy = alreadyProxied(target);
    if (existingProxy) {
      setNewProfileProxy(existingProxy);
      return;
    }
    setSubmitting(true);
    const { success } = await requestAuth();
    if (!success) {
      setSubmitting(false);
      return;
    }
    await createProxyMutation.mutateAsync({ target_id: target.profile_id });
  };

  const onActionCreated = () => {
    if (
      !newProfileProxy?.granted_to?.handle ||
      !newProfileProxy?.created_by?.handle
    ) {
      return;
    }
    setProfileProxy(newProfileProxy);
    onProfileProxyModify({
      profileProxyId: newProfileProxy.id,
      grantedToHandle: newProfileProxy.granted_to.handle,
      createdByHandle: newProfileProxy.created_by.handle,
    });
    onModeChange(ProxyMode.LIST);
  };

  return (
    <div>
      <div className="tw-mb-4">
        <button
          onClick={() => onModeChange(ProxyMode.LIST)}
          disabled={submitting}
          type="button"
          className="tw-py-2 tw-px-2 -tw-ml-2 tw-flex tw-items-center tw-gap-x-2 tw-justify-center tw-text-sm tw-font-semibold tw-border-0 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out tw-cursor-pointer tw-text-iron-400 tw-bg-transparent hover:tw-text-iron-50">
          <svg
            className="tw-flex-shrink-0 tw-w-5 tw-h-5"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg">
            <path
              d="M20 12H4M4 12L10 18M4 12L10 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"></path>
          </svg>
          <span>Back</span>
        </button>
      </div>
      <ProxyCreateTargetSearch
        profileProxy={newProfileProxy}
        loading={submitting}
        onTargetSelect={onTargetSelect}
      />
      <div className="tw-mt-6">
        {newProfileProxy && (
          <ProxyCreateAction
            profileProxy={newProfileProxy}
            onActionCreated={onActionCreated}
          />
        )}
      </div>
    </div>
  );
}
