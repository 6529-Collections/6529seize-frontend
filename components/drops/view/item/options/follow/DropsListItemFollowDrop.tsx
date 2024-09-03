import { useContext, useState } from "react";
import { Drop } from "../../../../../../generated/models/Drop";
import { useMutation } from "@tanstack/react-query";
import {
  commonApiDeleWithBody,
  commonApiPost,
} from "../../../../../../services/api/common-api";
import { DropSubscriptionActions } from "../../../../../../generated/models/DropSubscriptionActions";
import { DropSubscriptionTargetAction } from "../../../../../../generated/models/DropSubscriptionTargetAction";
import { ReactQueryWrapperContext } from "../../../../../react-query-wrapper/ReactQueryWrapper";
import { AuthContext } from "../../../../../auth/Auth";
import CircleLoader, {
  CircleLoaderSize,
} from "../../../../../distribution-plan-tool/common/CircleLoader";

export default function DropsListItemFollowDrop({
  drop,
  closeOptions,
}: {
  readonly drop: Drop;
  readonly closeOptions: () => void;
}) {
  const { setToast, requestAuth } = useContext(AuthContext);
  const { invalidateDrops } = useContext(ReactQueryWrapperContext);

  const following = !!drop.subscribed_actions.length;
  const title = following ? "Following" : "Follow";
  const [mutating, setMutating] = useState(false);

  const followMutation = useMutation({
    mutationFn: async () => {
      await commonApiPost<DropSubscriptionActions, DropSubscriptionActions>({
        endpoint: `drops/${drop.id}/subscriptions`,
        body: {
          actions: Object.values(DropSubscriptionTargetAction),
        },
      });
    },
    onSuccess: () => {
      invalidateDrops();
      closeOptions();
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

  const unFollowMutation = useMutation({
    mutationFn: async () => {
      await commonApiDeleWithBody<
        DropSubscriptionActions,
        DropSubscriptionActions
      >({
        endpoint: `drops/${drop.id}/subscriptions`,
        body: {
          actions: Object.values(DropSubscriptionTargetAction),
        },
      });
    },
    onSuccess: () => {
      invalidateDrops();
      closeOptions();
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

  const onFollow = async (): Promise<void> => {
    setMutating(true);
    const { success } = await requestAuth();
    if (!success) {
      setMutating(false);
      return;
    }
    if (following) {
      await unFollowMutation.mutateAsync();
      return;
    }
    await followMutation.mutateAsync();
  };
  return (
    <button
      type="button"
      disabled={mutating}
      onClick={(e) => {
        onFollow();
        e.stopPropagation();
      }}
      className="tw-flex tw-items-center tw-bg-transparent tw-w-full tw-border-none tw-px-3 tw-py-1 tw-text-sm tw-leading-6 tw-text-iron-300 hover:tw-text-iron-50 hover:tw-bg-iron-800 tw-text-left tw-transition tw-duration-300 tw-ease-out"
      role="menuitem"
      tabIndex={-1}
      id="options-menu-0-item-0"
    >
      {mutating ? (
        <>
          <span className="tw-mr-2">{title}</span>
          <CircleLoader size={CircleLoaderSize.SMALL} />
        </>
      ) : (
        title
      )}
    </button>
  );
}
