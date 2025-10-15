import { ApiIdentity } from "@/generated/models/ApiIdentity";
import { CicStatement } from "@/entities/IProfile";
import { ReactNode } from "react";
import UserPageHeader from "../user-page-header/UserPageHeader";
import UserPageTabs from "./UserPageTabs";
import UserPageClientHydrator from "./UserPageClientHydrator";

export type UserPageLayoutProps = {
  readonly profile: ApiIdentity;
  readonly handleOrWallet: string;
  readonly children: ReactNode;
  readonly initialStatements?: CicStatement[];
};

export default function UserPageLayout({
  profile: initialProfile,
  handleOrWallet,
  children,
  initialStatements,
}: UserPageLayoutProps) {
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
          initialStatements={initialStatements}
        />
        <div className="tw-px-4 min-[992px]:tw-px-3 min-[992px]:tw-max-w-[960px] max-[1100px]:tw-max-w-[950px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px] tw-mx-auto">
          <UserPageTabs />
          <div className="tw-mt-6 lg:tw-mt-8">{children}</div>
        </div>
      </div>
    </main>
  );
}
