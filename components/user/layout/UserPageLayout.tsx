import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { Suspense, type ReactNode } from "react";
import UserPageHeader from "../user-page-header/UserPageHeader";
import UserPageHeaderSkeleton from "../user-page-header/UserPageHeaderSkeleton";
import UserPageTabs from "./UserPageTabs";
import UserPageNavigation from "./UserPageNavigation";

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
    <UserPageNavigation>
      <main
        data-profile-shell
        className="tailwind-scope tw-flex tw-min-h-[100dvh] tw-flex-col"
      >
        <div className="tw-flex-1 tw-border-y-0 tw-border-l-0 tw-border-r tw-border-solid tw-border-iron-800 tw-bg-black tw-pb-16 lg:tw-pb-20">
          {/* The header loads statements, join date, follower count and CMS
              site from the API. Streaming it keeps those requests out of the
              first flush; the route layout has already confirmed the profile
              exists. */}
          <Suspense fallback={<UserPageHeaderSkeleton />}>
            <UserPageHeader
              profile={initialProfile}
              handleOrWallet={normalizedHandleOrWallet}
              fallbackMainAddress={mainAddress}
            />
          </Suspense>
          <div className="tw-mx-auto tw-px-4 sm:tw-px-6 md:tw-px-8">
            <Suspense fallback={<UserPageTabsFallback />}>
              <UserPageTabs initialProfile={initialProfile} />
            </Suspense>
            <div className="tw-mt-6 lg:tw-mt-8">{children}</div>
          </div>
        </div>
      </main>
    </UserPageNavigation>
  );
}
