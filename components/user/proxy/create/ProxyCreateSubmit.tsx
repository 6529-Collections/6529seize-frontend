import { useMutation } from "@tanstack/react-query";
import { CreateNewProfileProxy } from "../../../../entities/IProxy";
import { commonApiPost } from "../../../../services/api/common-api";
import { useContext, useState } from "react";
import { AuthContext } from "../../../auth/Auth";
import CircleLoader from "../../../distribution-plan-tool/common/CircleLoader";
import { useRouter } from "next/router";
import { ProfileProxy } from "../../../../generated/models/ProfileProxy";

export default function ProxyCreateSubmit({
  targetId,
}: {
  readonly targetId: string;
}) {
  const router = useRouter();
  const user = router.query.user as string;
  const { requestAuth, setToast } = useContext(AuthContext);
  const body: CreateNewProfileProxy = {
    target_id: targetId,
  };

  const [submitting, setSubmitting] = useState(false);

  const createProxyMutation = useMutation({
    mutationFn: async (body: CreateNewProfileProxy) => {
      return await commonApiPost<CreateNewProfileProxy, ProfileProxy>({
        endpoint: `proxies`,
        body,
      });
    },
    onSuccess: (result) => {
      router.push(`/${user}/proxy/${result.id}`);
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

  const setNextStep = async () => {
    setSubmitting(true);
    const { success } = await requestAuth();
    if (!success) {
      setSubmitting(false);
      return;
    }
    await createProxyMutation.mutateAsync(body);
  };
  return (
    <button
      disabled={submitting}
      type="button"
      onClick={setNextStep}
      className="tw-flex tw-items-center tw-w-20 tw-justify-center tw-relative tw-bg-primary-500 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
    >
      {submitting ? <CircleLoader /> : "Create"}
    </button>
  );
}
