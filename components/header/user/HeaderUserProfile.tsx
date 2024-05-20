import { useContext, useEffect, useState } from "react";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import { ProfileProxy } from "../../../generated/models/ProfileProxy";
import { AuthContext } from "../../auth/Auth";
import { useAccount } from "wagmi";
import Link from "next/link";

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
  const { activeProfileProxy } = useContext(AuthContext);
  const { address } = useAccount();
  const getLabel = (): string => {
    if (activeProfileProxy) {
      return `${activeProfileProxy.created_by.handle}`;
    }
    if (profile.profile?.handle) {
      return profile.profile.handle;
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
      return `${activeProfileProxy.created_by.handle}`;
    }
    if (profile.profile?.handle) {
      return `${profile.profile.handle}`;
    }
    const wallet = profile?.consolidation.wallets.find(
      (w) => w.wallet.address.toLowerCase() === address?.toLocaleLowerCase()
    );
    if (wallet?.wallet?.ens) {
      return `${wallet.wallet.ens}`;
    }
    if (address) {
      return `${address}`;
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
      className="tw-no-underline tw-px-4 tw-h-11 tw-inline-flex tw-items-center tw-gap-x-3 tw-text-base tw-font-semibold tw-border tw-border-solid tw-rounded-s-lg focus:tw-z-10 focus:tw-ring-2 focus:tw-ring-blue-700 focus:tw-text-blue-700 tw-bg-iron-800 tw-border-iron-700 tw-text-white hover:tw-bg-iron-700 tw-focus:ring-blue-500 tw-focus:text-white tw-transition tw-duration-300 tw-ease-out"
    >
      {userContent.pfpUrl ? (
        <img
          src={userContent.pfpUrl}
          alt="Profile Picture"
          className="tw-flex-shrink-0 tw-h-6 tw-w-6 tw-flex-none tw-rounded-lg tw-bg-iron-800 tw-ring-1 tw-ring-white/30"
        />
      ) : (
        <div className="tw-flex-shrink-0 tw-h-6 tw-w-6 tw-flex-none tw-rounded-lg tw-bg-iron-800 tw-ring-1 tw-ring-white/30"></div>
      )}
      <div className="tw-flex tw-gap-x-2 tw-items-center">
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
