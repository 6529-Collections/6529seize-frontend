"use client";

import { AuthContext } from "@/components/auth/Auth";
import type { SubscriptionDetails } from "@/generated/models/SubscriptionDetails";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { commonApiPost } from "@/services/api/common-api";
import { useContext, useEffect, useState } from "react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { formatInteger } from "@/i18n/format";
import SubscriptionSettingSelect from "./SubscriptionSettingSelect";

export default function UserPageSubscriptionsEditionPreference(
  props: Readonly<{
    profileKey: string;
    details: SubscriptionDetails | undefined;
    readonly: boolean;
    refresh: () => void;
    layout?: "row" | "inline";
  }>
) {
  const locale = useBrowserLocale();
  const { requestAuth, setToast } = useContext(AuthContext);

  const [isAllEditions, setIsAllEditions] = useState<boolean>(false);
  const [isUpdatingAllEditions, setIsUpdatingAllEditions] =
    useState<boolean>(false);
  const isDisabled = props.readonly || isUpdatingAllEditions || !props.details;

  const subscriptionEligibilityCount =
    props.details?.subscription_eligibility_count ?? 1;

  useEffect(() => {
    setIsAllEditions(props.details?.subscribe_all_editions ?? false);
  }, [props.details?.subscribe_all_editions]);

  const setEditionPreference = async (allEditions: boolean): Promise<void> => {
    if (isDisabled || allEditions === isAllEditions) {
      return;
    }
    setIsUpdatingAllEditions(true);
    try {
      const { success } = await requestAuth();
      if (!success) {
        return;
      }
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
    <SubscriptionSettingSelect
      layout={props.layout ?? "row"}
      label={t(locale, "subscriptions.settings.editions")}
      labelNote={
        <span className="tw-text-xs tw-font-normal tw-text-iron-400">
          {props.details
            ? t(locale, "subscriptions.settings.eligibilityBadge", {
                count: formatInteger(locale, subscriptionEligibilityCount),
              })
            : t(locale, "subscriptions.settings.loading")}
        </span>
      }
      value={isAllEditions}
      valueLabel={
        !props.details ? t(locale, "subscriptions.settings.loading") : undefined
      }
      disabled={isDisabled}
      busy={isUpdatingAllEditions}
      onChange={(all) => {
        void setEditionPreference(all);
      }}
      options={[
        {
          value: false,
          label: t(locale, "subscriptions.coverage.editions.one"),
          description: t(locale, "subscriptions.settings.oneDescription"),
        },
        {
          value: true,
          label: t(locale, "subscriptions.settings.all"),
          description: t(locale, "subscriptions.settings.allDescription"),
        },
      ]}
    />
  );
}
