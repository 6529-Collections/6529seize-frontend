import { useContext, useState } from "react";
import {
  DropFull,
  DropRepChangeRequest,
} from "../../../../../../entities/IDrop";
import {
  formatLargeNumber,
  formatNumberWithCommas,
} from "../../../../../../helpers/Helpers";
import { useMutation } from "@tanstack/react-query";
import { commonApiPost } from "../../../../../../services/api/common-api";
import { AuthContext } from "../../../../../auth/Auth";
import { ReactQueryWrapperContext } from "../../../../../react-query-wrapper/ReactQueryWrapper";
import Tippy from "@tippyjs/react";
import { ProfileConnectedStatus } from "../../../../../../entities/IProfile";

enum SubmitState {
  POSITIVE = "POSITIVE",
  NEUTRAL = "NEUTRAL",
  NEGATIVE = "NEGATIVE",
}

export default function DropListItemRepGiveSubmit({
  rep,
  drop,
  repCategory,
}: {
  readonly rep: number;
  readonly drop: DropFull;
  readonly repCategory: string;
}) {
  const { requestAuth, setToast, connectedProfile, connectionStatus } =
    useContext(AuthContext);
  const { onDropChange } = useContext(ReactQueryWrapperContext);
  const [loading, setLoading] = useState<boolean>(false);
  const isChanged = drop.rep !== rep;

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
        message: "Rep given.",
        type: "success",
      });
      onDropChange({
        drop: response,
        giverHandle: connectedProfile?.profile?.handle ?? null,
      });
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

  const getRepAmount = () => {
    const diff = rep - drop.rep;
    const category = drop.input_profile_categories?.find(
      (category) => category.category === repCategory
    );
    const categoryRep = category ? category.rep_given : 0;
    return categoryRep + diff;
  };

  const onRepSubmit = async () => {
    if (connectionStatus === ProfileConnectedStatus.NOT_CONNECTED) {
      setToast({
        message: "Connect your wallet to give rep",
        type: "warning",
      });
      return;
    }
    if (connectionStatus === ProfileConnectedStatus.NO_PROFILE) {
      setToast({
        message: "Create a profile to give rep",
        type: "warning",
      });
      return;
    }
    if (!isChanged) return;
    if (loading) return;
    setLoading(true);
    const { success } = await requestAuth();
    if (!success) {
      setLoading(false);
      return;
    }
    await repChangeMutation.mutateAsync({
      rep: getRepAmount(),
      category: repCategory,
    });
  };

  const getState = (): SubmitState => {
    if (rep > 0) return SubmitState.POSITIVE;
    if (rep < 0) return SubmitState.NEGATIVE;
    return SubmitState.NEUTRAL;
  };

  const state = getState();

  const buttonClasses: Record<SubmitState, string> = {
    [SubmitState.POSITIVE]: "tw-bg-green/[0.15] tw-ring-green/[0.20]",
    [SubmitState.NEUTRAL]: "tw-bg-iron-800 tw-ring-iron-700",
    [SubmitState.NEGATIVE]: "tw-bg-red/[0.15] tw-ring-red/[0.20]",
  };

  const textClasses: Record<SubmitState, string> = {
    [SubmitState.POSITIVE]: "tw-text-green",
    [SubmitState.NEUTRAL]: "tw-text-iron-300",
    [SubmitState.NEGATIVE]: "tw-text-red",
  };

  return (
    <Tippy
      content={formatNumberWithCommas(rep)}
      placement="right"
      hideOnClick={false}
      disabled={Math.abs(rep) < 1000}
    >
      <button
        onClick={onRepSubmit}
        type="button"
        aria-label="Give rep"
        className={`${buttonClasses[state]} tw-flex tw-items-center tw-justify-center tw-text-xxs tw-font-medium tw-border-0 tw-rounded-full tw-ring-1 tw-ring-inset  tw-min-w-[2rem] 
              tw-h-8  tw-shadow-sm hover:tw-scale-110 tw-transform focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-ring-300  tw-transition-all tw-duration-300 tw-ease-out`}
      >
        <span className={textClasses[state]}>{formatLargeNumber(rep)}</span>
      </button>
    </Tippy>
  );
}
