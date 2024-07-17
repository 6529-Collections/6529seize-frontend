import { useMutation, useQuery } from "@tanstack/react-query";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
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
      console.log("yep");
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
      className="tw-inline-flex tw-items-center tw-gap-x-2 tw-cursor-pointer tw-bg-primary-500 tw-px-3.5 tw-py-2.5 tw-text-sm tw-rounded-lg tw-font-semibold tw-text-white hover:tw-text-white tw-border-0 tw-ring-1 tw-ring-inset tw-ring-primary-500 hover:tw-ring-primary-600 placeholder:tw-text-iron-300 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset tw-shadow-sm hover:tw-bg-primary-600 tw-transition tw-duration-300 tw-ease-out"
    >
      {(mutating || isFetching) && <CircleLoader />}
      <svg
        className="tw-h-5 tw-w-5 tw-flex-shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 15.5H7.5C6.10444 15.5 5.40665 15.5 4.83886 15.6722C3.56045 16.06 2.56004 17.0605 2.17224 18.3389C2 18.9067 2 19.6044 2 21M19 21V15M16 18H22M14.5 7.5C14.5 9.98528 12.4853 12 10 12C7.51472 12 5.5 9.98528 5.5 7.5C5.5 5.01472 7.51472 3 10 3C12.4853 3 14.5 5.01472 14.5 7.5Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>{label}</span>
    </button>
  );
}
