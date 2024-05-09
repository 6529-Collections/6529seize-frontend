import { ProxyMode } from "../UserPageProxy";
import { CommunityMemberMinimal } from "../../../../entities/IProfile";
import ProxyCreateTargetSearch from "./target/ProxyCreateTargetSearch";
import { useMutation } from "@tanstack/react-query";
import { CreateNewProfileProxy } from "../../../../generated/models/CreateNewProfileProxy";
import { commonApiPost } from "../../../../services/api/common-api";
import { ProfileProxy } from "../../../../generated/models/ProfileProxy";
import { useContext, useState } from "react";
import { AuthContext } from "../../../auth/Auth";
import { ReactQueryWrapperContext } from "../../../react-query-wrapper/ReactQueryWrapper";
import ProxyCreateAction from "../proxy/create-action/ProxyCreateAction";

export default function ProxyCreate({
  profileProxies,
  onModeChange,
}: {
  readonly profileProxies: ProfileProxy[];
  readonly onModeChange: (mode: ProxyMode) => void;
}) {
  const { requestAuth, setToast } = useContext(AuthContext);
  const { setProfileProxy, onProfileProxyModify } = useContext(
    ReactQueryWrapperContext
  );
  const [submitting, setSubmitting] = useState(false);
  const [newProfileProxy, setNewProfileProxy] = useState<ProfileProxy | null>(
    null
  );

  const createProxyMutation = useMutation({
    mutationFn: async (body: CreateNewProfileProxy) => {
      return await commonApiPost<CreateNewProfileProxy, ProfileProxy>({
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
  ): ProfileProxy | null =>
    profileProxies?.find(
      (proxy) =>
        proxy.granted_to.handle?.toLowerCase() === target.handle?.toLowerCase()
    ) ?? null;

  const onTargetSelect = async (target: CommunityMemberMinimal | null) => {
    if (!target?.profile_id) {
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
    if (!newProfileProxy) {
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
      {newProfileProxy ? (
        <ProxyCreateAction
          profileProxy={newProfileProxy}
          onActionCreated={onActionCreated}
        />
      ) : (
        <ProxyCreateTargetSearch onTargetSelect={onTargetSelect} />
      )}
      <div className="tw-mt-6 tw-flex tw-items-center tw-gap-x-3">
        <button
          onClick={() => onModeChange(ProxyMode.LIST)}
          type="button"
          className="tw-bg-iron-900 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border tw-border-solid tw-border-iron-700 tw-rounded-lg hover:tw-bg-iron-800 hover:tw-border-iron-700 tw-transition tw-duration-300 tw-ease-out"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
