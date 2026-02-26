import type { ApiIdentity } from "@/generated/models/ApiIdentity";

import UserPageHeader from "../user-page-header/UserPageHeader";

import UserPageClientHydrator from "./UserPageClientHydrator";
import UserPageDropModal from "./UserPageDropModal";
import UserPageTabs from "./UserPageTabs";

import type { ReactNode } from "react";

export default function UserPageLayout({
  profile: initialProfile,
  handleOrWallet,
  children,
}: {
  readonly profile: ApiIdentity;
  readonly handleOrWallet: string;
  readonly children: ReactNode;
}) {
  const normalizedHandleOrWallet = handleOrWallet.toLowerCase();
  const mainAddress =
    initialProfile?.primary_wallet ?? normalizedHandleOrWallet;

  return (
    <main className="tw-flex tw-flex-col tw-min-h-[100dvh] tailwind-scope">
      <UserPageDropModal />
      <UserPageClientHydrator
        profile={initialProfile}
        handleOrWallet={normalizedHandleOrWallet}
      />
      <div className="tw-flex-1 tw-bg-black tw-pb-16 lg:tw-pb-20 tw-border-r tw-border-iron-800 tw-border-solid tw-border-y-0 tw-border-l-0">
        <UserPageHeader
          profile={initialProfile}
          handleOrWallet={normalizedHandleOrWallet}
          fallbackMainAddress={mainAddress}
        />
        <div className="tw-px-4 sm:tw-px-6 md:tw-px-8 tw-mx-auto">
          <UserPageTabs />
          <div className="tw-mt-6 lg:tw-mt-8">{children}</div>
        </div>
      </div>
    </main>
  );
}
