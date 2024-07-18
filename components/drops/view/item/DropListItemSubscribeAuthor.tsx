import React, { useContext, useState } from "react";
import { Drop } from "../../../../generated/models/Drop";
import Tippy from "@tippyjs/react";
import { AuthContext } from "../../../auth/Auth";
import { ReactQueryWrapperContext } from "../../../react-query-wrapper/ReactQueryWrapper";
import { useMutation } from "@tanstack/react-query";
import {
  commonApiDeleWithBody,
  commonApiPost,
} from "../../../../services/api/common-api";
import { DropSubscriptionActions } from "../../../../generated/models/DropSubscriptionActions";
import { DropSubscriptionTargetAction } from "../../../../generated/models/DropSubscriptionTargetAction";
import CircleLoader from "../../../distribution-plan-tool/common/CircleLoader";
import { IdentitySubscriptionActions } from "../../../../generated/models/IdentitySubscriptionActions";
import { IdentitySubscriptionTargetAction } from "../../../../generated/models/IdentitySubscriptionTargetAction";

enum SUBSCRIBED_STATE {
  SUBSCRIBED = "SUBSCRIBED",
  UNSUBSCRIBED = "UNSUBSCRIBED",
}

export default function DropListItemSubscribeAuthor({
  drop,
}: {
  readonly drop: Drop;
}) {
  const subscribedState = !!drop.author.subscribed_actions.length
    ? SUBSCRIBED_STATE.SUBSCRIBED
    : SUBSCRIBED_STATE.UNSUBSCRIBED;

  const components: Record<SUBSCRIBED_STATE, React.ReactNode> = {
    [SUBSCRIBED_STATE.SUBSCRIBED]: (
      <svg
        className="tw-h-5 tw-w-5"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M7.33129 22.2237C6.50288 22.226 5.69205 22.4628 4.99261 22.9068C4.29317 23.3507 3.73371 23.9836 3.37895 24.7322C3.02419 25.4808 2.88863 26.3145 2.98795 27.137C3.08727 27.9594 3.41741 28.7369 3.94019 29.3796L15.0845 43.0313C15.4818 43.5247 15.9912 43.9162 16.5702 44.1732C17.1492 44.4302 17.7812 44.5454 18.4137 44.5091C19.7663 44.4364 20.9876 43.7128 21.7662 42.5231L44.9158 5.24075C44.9195 5.23456 44.9235 5.22838 44.9276 5.22229C45.1448 4.88878 45.0743 4.22785 44.626 3.81265C44.5028 3.69864 44.3576 3.61104 44.1993 3.55525C44.041 3.49947 43.873 3.47669 43.7056 3.4883C43.5381 3.49991 43.3749 3.54568 43.2258 3.62278C43.0767 3.69989 42.945 3.80669 42.8387 3.93662C42.8304 3.94684 42.8219 3.9569 42.8131 3.96681L19.4664 30.345C19.3776 30.4454 19.2697 30.5271 19.149 30.5855C19.0283 30.6438 18.8972 30.6775 18.7634 30.6848C18.6296 30.692 18.4956 30.6726 18.3693 30.6276C18.243 30.5827 18.127 30.513 18.0278 30.4228L10.2795 23.3718C9.47478 22.6341 8.42298 22.2245 7.33129 22.2237Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    [SUBSCRIBED_STATE.UNSUBSCRIBED]: (
      <svg
        className="tw-h-5 tw-w-5"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 5V19M5 12H19"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  };

  const classes: Record<SUBSCRIBED_STATE, string> = {
    [SUBSCRIBED_STATE.SUBSCRIBED]: "tw-text-primary-500",
    [SUBSCRIBED_STATE.UNSUBSCRIBED]: "tw-text-iron-500",
  };

  const tooltipText: Record<SUBSCRIBED_STATE, string> = {
    [SUBSCRIBED_STATE.SUBSCRIBED]: "Unfollow",
    [SUBSCRIBED_STATE.UNSUBSCRIBED]: "Follow",
  };

  const { setToast, requestAuth } = useContext(AuthContext);
  const { invalidateDrops } = useContext(ReactQueryWrapperContext);
  const [mutating, setMutating] = useState(false);

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      await commonApiPost<
        IdentitySubscriptionActions,
        IdentitySubscriptionActions
      >({
        endpoint: `identities/${drop.author.id}/subscriptions`,
        body: {
          actions: Object.values(IdentitySubscriptionTargetAction),
        },
      });
    },
    onSuccess: () => {
      invalidateDrops();
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

  const unSubscribeMutation = useMutation({
    mutationFn: async () => {
      await commonApiDeleWithBody<
        IdentitySubscriptionActions,
        IdentitySubscriptionActions
      >({
        endpoint: `identities/${drop.author.id}/subscriptions`,
        body: {
          actions: Object.values(IdentitySubscriptionTargetAction),
        },
      });
    },
    onSuccess: () => {
      invalidateDrops();
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

  const onSubscribe = async (): Promise<void> => {
    setMutating(true);
    const { success } = await requestAuth();
    if (!success) {
      setMutating(false);
      return;
    }
    if (subscribedState === SUBSCRIBED_STATE.SUBSCRIBED) {
      await unSubscribeMutation.mutateAsync();
      return;
    }
    await subscribeMutation.mutateAsync();
  };

  return (
    <Tippy content={tooltipText[subscribedState]} placement="top">
      <button
        onClick={onSubscribe}
        disabled={mutating}
        className={`${classes[subscribedState]} tw-flex tw-border-none tw-bg-transparent tw-p-0 tw-m-0 tw-transition tw-duration-300 tw-ease-out`}
      >
        {mutating ? <CircleLoader /> : components[subscribedState]}
      </button>
    </Tippy>
  );
}
