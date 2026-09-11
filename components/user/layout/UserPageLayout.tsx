import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { Suspense, type ReactNode } from "react";
import UserPageHeader from "../user-page-header/UserPageHeader";
import UserPageClientHydrator from "./UserPageClientHydrator";
import UserPageDropModal from "./UserPageDropModal";
import UserPageTabTransition from "./UserPageTabTransition";
import UserPageTabs from "./UserPageTabs";

function UserPageTabsFallback() {
  return (
    <div
      aria-hidden="true"
      className="tw-min-h-[3.5rem] tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-700"
    />
  );
}

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
  const primaryWallet = initialProfile.primary_wallet as
    | string
    | null
    | undefined;
  const mainAddress = primaryWallet ?? normalizedHandleOrWallet;

  return (
    <main className="tailwind-scope tw-flex tw-min-h-[100dvh] tw-flex-col">
      <UserPageDropModal />
      <UserPageClientHydrator
        profile={initialProfile}
        handleOrWallet={normalizedHandleOrWallet}
      />
      <div className="tw-flex-1 tw-border-y-0 tw-border-l-0 tw-border-r tw-border-solid tw-border-iron-800 tw-bg-black tw-pb-16 lg:tw-pb-20">
        <UserPageHeader
          profile={initialProfile}
          handleOrWallet={normalizedHandleOrWallet}
          fallbackMainAddress={mainAddress}
        />
        <div className="tw-mx-auto tw-px-4 sm:tw-px-6 md:tw-px-8">
          <Suspense fallback={<UserPageTabsFallback />}>
            <UserPageTabs initialProfile={initialProfile} />
          </Suspense>
          <div className="tw-mt-6 lg:tw-mt-8">
            <UserPageTabTransition>{children}</UserPageTabTransition>
          </div>
        </div>
      </div>
    </main>
  );
}
