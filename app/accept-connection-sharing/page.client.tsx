"use client";

import { Capacitor } from "@capacitor/core";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { Spinner } from "@/components/dotLoader/DotLoader";
import { useSetTitle } from "@/contexts/TitleContext";
import { areEqualAddresses } from "@/helpers/Helpers";
import { useIdentity } from "@/hooks/useIdentity";
import { canStoreAnotherWalletAccount } from "@/services/auth/auth.utils";
import {
  persistSessionResponse,
  redeemConnectionShare,
} from "@/services/auth/session-v2.utils";
import TransferModalPfp from "@/components/nft-transfer/TransferModalPfp";

interface AcceptConnectionSharingProps {
  connectionShareCode: string;
  address: string;
}

type SharedProfile = ReturnType<typeof useIdentity>["profile"];
type SetToast = ReturnType<typeof useAuth>["setToast"];

function getSharedProfileName(
  profile: SharedProfile,
  address: string
): string {
  if (profile?.handle) {
    return profile.handle;
  }
  if (profile?.display) {
    return profile.display;
  }
  if (address) {
    return `${address.slice(0, 6)}…${address.slice(-4)}`;
  }
  return "Shared connection";
}

function HomeLinkCard({ message }: Readonly<{ message: string }>) {
  return (
    <div className="tw-rounded-lg tw-bg-white/5 tw-p-6">
      <p className="tw-text-base tw-text-neutral-300">{message}</p>
      <p className="tw-mt-4">
        <Link
          href="/"
          className="tw-text-sm tw-font-medium tw-text-emerald-400 hover:tw-underline"
        >
          Take me home
        </Link>
      </p>
    </div>
  );
}

