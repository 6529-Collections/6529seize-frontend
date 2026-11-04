"use client";

import type { SubscriptionDetails } from "@/generated/models/SubscriptionDetails";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import UserPageSubscriptionsAirdropAddress, {
  type AirdropAddressResult,
} from "./UserPageSubscriptionsAirdropAddress";
import UserPageSubscriptionsEditionPreference from "./UserPageSubscriptionsEditionPreference";
import UserPageSubscriptionsMode from "./UserPageSubscriptionsMode";
import UserPageSubscriptionsResponsivePanel from "./UserPageSubscriptionsResponsivePanel";

export default function UserPageSubscriptionsSettings({
  profileKey,
  details,
  readonly,
  refresh,
  airdrop,
  fetchingAirdrop,
}: Readonly<{
  profileKey: string;
  details: SubscriptionDetails | undefined;
  readonly: boolean;
  refresh: () => void;
  airdrop: AirdropAddressResult | undefined;
  fetchingAirdrop: boolean;
}>) {
  const locale = useBrowserLocale();
  return (
    <UserPageSubscriptionsResponsivePanel
      id="profile-subscriptions-settings"
      className="lg:tw-col-start-2 lg:tw-row-start-1 lg:tw-flex lg:tw-flex-col"
      headerClassName="lg:tw-min-h-11"
      title={t(locale, "subscriptions.page.settingsTitle")}
      summary={
        details ? (
          <>
            <span className={details.automatic ? "tw-text-emerald-300" : ""}>
              {t(
                locale,
                details.automatic
                  ? "subscriptions.coverage.mode.automatic"
                  : "subscriptions.coverage.mode.manual"
              )}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {t(
                locale,
                details.subscribe_all_editions
                  ? "subscriptions.settings.all"
                  : "subscriptions.coverage.editions.one"
              )}
            </span>
          </>
        ) : (
          t(locale, "subscriptions.settings.loading")
        )
      }
    >
      <div
        className={`tw-grid tw-grid-cols-1 tw-items-start tw-gap-x-4 tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-white/[0.06] tw-rounded-xl tw-bg-iron-950 tw-px-4 tw-py-[18px] sm:tw-p-5 md:tw-divide-y-0 lg:tw-flex lg:tw-flex-1 lg:tw-flex-col lg:tw-justify-between lg:tw-gap-6 lg:tw-p-7 ${readonly ? "md:tw-grid-cols-3" : "md:tw-grid-cols-2"}`}
      >
        <div className="tw-w-full tw-min-w-0 tw-max-w-full">
          <UserPageSubscriptionsMode
            layout="inline"
            profileKey={profileKey}
            details={details}
            readonly={readonly}
            refresh={refresh}
          />
        </div>
        <div className="tw-w-full tw-min-w-0 tw-max-w-full">
          <UserPageSubscriptionsEditionPreference
            layout="inline"
            profileKey={profileKey}
            details={details}
            readonly={readonly}
            refresh={refresh}
          />
        </div>
        <div
          className={`tw-w-full tw-min-w-0 tw-max-w-full ${readonly ? "" : "md:tw-col-span-2 lg:tw-col-span-1"}`}
        >
          <UserPageSubscriptionsAirdropAddress
            layout="inline"
            show_edit={!readonly}
            airdrop={airdrop}
            fetching={fetchingAirdrop}
          />
        </div>
      </div>
    </UserPageSubscriptionsResponsivePanel>
  );
}
