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
  detailsError = false,
  airdropError = false,
}: Readonly<{
  profileKey: string;
  details: SubscriptionDetails | undefined;
  readonly: boolean;
  refresh: () => void;
  airdrop: AirdropAddressResult | undefined;
  fetchingAirdrop: boolean;
  detailsError?: boolean | undefined;
  airdropError?: boolean | undefined;
}>) {
  const locale = useBrowserLocale();
  const missingDetailsLabel = t(
    locale,
    detailsError
      ? "subscriptions.details.unavailable"
      : "subscriptions.settings.loading"
  );
  return (
    <UserPageSubscriptionsResponsivePanel
      id="profile-subscriptions-settings"
      className="lg:tw-col-start-2 lg:tw-row-start-1 lg:tw-flex lg:tw-flex-col"
      headerClassName="lg:tw-min-h-11"
      title={t(locale, "subscriptions.page.settingsTitle")}
      summary={
        details ? (
          <>
            <span
              className={`tw-inline-flex tw-items-center tw-gap-1.5 ${details.automatic ? "tw-text-emerald-300" : ""}`}
            >
              {details.automatic && (
                <span
                  aria-hidden="true"
                  className="tw-size-1.5 tw-rounded-full tw-bg-emerald-400"
                />
              )}
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
          missingDetailsLabel
        )
      }
    >
      <div className="tw-grid tw-grid-cols-1 tw-items-start tw-gap-x-4 tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-white/[0.06] tw-rounded-xl tw-bg-iron-950 tw-px-4 tw-py-[18px] sm:tw-p-5 md:tw-divide-y-0 lg:tw-flex lg:tw-flex-1 lg:tw-flex-col lg:tw-gap-6 lg:tw-p-7">
        <div className="tw-w-full tw-min-w-0 tw-max-w-full">
          <UserPageSubscriptionsMode
            layout="inline"
            profileKey={profileKey}
            details={details}
            error={detailsError}
            readonly={readonly}
            refresh={refresh}
          />
        </div>
        <div className="tw-w-full tw-min-w-0 tw-max-w-full">
          <UserPageSubscriptionsEditionPreference
            layout="inline"
            profileKey={profileKey}
            details={details}
            error={detailsError}
            readonly={readonly}
            refresh={refresh}
          />
        </div>
        <div className="tw-w-full tw-min-w-0 tw-max-w-full">
          <UserPageSubscriptionsAirdropAddress
            layout="inline"
            show_edit={!readonly}
            airdrop={airdrop}
            fetching={fetchingAirdrop}
            error={airdropError}
          />
        </div>
      </div>
    </UserPageSubscriptionsResponsivePanel>
  );
}