function IncomingConnectionCard({
  profile,
  profileLoading,
  address,
}: Readonly<{
  profile: SharedProfile;
  profileLoading: boolean;
  address: string;
}>) {
  const profileName = getSharedProfileName(profile, address);

  return (
    <section className="tw-rounded-2xl tw-border tw-border-solid tw-border-white/[0.03] tw-bg-iron-950 tw-p-5">
      <h2 className="tw-mb-4 tw-text-sm tw-font-semibold tw-uppercase tw-tracking-wide tw-text-neutral-400">
        Incoming connection from
      </h2>
      {profileLoading ? (
        <div className="tw-flex tw-items-center tw-gap-3 tw-py-2">
          <div className="tw-h-14 tw-w-14 tw-animate-pulse tw-rounded-full tw-bg-white/10" />
          <div className="tw-flex tw-flex-1 tw-flex-col tw-gap-2">
            <div className="tw-h-4 tw-w-32 tw-animate-pulse tw-rounded tw-bg-white/10" />
            <div className="tw-h-3 tw-w-24 tw-animate-pulse tw-rounded tw-bg-white/10" />
          </div>
        </div>
      ) : (
        <div className="tw-flex tw-items-center tw-gap-4">
          <TransferModalPfp
            src={profile?.pfp ?? null}
            alt={profileName}
            level={profile?.level ?? 0}
            size={56}
          />
          <div className="tw-min-w-0 tw-flex-1">
            <div className="tw-truncate tw-text-base tw-font-medium tw-text-white">
              {profileName}
            </div>
            {profile ? (
              <div className="tw-mt-1 tw-truncate tw-text-sm tw-text-neutral-400">
                TDH: {(profile.tdh ?? 0).toLocaleString()} · Level:{" "}
                {profile.level ?? 0}
              </div>
            ) : null}
            {address ? (
              <div className="tw-mt-0.5 tw-truncate tw-font-mono tw-text-[11px] tw-text-neutral-500">
                {address}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}

function CurrentProfileNotice({
  connectedAddress,
  connectedProfile,
  acceptingConnection,
}: Readonly<{
  connectedAddress: string | undefined;
  connectedProfile: ReturnType<typeof useAuth>["connectedProfile"];
  acceptingConnection: boolean;
}>) {
  const shouldShowNotice =
    Boolean(connectedAddress) && acceptingConnection === false;
  if (shouldShowNotice) {
    return (
      <p className="tw-text-center tw-text-sm tw-text-neutral-400">
        Your current profile
        {connectedProfile?.handle ? <> @{connectedProfile.handle}</> : null}{" "}
        will stay available.
        <br />
        You can switch between both after accepting.
      </p>
    );
  }

  return null;
}

function AcceptConnectionButton({
  acceptingConnection,
  onAccept,
}: Readonly<{
  acceptingConnection: boolean;
  onAccept: () => void;
}>) {
  return (
    <div className="tw-flex tw-justify-center">
      <button
        type="button"
        disabled={acceptingConnection}
        aria-disabled={acceptingConnection}
        aria-busy={acceptingConnection}
        onClick={onAccept}
        className="tw-flex tw-min-w-[200px] tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-border-0 tw-bg-primary-500 tw-px-6 tw-py-3 tw-text-sm tw-font-semibold tw-text-white tw-shadow-none tw-outline-none tw-ring-0 tw-transition-colors hover:tw-bg-primary-600 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-400 focus:tw-ring-offset-2 focus:tw-ring-offset-iron-950 disabled:tw-cursor-not-allowed disabled:tw-opacity-70"
      >
        {acceptingConnection ? (
          <>
            Processing <Spinner dimension={18} />
          </>
        ) : (
          "Accept connection"
        )}
      </button>
    </div>
  );
}

async function acceptConnectionShare({
  address,
  connectionShareCode,
  setToast,
  seizeAcceptConnection,
  routerPush,
}: {
  readonly address: string;
  readonly connectionShareCode: string;
  readonly setToast: SetToast;
  readonly seizeAcceptConnection: (address: string) => void;
  readonly routerPush: (path: string) => void;
}): Promise<boolean> {
  if (address && canStoreAnotherWalletAccount(address) === false) {
    setToast({
      message: "Maximum connected profiles reached",
      type: "error",
    });
    return false;
  }

  const redeemResponse = await redeemConnectionShare(connectionShareCode);
  const hasValidRedeemResponse =
    !!redeemResponse.address &&
    !!redeemResponse.access_token &&
    (!address || areEqualAddresses(redeemResponse.address, address));
  if (hasValidRedeemResponse === false) {
    setToast({ message: "Invalid connection response", type: "error" });
    return false;
  }

  if (canStoreAnotherWalletAccount(redeemResponse.address) === false) {
    setToast({
      message: "Maximum connected profiles reached",
      type: "error",
    });
    return false;
  }

  const didPersistJwt = await persistSessionResponse(redeemResponse);
  if (didPersistJwt === false) {
    setToast({
      message: "Failed to store connected profile",
      type: "error",
    });
    return false;
  }

  seizeAcceptConnection(redeemResponse.address);
  routerPush("/");
  return true;
}

function ConnectionSharingContent({
  hasUnsupportedWebConnectionShare,
  isConnectionShareFlow,
  profile,
  profileLoading,
  address,
  connectedAddress,
  connectedProfile,
  acceptingConnection,
  onAccept,
}: Readonly<{
  hasUnsupportedWebConnectionShare: boolean;
  isConnectionShareFlow: boolean;
  profile: SharedProfile;
  profileLoading: boolean;
  address: string;
  connectedAddress: string | undefined;
  connectedProfile: ReturnType<typeof useAuth>["connectedProfile"];
  acceptingConnection: boolean;
  onAccept: () => void;
}>) {
  if (hasUnsupportedWebConnectionShare) {
    return (
      <HomeLinkCard message="Open this connection link in the 6529 mobile app." />
    );
  }

  if (isConnectionShareFlow) {
    return (
      <div className="tw-space-y-6">
        <IncomingConnectionCard
          profile={profile}
          profileLoading={profileLoading}
          address={address}
        />
        <CurrentProfileNotice
          connectedAddress={connectedAddress}
          connectedProfile={connectedProfile}
          acceptingConnection={acceptingConnection}
        />
        <AcceptConnectionButton
          acceptingConnection={acceptingConnection}
          onAccept={onAccept}
        />
      </div>
    );
  }

  return <HomeLinkCard message="Missing required parameters" />;
}

function AcceptConnectionSharing(
  props: Readonly<AcceptConnectionSharingProps>
) {
  const router = useRouter();
  const { setToast, connectedProfile } = useAuth();
  const { seizeAcceptConnection, address: connectedAddress } =
    useSeizeConnectContext();

  const { connectionShareCode, address } = props;
  const [acceptingConnection, setAcceptingConnection] = useState(false);
  const hasConnectionShareCode = connectionShareCode.trim().length > 0;
  const hasUnsupportedWebConnectionShare =
    hasConnectionShareCode && !Capacitor.isNativePlatform();
  const isConnectionShareFlow =
    hasConnectionShareCode && Capacitor.isNativePlatform();

  const { profile, isLoading: profileLoading } = useIdentity({
    handleOrWallet: address || null,
    initialProfile: null,
  });

  useSetTitle("Accept Connection Sharing");

  const acceptConnection = async () => {
    try {
      if (isConnectionShareFlow) {
        const accepted = await acceptConnectionShare({
          address,
          connectionShareCode,
          setToast,
          seizeAcceptConnection,
          routerPush: (path) => router.push(path),
        });
        if (!accepted) {
          setAcceptingConnection(false);
        }
      }
    } catch (error) {
      console.error(error);
      setToast({
        message: "Couldn't accept this connection. Please try again.",
        type: "error",
      });
      setAcceptingConnection(false);
    }
  };

  return (
    <main className="tw-min-h-[100dvh] tw-bg-black">
      <div className="tw-mx-auto tw-max-w-2xl tw-px-4 tw-pb-8 tw-pt-12 sm:tw-px-6">
        <header className="tw-mb-8">
          <h1 className="tw-text-2xl tw-font-bold tw-text-white">
            Accept Connection Sharing
          </h1>
        </header>

        <ConnectionSharingContent
          hasUnsupportedWebConnectionShare={hasUnsupportedWebConnectionShare}
          isConnectionShareFlow={isConnectionShareFlow}
          profile={profile}
          profileLoading={profileLoading}
          address={address}
          connectedAddress={connectedAddress}
          connectedProfile={connectedProfile}
          acceptingConnection={acceptingConnection}
          onAccept={() => {
            if (acceptingConnection) return;
            setAcceptingConnection(true);
            void acceptConnection();
          }}
        />
      </div>
    </main>
  );
}

export default function AcceptConnectionSharingPage() {
  const searchParams = useSearchParams();
  const connectionShareCode = searchParams?.get("connection_share_code") || "";
  const address = searchParams?.get("address") || "";
  return (
    <AcceptConnectionSharing
      connectionShareCode={connectionShareCode}
      address={address}
    />
  );
}
