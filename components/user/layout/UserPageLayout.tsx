import { ReactNode, useContext, useEffect, useState } from "react";
import { containsEmojis, formatAddress } from "../../../helpers/Helpers";
import UserPageHeader from "../user-page-header/UserPageHeader";
import { useRouter } from "next/router";
import { ApiIdentity } from "../../../generated/models/ApiIdentity";
import UserPageTabs from "./UserPageTabs";
import { useQueryClient } from "@tanstack/react-query";
import {
  QueryKey,
  ReactQueryWrapperContext,
} from "../../react-query-wrapper/ReactQueryWrapper";
import { useSetTitle } from "../../../contexts/TitleContext";
import { useIdentity } from "../../../hooks/useIdentity";

export default function UserPageLayout({
  profile: initialProfile,
  children,
}: {
  readonly profile: ApiIdentity;
  readonly children: ReactNode;
}) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { setProfile } = useContext(ReactQueryWrapperContext);
  const handleOrWallet = (router.query.user as string).toLowerCase();

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
  const [isLoadingTabData, setIsLoadingTabData] = useState(false);

  useEffect(() => {
    const handleStart = (toPath: string, options: { shallow: boolean }) => {
      const toUser = toPath.split("/")[1].toLowerCase();
      setIsLoadingTabData(
        toUser.toLowerCase() === (router.query.user as string).toLowerCase() &&
          !options.shallow
      );
    };

    const handleComplete = () => {
      setIsLoadingTabData(false);
    };

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleComplete);
    router.events.on("routeChangeError", handleComplete);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleComplete);
      router.events.off("routeChangeError", handleComplete);
    };
  }, [router.query.user]);

  return (
    <main className="tw-min-h-[100dvh] tailwind-scope">
      <div className="tw-bg-iron-950 tw-min-h-screen tw-pb-16 lg:tw-pb-20">
        <UserPageHeader
          profile={profile ?? initialProfile}
          mainAddress={mainAddress}
        />
        <div className="tw-px-4 min-[992px]:tw-px-3 min-[992px]:tw-max-w-[960px] max-[1100px]:tw-max-w-[950px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px] tw-mx-auto">
          <UserPageTabs />
          <div className="tw-mt-6 lg:tw-mt-8">
            {isLoadingTabData ? (
              <div className="tw-text-base tw-font-normal tw-text-iron-200">
                Loading...
              </div>
            ) : (
              children
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
