"use client";

import { AuthContext } from "@/components/auth/Auth";
import type { SubscriptionDetails } from "@/generated/models/SubscriptionDetails";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { commonApiPost } from "@/services/api/common-api";
import { useContext, useEffect, useId, useState } from "react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t, type MessageKey } from "@/i18n/messages";
import { formatInteger } from "@/i18n/format";

export default function UserPageSubscriptionsEditionPreference(
  props: Readonly<{
    profileKey: string;
    details: SubscriptionDetails | undefined;
    readonly: boolean;
    refresh: () => void;
  }>
) {
  const locale = useBrowserLocale();
  const { requestAuth, setToast } = useContext(AuthContext);

  const [isAllEditions, setIsAllEditions] = useState<boolean>(false);
  const [isUpdatingAllEditions, setIsUpdatingAllEditions] =
    useState<boolean>(false);
  const descriptionId = useId();
  const isDisabled = props.readonly || isUpdatingAllEditions || !props.details;

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

  let descriptionKey: MessageKey = isAllEditions
    ? "subscriptions.settings.allDescription"
    : "subscriptions.settings.oneDescription";
  if (props.readonly)
    descriptionKey = isAllEditions
      ? "subscriptions.settings.allVisitorDescription"
      : "subscriptions.settings.oneVisitorDescription";
  return (
    <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3 tw-py-3">
      <div className="tw-min-w-0">
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
          <h3
            id="subscription-editions-label"
            className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-100"
          >
            {t(locale, "subscriptions.settings.editions")}
          </h3>
          <span className="tw-rounded-md tw-bg-iron-800 tw-px-1.5 tw-py-1 tw-text-xs tw-font-medium tw-text-iron-300">
            {props.details
              ? t(locale, "subscriptions.settings.eligibilityBadge", {
                  count: formatInteger(locale, subscriptionEligibilityCount),
                })
              : t(locale, "subscriptions.settings.loading")}
          </span>
        </div>
        <p
          id={descriptionId}
          className="tw-mb-0 tw-mt-1 tw-text-sm tw-leading-5 tw-text-iron-400"
        >
          {t(locale, descriptionKey)}
        </p>
      </div>
      <fieldset
        aria-labelledby="subscription-editions-label"
        aria-describedby={descriptionId}
        disabled={isDisabled}
        className="tw-m-0 tw-flex tw-min-w-0 tw-gap-1 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 tw-p-1 max-md:tw-w-full"
      >
        {[false, true].map((all) => (
          <label
            key={String(all)}
            className="tw-relative tw-flex tw-flex-1 tw-cursor-pointer"
          >
            <input
              type="radio"
              name="subscription-edition-preference"
              checked={isAllEditions === all}
              onChange={() => {
                if (isAllEditions !== all) void toggleAllEditions();
              }}
              className="tw-peer tw-sr-only"
            />
            <span className="tw-flex tw-min-h-11 tw-w-full tw-items-center tw-justify-center tw-rounded-md tw-px-3 tw-py-2 tw-text-center tw-text-sm tw-font-medium tw-text-iron-400 peer-checked:tw-bg-iron-700 peer-checked:tw-text-iron-100 peer-focus-visible:tw-outline peer-focus-visible:tw-outline-2 peer-focus-visible:tw-outline-primary-400 peer-disabled:tw-cursor-not-allowed">
              {t(
                locale,
                all
                  ? "subscriptions.settings.all"
                  : "subscriptions.coverage.editions.one"
              )}
            </span>
          </label>
        ))}
      </fieldset>
    </div>
  );
}
