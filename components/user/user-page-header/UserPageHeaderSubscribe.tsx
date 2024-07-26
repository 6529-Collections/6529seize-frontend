import { useMutation, useQuery } from "@tanstack/react-query";
import { IdentitySubscriptionActions } from "../../../generated/models/IdentitySubscriptionActions";
import {
  QueryKey,
  ReactQueryWrapperContext,
} from "../../react-query-wrapper/ReactQueryWrapper";
import {
  commonApiDeleWithBody,
  commonApiFetch,
  commonApiPost,
} from "../../../services/api/common-api";
import { useContext, useEffect, useState } from "react";
import CircleLoader from "../../distribution-plan-tool/common/CircleLoader";
import { IdentitySubscriptionTargetAction } from "../../../generated/models/IdentitySubscriptionTargetAction";
import { AuthContext } from "../../auth/Auth";

export default function UserPageHeaderSubscribe({
  handle,
}: {
  readonly handle: string;
}) {
  const { onIdentitySubscriptionChange } = useContext(ReactQueryWrapperContext);
  const { setToast, requestAuth } = useContext(AuthContext);
  const [mutating, setMutating] = useState<boolean>(false);
  const { data: subscriptions, isFetching } =
    useQuery<IdentitySubscriptionActions>({
      queryKey: [QueryKey.IDENTITY_SUBSCRIPTIONS, handle],
      queryFn: async () =>
        await commonApiFetch<IdentitySubscriptionActions>({
          endpoint: `/identities/${handle}/subscriptions`,
        }),
    });

  const getIsSubscribed = () => !!subscriptions?.actions.length;
  const getLabel = () => (getIsSubscribed() ? "Subscribed" : "Subscribe");

  const [isSubscribed, setIsSubscribed] = useState<boolean>(getIsSubscribed());
  const [label, setLabel] = useState<string>(getLabel());
  useEffect(() => {
    setIsSubscribed(getIsSubscribed());
    setLabel(getLabel());
  }, [subscriptions]);

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      await commonApiPost<
        IdentitySubscriptionActions,
        IdentitySubscriptionActions
      >({
        endpoint: `identities/${handle}/subscriptions`,
        body: {
          actions: Object.values(IdentitySubscriptionTargetAction),
        },
      });
    },
    onSuccess: () => {
      onIdentitySubscriptionChange();
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
        endpoint: `identities/${handle}/subscriptions`,
        body: {
          actions: Object.values(IdentitySubscriptionTargetAction),
        },
      });
    },
    onSuccess: () => {
      onIdentitySubscriptionChange();
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
    if (isSubscribed) {
      await unSubscribeMutation.mutateAsync();
      return;
    }
    await subscribeMutation.mutateAsync();
  };

  return (
    <button
      onClick={onSubscribe}
      disabled={mutating || isFetching}
      type="button"
      className={`tw-flex tw-items-center tw-gap-x-2 tw-cursor-pointer tw-px-3.5 tw-py-2.5 tw-text-sm tw-rounded-lg tw-font-semibold tw-border-0 tw-ring-1 tw-ring-inset ${
        isSubscribed
          ? "tw-bg-iron-800 tw-ring-iron-800 tw-text-iron-300 hover:tw-bg-iron-700 hover:tw-ring-iron-700"
          : "tw-bg-primary-500 tw-ring-primary-500 hover:tw-bg-primary-600 hover:tw-ring-primary-600 tw-text-white"
      } tw-transition tw-duration-300 tw-ease-out`}
    >
      {mutating || isFetching ? (
        <CircleLoader />
      ) : isSubscribed ? (
        <svg
          className="tw-h-3 tw-w-3"
          width="17"
          height="15"
          viewBox="0 0 17 15"
          fill="none"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M14.7953 0.853403L5.24867 10.0667L2.71534 7.36007C2.24867 6.92007 1.51534 6.8934 0.982005 7.26674C0.462005 7.6534 0.315338 8.3334 0.635338 8.88007L3.63534 13.7601C3.92867 14.2134 4.43534 14.4934 5.00867 14.4934C5.55534 14.4934 6.07534 14.2134 6.36867 13.7601C6.84867 13.1334 16.0087 2.2134 16.0087 2.2134C17.2087 0.986737 15.7553 -0.093263 14.7953 0.84007V0.853403Z"
            fill="currentColor"
          />
        </svg>
      ) : (
        <svg
          className="tw-h-5 tw-w-5"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 5V19M5 12H19"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      <span>{label}</span>
    </button>
  );
}
