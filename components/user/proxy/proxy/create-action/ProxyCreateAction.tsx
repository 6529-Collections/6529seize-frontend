import { useContext, useState } from "react";
import { ProfileProxy } from "../../../../../generated/models/ProfileProxy";
import ProxyCreateActionSelectType from "./select-type/ProxyCreateActionSelectType";
import CommonChangeAnimation from "../../../../utils/animation/CommonChangeAnimation";
import { ProfileProxyActionType } from "../../../../../generated/models/ProfileProxyActionType";
import ProxyCreateActionConfig from "./config/ProxyCreateActionConfig";
import { CreateProxyAction } from "../../../../../entities/IProxy";
import { useMutation } from "@tanstack/react-query";
import { commonApiPost } from "../../../../../services/api/common-api";
import { AuthContext } from "../../../../auth/Auth";
import { ReactQueryWrapperContext } from "../../../../react-query-wrapper/ReactQueryWrapper";
import { assertUnreachable } from "../../../../../helpers/AllowlistToolHelpers";
import { useRouter } from "next/router";

export default function ProxyCreateAction({
  profileProxy,
}: {
  readonly profileProxy: ProfileProxy;
}) {
  const router = useRouter();
  const user = router.query.user as string;
  const proxy = router.query.proxy as string;
  const { setToast, requestAuth } = useContext(AuthContext);
  const { onProfileProxyModify } = useContext(ReactQueryWrapperContext);
  const [selectedActionType, setSelectedActionType] =
    useState<ProfileProxyActionType | null>(null);

  const goToAction = ({ actionId }: { readonly actionId: string }) =>
    router.push(`/${user}/proxy/${proxy}/actions/${actionId}`);

  const onSelectActionType = (actionType: ProfileProxyActionType) => {
    switch (actionType) {
      case ProfileProxyActionType.AllocateRep:
        setSelectedActionType(actionType);
        break;
      case ProfileProxyActionType.AllocateCic:
      case ProfileProxyActionType.CreateWave:
      case ProfileProxyActionType.ReadWave:
      case ProfileProxyActionType.CreateDropToWave:
      case ProfileProxyActionType.RateWaveDrop:
        const action = profileProxy.actions.find(
          (a) => a.action_type === actionType
        );
        if (action) {
          goToAction({ actionId: action.id });
          return;
        }
        setSelectedActionType(actionType);
        break;
      default:
        assertUnreachable(actionType);
    }
  };

  const [submitting, setSubmitting] = useState(false);

  const createProxyActionMutation = useMutation({
    mutationFn: async (action: CreateProxyAction) => {
      console.log(action);
      return await commonApiPost<CreateProxyAction, ProfileProxy>({
        endpoint: `proxies/${profileProxy.id}/actions`,
        body: action,
      });
    },
    onSuccess: () => {
      onProfileProxyModify({
        profileProxyId: profileProxy.id,
        grantedToHandle: profileProxy.granted_to.handle,
        createdByHandle: profileProxy.created_by.handle,
      });
      setToast({
        message: "Action created",
        type: "success",
      });
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

  const onSubmit = async (action: CreateProxyAction) => {
    setSubmitting(true);
    const { success } = await requestAuth();
    if (!success) {
      setSubmitting(false);
      return;
    }
    await createProxyActionMutation.mutateAsync(action);
  };

  return (
    <div className="tw-mt-4">
      <CommonChangeAnimation>
        {!selectedActionType ? (
          <ProxyCreateActionSelectType
            setSelectedActionType={onSelectActionType}
            currentActions={profileProxy.actions}
          />
        ) : (
          <div>
            <ProxyCreateActionConfig
              selectedActionType={selectedActionType}
              currentActions={profileProxy.actions}
              onSubmit={onSubmit}
            />
          </div>
        )}
      </CommonChangeAnimation>
    </div>
  );
}
