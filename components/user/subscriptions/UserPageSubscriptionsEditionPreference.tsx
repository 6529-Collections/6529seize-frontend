"use client";

import { AuthContext } from "@/components/auth/Auth";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import type { SubscriptionDetails } from "@/generated/models/SubscriptionDetails";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { commonApiPost } from "@/services/api/common-api";
import { useContext, useEffect, useId, useState } from "react";
import UserPageSubscriptionsToggle from "./UserPageSubscriptionsToggle";

export default function UserPageSubscriptionsEditionPreference(
  props: Readonly<{
    profileKey: string;
    details: SubscriptionDetails | undefined;
    readonly: boolean;
    refresh: () => void;
  }>
) {
  const { requestAuth, setToast } = useContext(AuthContext);

  const [isAllEditions, setIsAllEditions] = useState<boolean>(false);
  const [isUpdatingAllEditions, setIsUpdatingAllEditions] =
    useState<boolean>(false);
  const descriptionId = useId();
  const isDisabled = props.readonly || isUpdatingAllEditions;

  const subscriptionEligibilityCount =
    props.details?.subscription_eligibility_count ?? 1;

  useEffect(() => {
    setIsAllEditions(props.details?.subscribe_all_editions ?? false);
  }, [props.details?.subscribe_all_editions]);

  const toggleAllEditions = async (): Promise<void> => {
    if (isUpdatingAllEditions) {
      return;
    }
    setIsUpdatingAllEditions(true);
    try {
      const { success } = await requestAuth();
      if (!success) {
        return;
      }
      const allEditions = !isAllEditions;
      interface SubscribeAllEditionsBody {
        subscribe_all_editions: boolean;
      }
      const response = await commonApiPost<
        SubscribeAllEditionsBody,
        SubscribeAllEditionsBody
      >({
        endpoint: `subscriptions/${props.profileKey}/subscribe-all-editions`,
        body: {
          subscribe_all_editions: allEditions,
        },
      });
      const responseAllEditions = response.subscribe_all_editions;
      setIsAllEditions(responseAllEditions);
      setToast({
        type: "success",
        title: "Edition preference updated.",
        description: responseAllEditions
          ? "All eligible editions are included."
          : "One edition is included.",
      });
      props.refresh();
    } catch (e) {
      setToast({
        type: "error",
        title: "Couldn't update edition preference.",
        description: "Please try again.",
        details: getToastErrorDetails(e, "Could not set edition preference."),
      });
    } finally {
      setIsUpdatingAllEditions(false);
    }
  };

  return (
    <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-3 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between sm:tw-gap-5">
      <div className="tw-min-w-0">
        <div className="tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-2 tw-gap-y-1">
          <h3 className="tw-m-0 tw-text-sm tw-font-semibold tw-leading-5 tw-text-iron-100">
            Edition Preference
          </h3>
          <span className="tw-text-xs tw-font-medium tw-text-iron-500">
            Eligibility x{subscriptionEligibilityCount}
          </span>
        </div>
        {!props.readonly && (
          <p
            id={descriptionId}
            className="tw-mb-0 tw-mt-1.5 tw-text-sm tw-leading-5 tw-text-iron-400"
          >
            {isAllEditions
              ? "You will receive all editions you are eligible for"
              : "You will receive only one edition"}
          </p>
        )}
      </div>
      <div className="tw-grid tw-w-full tw-flex-shrink-0 tw-grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] tw-items-center tw-gap-2 sm:tw-w-auto sm:tw-grid-cols-[auto_auto_auto]">
        <span
          className={`tw-text-right tw-text-sm tw-font-semibold tw-transition-colors ${
            isAllEditions ? "tw-text-iron-400" : "tw-text-iron-50"
          }`}
        >
          One edition
        </span>
        <span className="tw-flex tw-items-center tw-gap-2">
          <UserPageSubscriptionsToggle
            disabled={isDisabled}
            id="subscription-all-editions-mode"
            checked={isAllEditions}
            onChange={toggleAllEditions}
            ariaLabel="All eligible editions"
            describedBy={props.readonly ? undefined : descriptionId}
          />
          {isUpdatingAllEditions && (
            <CircleLoader size={CircleLoaderSize.MEDIUM} />
          )}
        </span>
        <span
          className={`tw-text-sm tw-font-semibold tw-transition-colors ${
            isAllEditions ? "tw-text-iron-50" : "tw-text-iron-400"
          }`}
        >
          All eligible
        </span>
      </div>
    </div>
  );
}
