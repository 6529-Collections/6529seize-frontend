import { ApiIdentity } from "@/generated/models/ApiIdentity";
import { CicStatement } from "@/entities/IProfile";
import { ReactNode, Suspense } from "react";
import CommonSkeletonLoader from "@/components/utils/animation/CommonSkeletonLoader";
import UserPageHeader from "../user-page-header/UserPageHeader";
import UserPageTabs from "./UserPageTabs";
import UserPageClientHydrator from "./UserPageClientHydrator";

export type UserPageLayoutProps = {
  readonly profile: ApiIdentity;
  readonly handleOrWallet: string;
  readonly children: ReactNode;
  readonly initialStatements?: CicStatement[];
  readonly profileEnabledAt?: string | null;
  readonly followersCount?: number | null;
};

function UserPageHeaderFallback() {
  return (
    <div className="tw-bg-iron-900 tw-border-b tw-border-iron-800 tw-py-8">
      <div className="tw-px-2 lg:tw-px-6 xl:tw-px-8 tw-mx-auto">
        <CommonSkeletonLoader />
      </div>
    </div>
  );
}

export default function UserPageLayout({
  profile: initialProfile,
  handleOrWallet,
  children,
  initialStatements,
  profileEnabledAt,
  followersCount,
}: Readonly<UserPageLayoutProps>) {
  const normalizedHandleOrWallet = handleOrWallet.toLowerCase();
  const mainAddress =
    initialProfile?.primary_wallet ?? normalizedHandleOrWallet;

  return (
    <main className="tw-min-h-[100dvh] tailwind-scope">
      <UserPageClientHydrator
        profile={initialProfile}
        handleOrWallet={normalizedHandleOrWallet}
      />
      <div className="tw-bg-iron-950 tw-min-h-screen tw-pb-16 lg:tw-pb-20">
        <Suspense fallback={<UserPageHeaderFallback />}>
          <UserPageHeader
            profile={initialProfile}
            handleOrWallet={normalizedHandleOrWallet}
            fallbackMainAddress={mainAddress}
            initialStatements={initialStatements}
            profileEnabledAt={profileEnabledAt}
            followersCount={followersCount}
          />
        </Suspense>
        <div className="tw-px-2 lg:tw-px-6 xl:tw-px-8 tw-mx-auto">
          <UserPageTabs />
          <div className="tw-mt-6 lg:tw-mt-8">{children}</div>
        </div>
      </div>
    </main>
  );
}
