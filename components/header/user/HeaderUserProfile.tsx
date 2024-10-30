import { useEffect, useState } from "react";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import { useAuth } from "../../auth/Auth";
import Link from "next/link";
import Tippy from "@tippyjs/react";
import { useSeizeConnectContext } from "../../auth/SeizeConnectContext";
interface UserContent {
  readonly label: string;
  readonly isProxy: boolean;
  readonly pfpUrl: string | null;
  readonly path: string;
}

export default function HeaderUserProfile({
  profile,
}: {
  readonly profile: IProfileAndConsolidations;
}) {
  const { activeProfileProxy } = useAuth();
  const { address, isConnected } = useSeizeConnectContext();
  const getLabel = (): string => {
    if (activeProfileProxy) {
      return `${activeProfileProxy.created_by.handle}`;
    }
    if (profile.profile?.handle) {
      return profile.profile.handle.slice(0, 20);
    }
    const wallet = profile?.consolidation.wallets.find(
      (w) => w.wallet.address.toLowerCase() === address?.toLocaleLowerCase()
    );
    if (wallet?.wallet?.ens) {
      return wallet.wallet.ens;
    }
    if (address) {
      return address.slice(0, 6);
    }
    throw new Error("No label found");
  };

  const getIsProxy = (): boolean => !!activeProfileProxy;
  const getPfpUrl = (): string | null => {
    if (activeProfileProxy) {
      return activeProfileProxy.created_by.pfp ?? null;
    }
    return profile.profile?.pfp_url ?? null;
  };

  const getPath = (): string => {
    if (activeProfileProxy) {
      return `/${activeProfileProxy.created_by.handle}`;
    }
    if (profile.profile?.handle) {
      return `/${profile.profile.handle}`;
    }
    const wallet = profile?.consolidation.wallets.find(
      (w) => w.wallet.address.toLowerCase() === address?.toLocaleLowerCase()
    );
    if (wallet?.wallet?.ens) {
      return `/${wallet.wallet.ens}`;
    }
    if (address) {
      return `/${address}`;
    }
    throw new Error("No path found");
  };

  const getUserContent = (): UserContent => ({
    label: getLabel(),
    isProxy: getIsProxy(),
    pfpUrl: getPfpUrl(),
    path: getPath(),
  });

  const [userContent, setUserContent] = useState<UserContent>(getUserContent());

  useEffect(
    () => setUserContent(getUserContent()),
    [profile, address, activeProfileProxy]
  );

  return (
    <Link
      href={`${userContent.path}`}
      className="tailwind-scope tw-relative tw-group tw-no-underline tw-px-3.5 lg:tw-px-3 xl:tw-px-3.5 tw-h-10 tw-inline-flex tw-items-center tw-gap-x-2 tw-text-base lg:tw-text-sm xl:tw-text-base tw-font-semibold tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-border-0 tw-rounded-s-lg focus:!tw-outline focus-visible:!tw-outline focus-visible:!tw-outline-2 focus-visible:!tw-outline-primary-400 tw-bg-iron-800 tw-text-white hover:tw-text-white hover:tw-bg-iron-700 tw-transition tw-duration-300 tw-ease-out">
      {userContent.pfpUrl ? (
        <img
          src={userContent.pfpUrl}
          alt="Profile Picture"
          className="tw-flex-shrink-0 tw-h-7 tw-w-7 -tw-ml-1 tw-flex-none tw-rounded-md tw-bg-iron-700"
        />
      ) : (
        <div className="tw-flex-shrink-0 tw-h-7 tw-w-7 -tw-ml-1 tw-flex-none tw-rounded-md tw-bg-iron-700 group-hover:tw-bg-iron-600 tw-transition tw-duration-300 tw-ease-out"></div>
      )}
      <div className="tw-flex tw-gap-x-2 tw-items-center">
        {isConnected ? (
          <Tippy
            content="Connected and Authenticated"
            placement="top"
            theme="light">
            <div
              className="tw-w-2 tw-h-2 tw-rounded-full tw-shadow-[0_0_12px_rgba(0,220,33,1)]"
              style={{ backgroundColor: "rgb(0,220,33)" }}></div>
          </Tippy>
        ) : (
          <Tippy
            content="Authenticated (wallet not connected)"
            placement="top"
            theme="light">
            <div
              className="tw-w-2 tw-h-2 tw-rounded-full tw-shadow-[0_0_12px_rgba(255,159,0,1)]"
              style={{ backgroundColor: "rgb(255,159,0)" }}></div>
          </Tippy>
        )}
        <span>{userContent.label}</span>
        {userContent.isProxy && (
          <span className="tw-text-sm tw-text-iron-300 tw-italic tw-font-normal">
            Proxy
          </span>
        )}
      </div>
    </Link>
  );
}
