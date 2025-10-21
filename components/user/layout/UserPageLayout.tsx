import { ApiIdentity } from "@/generated/models/ApiIdentity";
import { ReactNode } from "react";
import UserPageHeader from "../user-page-header/UserPageHeader";
import UserPageTabs from "./UserPageTabs";
import UserPageClientHydrator from "./UserPageClientHydrator";

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
    <main className="tw-min-h-[100dvh] tailwind-scope">
      <UserPageClientHydrator
        profile={initialProfile}
        handleOrWallet={normalizedHandleOrWallet}
      />
      <div className="tw-bg-iron-950 tw-min-h-screen tw-pb-16 lg:tw-pb-20">
        <UserPageHeader
          profile={initialProfile}
          handleOrWallet={normalizedHandleOrWallet}
          fallbackMainAddress={mainAddress}
        />
        <div className="tw-px-2 lg:tw-px-6 xl:tw-px-8 tw-mx-auto">
          <UserPageTabs />
          <div className="tw-mt-6 lg:tw-mt-8">{children}</div>
        </div>
      </div>
    </main>
  );
}
