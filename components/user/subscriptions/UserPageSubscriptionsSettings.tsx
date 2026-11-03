"use client";

import type { SubscriptionDetails } from "@/generated/models/SubscriptionDetails";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useScrollToHashOnMount } from "@/hooks/useScrollToHashOnMount";
import { t } from "@/i18n/messages";
import UserPageSubscriptionsAirdropAddress, {
  type AirdropAddressResult,
} from "./UserPageSubscriptionsAirdropAddress";
import UserPageSubscriptionsEditionPreference from "./UserPageSubscriptionsEditionPreference";
import UserPageSubscriptionsMode from "./UserPageSubscriptionsMode";
import UserPageSubscriptionsSection from "./UserPageSubscriptionsSection";

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
  useScrollToHashOnMount("profile-subscriptions-settings", {
    focusId: "profile-subscriptions-settings-title",
  });

  return (
    <UserPageSubscriptionsSection
      id="profile-subscriptions-settings"
      title={t(locale, "subscriptions.page.settingsTitle")}
    >
      <div className="tw-flex tw-flex-col tw-items-stretch tw-gap-x-8 tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-white/[0.06] tw-rounded-xl tw-bg-iron-950 tw-px-4 tw-py-1 tw-shadow-lg tw-ring-1 tw-ring-white/[0.03] md:tw-px-5 xl:tw-flex-row xl:tw-flex-wrap xl:tw-items-baseline xl:tw-gap-y-3 xl:tw-divide-y-0 xl:tw-py-3">
        <div className="tw-w-full tw-min-w-0 tw-max-w-full xl:tw-w-auto">
          <UserPageSubscriptionsMode
            layout="inline"
            profileKey={profileKey}
            details={details}
            readonly={readonly}
            refresh={refresh}
          />
        </div>
        <div className="tw-w-full tw-min-w-0 tw-max-w-full xl:tw-w-auto">
          <UserPageSubscriptionsEditionPreference
            layout="inline"
            profileKey={profileKey}
            details={details}
            readonly={readonly}
            refresh={refresh}
          />
        </div>
        <div className="tw-w-full tw-min-w-0 xl:tw-w-auto xl:tw-flex-1 xl:tw-basis-[24rem]">
          <UserPageSubscriptionsAirdropAddress
            layout="inline"
            show_edit={!readonly}
            airdrop={airdrop}
            fetching={fetchingAirdrop}
          />
        </div>
      </div>
    </UserPageSubscriptionsSection>
  );
}
