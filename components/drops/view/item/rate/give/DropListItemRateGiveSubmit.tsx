import { useContext, useState } from "react";
import {
  DropRateChangeRequest,
} from "../../../../../../entities/IDrop";
import { useMutation } from "@tanstack/react-query";
import { commonApiPost } from "../../../../../../services/api/common-api";
import { AuthContext } from "../../../../../auth/Auth";
import { ReactQueryWrapperContext } from "../../../../../react-query-wrapper/ReactQueryWrapper";
import { ProfileConnectedStatus } from "../../../../../../entities/IProfile";
import dynamic from "next/dynamic";
import { Drop } from "../../../../../../generated/models/Drop";

const DropListItemRateGiveClap = dynamic(
  () => import("./clap/DropListItemRateGiveClap"),
  { ssr: false }
);

const DEFAULT_DROP_RATE_CATEGORY = "Rep";

export default function DropListItemRateGiveSubmit({
  rate,
  drop,
  availableRates,
  onSuccessfulRateChange,
}: {
  readonly rate: number;
  readonly drop: Drop;
  readonly availableRates: number;
  readonly onSuccessfulRateChange: () => void;
}) {
  const { requestAuth, setToast, connectedProfile, connectionStatus } =
    useContext(AuthContext);
  const { onDropChange } = useContext(ReactQueryWrapperContext);
  const [loading, setLoading] = useState<boolean>(false);

  const rateChangeMutation = useMutation({
    mutationFn: async (param: { rate: number; category: string }) =>
      await commonApiPost<DropRateChangeRequest, Drop>({
        endpoint: `drops/${drop.id}/rep`,
        body: {
          amount: param.rate,
          category: param.category,
        },
      }),
    onSuccess: (response: Drop) => {
      setToast({
        message: "Voted successfully.",
        type: "success",
      });
      onDropChange({
        drop: response,
        giverHandle: connectedProfile?.profile?.handle ?? null,
      });
      onSuccessfulRateChange();
    },
    onError: (error) => {
      setToast({
        message: error as unknown as string,
        type: "error",
      });
    },
    onSettled: () => {
      setLoading(false);
    },
  });

  const onRateSubmit = async () => {
    if (connectionStatus === ProfileConnectedStatus.NOT_CONNECTED) {
      setToast({
        message: "Connect your wallet to vote",
        type: "warning",
      });
      return;
    }
    if (connectionStatus === ProfileConnectedStatus.NO_PROFILE) {
      setToast({
        message: "Create a profile to vote",
        type: "warning",
      });
      return;
    }
    if (!rate) return;
    if (loading) return;
    setLoading(true);
    const { success } = await requestAuth();
    if (!success) {
      setLoading(false);
      return;
    }

    const previousRate =
      drop.context_profile_context?.categories?.find(
        (c) => c.category === DEFAULT_DROP_RATE_CATEGORY
      )?.rating ?? 0;

    const newRate = previousRate + rate;

    await rateChangeMutation.mutateAsync({
      rate: newRate,
      category: DEFAULT_DROP_RATE_CATEGORY,
    });
  };

  return (
    <div>
      <DropListItemRateGiveClap
        rate={rate}
        onSubmit={onRateSubmit}
        drop={drop}
        availableRates={availableRates}
      />
    </div>
  );
}
