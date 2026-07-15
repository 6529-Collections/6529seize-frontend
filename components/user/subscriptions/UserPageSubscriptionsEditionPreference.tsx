"use client";

import { AuthContext } from "@/components/auth/Auth";
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
    <div className="tw-min-w-0 tw-p-1">
      <div className="tw-min-w-0">
        <div className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-baseline tw-gap-x-2 tw-gap-y-1">
          <h3 className="tw-mb-1 tw-text-[11px] tw-font-medium tw-uppercase tw-tracking-wider tw-text-iron-500">
            Edition Preference
          </h3>
          <span className="tw-inline-flex tw-items-center tw-rounded tw-bg-iron-800 tw-px-1.5 tw-py-0.5 tw-text-[9px] tw-font-medium tw-uppercase tw-leading-none tw-tracking-wider tw-text-iron-400">
            Eligibility x{subscriptionEligibilityCount}
          </span>
        </div>
        <div className="tw-mt-1 tw-flex tw-min-h-11 tw-items-center tw-gap-2.5">
          <label
            htmlFor="subscription-all-editions-mode"
            className={`tw-whitespace-nowrap tw-text-xs tw-font-medium sm:tw-text-sm ${
              isDisabled ? "tw-cursor-not-allowed" : "tw-cursor-pointer"
            } ${isAllEditions ? "tw-text-iron-500" : "tw-text-iron-100"}`}
          >
            One edition
          </label>
          <UserPageSubscriptionsToggle
            disabled={isDisabled}
            id="subscription-all-editions-mode"
            checked={isAllEditions}
            onChange={toggleAllEditions}
            ariaLabel="All eligible editions"
            describedBy={props.readonly ? undefined : descriptionId}
          />
          <label
            htmlFor="subscription-all-editions-mode"
            className={`tw-whitespace-nowrap tw-text-xs tw-font-medium sm:tw-text-sm ${
              isDisabled ? "tw-cursor-not-allowed" : "tw-cursor-pointer"
            } ${isAllEditions ? "tw-text-iron-100" : "tw-text-iron-500"}`}
          >
            All eligible
          </label>
        </div>
      </div>
      {!props.readonly && (
        <p
          id={descriptionId}
          className="tw-mb-0 tw-mt-1 tw-text-sm tw-font-light tw-leading-relaxed tw-text-iron-500"
        >
          {isAllEditions
            ? "You will receive all editions you are eligible for"
            : "You will receive only one edition"}
        </p>
      )}
    </div>
  );
}
