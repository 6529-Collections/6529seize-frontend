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

export default function ProxyCreateAction({
  profileProxy,
  onActionCreated,
  onCancel,
}: {
  readonly profileProxy: ProfileProxy;
  readonly onActionCreated: () => void;
  readonly onCancel?: () => void;
}) {

  const { setToast, requestAuth } = useContext(AuthContext);
  const { onProfileProxyModify } = useContext(ReactQueryWrapperContext);
  const [selectedActionType, setSelectedActionType] =
    useState<ProfileProxyActionType | null>(null);


  const [submitting, setSubmitting] = useState(false);

  const createProxyActionMutation = useMutation({
    mutationFn: async (action: CreateProxyAction) => {
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
      onActionCreated();
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
    <div>
      <CommonChangeAnimation>
        {!selectedActionType ? (
          <ProxyCreateActionSelectType
            setSelectedActionType={setSelectedActionType}
            currentActions={profileProxy.actions}
            onCancel={onCancel}
          />
        ) : (
          <div>
            <ProxyCreateActionConfig
              selectedActionType={selectedActionType}
              submitting={submitting}
              onSubmit={onSubmit}
              onCancel={() => setSelectedActionType(null)}
            />
          </div>
        )}
      </CommonChangeAnimation>
    </div>
  );
}
