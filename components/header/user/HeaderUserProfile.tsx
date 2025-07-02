"use client";

import { useEffect, useState } from "react";
import { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useAuth } from "@/components/auth/Auth";
import Link from "next/link";
import { Tooltip } from "react-tooltip";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";

interface UserContent {
  readonly label: string;
  readonly isProxy: boolean;
  readonly pfpUrl: string | null;
  readonly path: string;
}

export default function HeaderUserProfile({
  profile,
}: {
  readonly profile: ApiIdentity;
}) {
  const { activeProfileProxy } = useAuth();
  const { address, isConnected } = useSeizeConnectContext();

  const getLabel = (): string => {
    if (activeProfileProxy) return activeProfileProxy.created_by.handle ?? "";
    if (profile?.handle) return profile.handle.slice(0, 20);
    const wallet = profile?.wallets?.find(
      (w) => w.wallet.toLowerCase() === address?.toLowerCase()
    );
    if (wallet?.display) return wallet.display;
    if (address) return address.slice(0, 6);
    throw new Error("No label found");
  };

  const getIsProxy = (): boolean => !!activeProfileProxy;

  const getPfpUrl = (): string | null => {
    if (activeProfileProxy) return activeProfileProxy.created_by.pfp ?? null;
    return profile?.pfp ?? null;
  };

  const getPath = (): string => {
    if (activeProfileProxy) return `/${activeProfileProxy.created_by.handle}`;
    if (profile?.handle) return `/${profile.handle}`;
    const wallet = profile?.wallets?.find(
      (w) => w.wallet.toLowerCase() === address?.toLowerCase()
    );
    if (wallet?.display) return `/${wallet.display}`;
    if (address) return `/${address}`;
    throw new Error("No path found");
  };

  const getUserContent = (): UserContent => ({
    label: getLabel(),
    isProxy: getIsProxy(),
    pfpUrl: getPfpUrl(),
    path: getPath(),
  });

  const [userContent, setUserContent] = useState<UserContent>(getUserContent());

  useEffect(() => {
    setUserContent(getUserContent());
  }, [profile, address, activeProfileProxy]);

  return (
    <>
      <Tooltip
        variant="light"
        id="status-tooltip"
        className="tw-z-[9999] tw-font-normal tw-text-sm"
        place="bottom"
      />
      <Link
        href={`${userContent.path}`}
        className="tailwind-scope tw-relative tw-group tw-no-underline tw-px-3.5 lg:tw-px-3 xl:tw-px-3.5 tw-h-10 tw-inline-flex tw-items-center tw-gap-x-2 tw-text-base lg:tw-text-sm xl:tw-text-base tw-font-semibold tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-border-0 tw-rounded-s-lg focus:!tw-outline focus-visible:!tw-outline focus-visible:!tw-outline-2 focus-visible:!tw-outline-primary-400 tw-bg-iron-800 tw-text-white hover:tw-text-white hover:tw-bg-iron-700 tw-transition tw-duration-300 tw-ease-out">
        {userContent.pfpUrl ? (
          <img
            src={userContent.pfpUrl}
            alt="Profile Picture"
            className="tw-flex-shrink-0 tw-max-h-7 tw-max-w-7 -tw-ml-1 tw-flex-none tw-rounded-md tw-bg-iron-700"
          />
        ) : (
          <div className="tw-flex-shrink-0 tw-h-7 tw-w-7 -tw-ml-1 tw-flex-none tw-rounded-md tw-bg-iron-700 group-hover:tw-bg-iron-600 tw-transition tw-duration-300 tw-ease-out"></div>
        )}
        <div className="tw-flex tw-gap-x-2 tw-items-center">
          <div
            data-testid="status-circle"
            data-tooltip-id="status-tooltip"
            data-tooltip-content={
              isConnected
                ? "Connected and Authenticated"
                : "Authenticated (wallet not connected)"
            }
            className="tw-w-2 tw-h-2 tw-rounded-full"
            style={{
              backgroundColor: isConnected ? "rgb(0,220,33)" : "rgb(255,159,0)",
              boxShadow: `0 0 12px ${
                isConnected ? "rgba(0,220,33,1)" : "rgba(255,159,0,1)"
              }`,
            }}></div>
          <span>{userContent.label}</span>
          {userContent.isProxy && (
            <span className="tw-text-sm tw-text-iron-300 tw-italic tw-font-normal">
              Proxy
            </span>
          )}
        </div>
      </Link>
    </>
  );
}
