import { useContext, useState } from "react";
import {
  DropFull,
  DropRepChangeRequest,
} from "../../../../../../entities/IDrop";
import { useMutation } from "@tanstack/react-query";
import { commonApiPost } from "../../../../../../services/api/common-api";
import { AuthContext } from "../../../../../auth/Auth";
import { ReactQueryWrapperContext } from "../../../../../react-query-wrapper/ReactQueryWrapper";
import { ProfileConnectedStatus } from "../../../../../../entities/IProfile";
import { DEFAULT_DROP_REP_CATEGORY } from "../DropListItemRepWrapper";
import dynamic from "next/dynamic";

const DropListItemRepGiveClap = dynamic(
  () => import("./clap/DropListItemRepGiveClap"),
  { ssr: false }
);

export default function DropListItemRepGiveSubmit({
  rep,
  drop,
  availableRep,
  onSuccessfulRepChange,
}: {
  readonly rep: number;
  readonly drop: DropFull;
  readonly availableRep: number;
  readonly onSuccessfulRepChange: () => void;
}) {
  const { requestAuth, setToast, connectedProfile, connectionStatus } =
    useContext(AuthContext);
  const { onDropChange } = useContext(ReactQueryWrapperContext);
  const [loading, setLoading] = useState<boolean>(false);

  const repChangeMutation = useMutation({
    mutationFn: async (param: { rep: number; category: string }) =>
      await commonApiPost<DropRepChangeRequest, DropFull>({
        endpoint: `drops/${drop.id}/rep`,
        body: {
          amount: param.rep,
          category: param.category,
        },
      }),
    onSuccess: (response: DropFull) => {
      setToast({
        message: "Voted successfully.",
        type: "success",
      });
      onDropChange({
        drop: response,
        giverHandle: connectedProfile?.profile?.handle ?? null,
      });
      onSuccessfulRepChange();
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

  const onRepSubmit = async () => {
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
    if (!rep) return;
    if (loading) return;
    setLoading(true);
    const { success } = await requestAuth();
    if (!success) {
      setLoading(false);
      return;
    }

    const previousRep =
      drop.input_profile_categories?.find(
        (c) => c.category === DEFAULT_DROP_REP_CATEGORY
      )?.rep_given_by_input_profile ?? 0;

    const newRep = previousRep + rep;

    await repChangeMutation.mutateAsync({
      rep: newRep,
      category: DEFAULT_DROP_REP_CATEGORY,
    });
  };

  return (
    <div>
      <DropListItemRepGiveClap
        rep={rep}
        onSubmit={onRepSubmit}
        drop={drop}
        availableRep={availableRep}
      />
    </div>
  );
}
