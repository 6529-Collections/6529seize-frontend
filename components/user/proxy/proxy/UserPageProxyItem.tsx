import { useMutation, useQuery } from "@tanstack/react-query";
import { IProfileAndConsolidations } from "../../../../entities/IProfile";
import {
  CreateProxyAction,
  ProfileProxyEntity,
  ProxyActionType,
} from "../../../../entities/IProxy";
import { QueryKey } from "../../../react-query-wrapper/ReactQueryWrapper";
import { useRouter } from "next/router";
import {
  commonApiFetch,
  commonApiPost,
} from "../../../../services/api/common-api";
import { useContext, useState } from "react";
import { AuthContext } from "../../../auth/Auth";

export default function UserPageProxyItem({
  profile: initialProfile,
  profileProxy: initialProfileProxy,
}: {
  readonly profile: IProfileAndConsolidations;
  readonly profileProxy: ProfileProxyEntity;
}) {
  const router = useRouter();
  const handleOrWallet = (router.query.user as string).toLowerCase();
  const profileProxyId = router.query.proxy as string;
  const { requestAuth, setToast } = useContext(AuthContext);
  const { data: profile } = useQuery<IProfileAndConsolidations>({
    queryKey: [QueryKey.PROFILE, handleOrWallet],
    queryFn: async () =>
      await commonApiFetch<IProfileAndConsolidations>({
        endpoint: `profiles/${handleOrWallet}`,
      }),
    enabled: !!handleOrWallet,
    initialData: initialProfile,
  });
  const { data: profileProxy } = useQuery<ProfileProxyEntity>({
    queryKey: [QueryKey.PROFILE_PROXY, { id: profileProxyId }],
    queryFn: async () =>
      await commonApiFetch<ProfileProxyEntity>({
        endpoint: `proxies/${profileProxyId}`,
      }),
    enabled: !!profileProxyId,
    initialData: initialProfileProxy,
  });

  const [submitting, setSubmitting] = useState(false);

  const action: CreateProxyAction = {
    action_type: ProxyActionType.ALLOCATE_REP,
    start_time: 0,
    end_time: null,
    credit: 0,
    group_id: null,
    category: null,
  };

  const createProxyActionMutation = useMutation({
    mutationFn: async (action: CreateProxyAction) => {
      return await commonApiPost<CreateProxyAction, ProfileProxyEntity>({
        endpoint: `proxies/${profileProxyId}/actions`,
        body: action,
      });
    },
    onSuccess: (result) => {
      console.log(result);
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

  const onSubmit = async () => {
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
      <button onClick={onSubmit}>submit</button>
    </div>
  );
}
