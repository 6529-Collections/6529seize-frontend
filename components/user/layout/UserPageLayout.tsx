"use client";

import {
  QueryKey,
  ReactQueryWrapperContext,
} from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useSetTitle } from "@/contexts/TitleContext";
import { ApiIdentity } from "@/generated/models/ApiIdentity";
import { containsEmojis, formatAddress } from "@/helpers/Helpers";
import { useIdentity } from "@/hooks/useIdentity";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { ReactNode, useContext } from "react";
import UserPageHeader from "../user-page-header/UserPageHeader";
import UserPageTabs from "./UserPageTabs";

export default function UserPageLayout({
  profile: initialProfile,
  children,
}: {
  readonly profile: ApiIdentity;
  readonly children: ReactNode;
}) {
  const queryClient = useQueryClient();
  const params = useParams();
  const { setProfile } = useContext(ReactQueryWrapperContext);
  const handleOrWallet = params?.user?.toString().toLowerCase() ?? "";

  const profileInit = queryClient.getQueryData<ApiIdentity>([
    QueryKey.PROFILE,
    handleOrWallet,
  ]);

  if (!profileInit) {
    setProfile(initialProfile);
  }

  const { profile } = useIdentity({
    handleOrWallet: handleOrWallet,
    initialProfile: initialProfile,
  });

  const getTitle = (): string => {
    if (profile?.handle) {
      return profile.handle;
    }

    if (profile?.display && !containsEmojis(profile.display)) {
      return profile.display;
    }
    return formatAddress(handleOrWallet);
  };

  const pagenameFull = `${getTitle()} | 6529.io`;
  useSetTitle(pagenameFull);

  const mainAddress = profile?.primary_wallet ?? handleOrWallet.toLowerCase();

  return (
    <main className="tw-min-h-[100dvh] tailwind-scope">
      <div className="tw-bg-iron-950 tw-min-h-screen tw-pb-16 lg:tw-pb-20">
        <UserPageHeader
          profile={profile ?? initialProfile}
          mainAddress={mainAddress}
        />
        <div className="tw-px-4 min-[992px]:tw-px-3 min-[992px]:tw-max-w-[960px] max-[1100px]:tw-max-w-[950px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px] tw-mx-auto">
          <UserPageTabs />
          <div className="tw-mt-6 lg:tw-mt-8">{children}</div>
        </div>
      </div>
    </main>
  );
}
