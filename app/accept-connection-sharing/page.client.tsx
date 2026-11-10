"use client";

import { faSignature } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { LockClosedIcon } from "@heroicons/react/24/outline";
import UserLevel from "@/components/user/utils/level/UserLevel";
import { Capacitor } from "@capacitor/core";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLayoutEffect, useRef, useState } from "react";
import { isAddress } from "viem";
import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { Spinner } from "@/components/dotLoader/DotLoader";
import { useSetTitle } from "@/contexts/TitleContext";
import type { ApiRedeemRefreshTokenRequest } from "@/generated/models/ApiRedeemRefreshTokenRequest";
import type { ApiRedeemRefreshTokenResponse } from "@/generated/models/ApiRedeemRefreshTokenResponse";
import { areEqualAddresses } from "@/helpers/Helpers";
import { useElectron } from "@/hooks/useElectron";
import { useHasHydrated } from "@/hooks/useHasHydrated";
import { useIdentity } from "@/hooks/useIdentity";
import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { commonApiPost } from "@/services/api/common-api";
import {
  canStoreAnotherWalletAccount,
  getConnectedWalletAccounts,
  setAuthJwt,
} from "@/services/auth/auth.utils";
import TransferModalPfp from "@/components/nft-transfer/TransferModalPfp";
import { MAX_CONNECTED_PROFILES } from "@/constants/constants";
import {
  acceptConnectionShare,
  CONNECTION_SETUP_FAILED,
  type SetupKeyRef,
} from "./accept-connection-share";

const ACCEPT_CONNECTION_LOCALE = DEFAULT_LOCALE;
const SETUP_SECRET_PARAM = "device_setup_key";
const SHARE_CODE_PARAM = "connection_share_code";
// Query parameters that carry connection credentials.
const CONNECTION_LINK_SECRET_PARAMS = ["token", SHARE_CODE_PARAM] as const;
// Fragment parameters that carry connection credentials.
const CONNECTION_FRAGMENT_SECRET_PARAMS = [
  SETUP_SECRET_PARAM,
  SHARE_CODE_PARAM,
] as const;

interface AcceptConnectionSharingProps {
  connectionShareCode: string;
  /** The share code may still arrive in the fragment, read after mount. */
  awaitingLink: boolean;
  token: string;
  address: string;
  role: string | undefined;
  setupSecret: SetupKeyRef;
  includesDeviceSetup: boolean;
}

type SharedProfile = ReturnType<typeof useIdentity>["profile"];
type SetToast = ReturnType<typeof useAuth>["setToast"];
type ConnectionShell = "pending" | "native-app" | "desktop-app" | "browser";
type ConnectionFlow =
  | "pending"
  | "native-share"
  | "legacy-desktop"
  | "unsupported-native-share"
  | "unsupported-legacy-desktop"
  | "missing-parameters";

/** The link's wallet address, or "" when it is absent or not an address. */
function toLinkAddress(value: string | null | undefined): string {
  const address = value?.trim() ?? "";
  return isAddress(address, { strict: false }) ? address : "";
}

/**
 * Removes connection credentials from the visible URL without navigating.
 * Reusing the current Next.js history state keeps the router (and so
 * useSearchParams) unchanged, so no request is made and the accept action
 * still reads the link values.
 */
function removeConnectionSecretsFromAddressBar(): void {
  const url = new URL(globalThis.location.href);
  const fragment = new URLSearchParams(url.hash.slice(1));
  const hasFragmentSecret = CONNECTION_FRAGMENT_SECRET_PARAMS.some((name) =>
    fragment.has(name)
  );
  const hasSecret =
    hasFragmentSecret ||
    CONNECTION_LINK_SECRET_PARAMS.some((name) => url.searchParams.has(name));
  if (!hasSecret) {
    return;
  }

  for (const name of CONNECTION_LINK_SECRET_PARAMS) {
    url.searchParams.delete(name);
  }
  if (hasFragmentSecret) {
    for (const name of CONNECTION_FRAGMENT_SECRET_PARAMS) {
      fragment.delete(name);
    }
    url.hash = fragment.toString();
  }
  globalThis.history.replaceState(
    globalThis.history.state,
    "",
    `${url.pathname}${url.search}${url.hash}`
  );
}

/** Server HTML cannot know the app shell, so it stays pending until hydration. */
function useConnectionShell(): ConnectionShell {
  const hasHydrated = useHasHydrated();
  const isElectron = useElectron();
  if (!hasHydrated) {
    return "pending";
  }
  if (Capacitor.isNativePlatform()) {
    return "native-app";
  }
  return isElectron ? "desktop-app" : "browser";
}

function getConnectionFlow({
  connectionShareCode,
  token,
  address,
  shell,
}: {
  readonly connectionShareCode: string;
  readonly token: string;
  readonly address: string;
  readonly shell: ConnectionShell;
}): ConnectionFlow {
  const hasConnectionShareCode = connectionShareCode.trim().length > 0;
  const hasLegacyDesktopToken = token.trim().length > 0;
  if (shell === "pending") {
    return "pending";
  }
  // Every link names the account it connects; without one it is invalid.
  if ((!hasConnectionShareCode && !hasLegacyDesktopToken) || !address) {
    return "missing-parameters";
  }
  if (
    hasConnectionShareCode &&
    (shell === "native-app" || shell === "desktop-app")
  ) {
    return "native-share";
  }
  if (!hasLegacyDesktopToken) {
    return "unsupported-native-share";
  }
  // Legacy refresh-token links are generated only for the 6529 Desktop app.
  if (shell !== "desktop-app") {
    return "unsupported-legacy-desktop";
  }
  return "legacy-desktop";
}

function getSharedProfileName(profile: SharedProfile, address: string): string {
  if (profile?.handle) {
    return profile.handle;
  }
  if (profile?.display) {
    return profile.display;
  }
  if (address) {
    return `${address.slice(0, 6)}…${address.slice(-4)}`;
  }
  return t(
    ACCEPT_CONNECTION_LOCALE,
    "acceptConnection.sharedConnectionFallback"
  );
}

/** Offers a path Home and announces the message when secure setup failed. */
function HomeLinkCard({
  message,
  isError = false,
}: Readonly<{ message: string; isError?: boolean }>) {
  return (
    <div className="tw-rounded-lg tw-bg-white/5 tw-p-6">
      <p
        className="tw-text-base tw-text-neutral-300"
        role={isError ? "alert" : undefined}
      >
        {message}
      </p>
      <p className="tw-mt-4">
        <Link
          href="/"
          className="tw-text-sm tw-font-medium tw-text-emerald-400 hover:tw-underline"
        >
          {t(ACCEPT_CONNECTION_LOCALE, "acceptConnection.home")}
        </Link>
      </p>
    </div>
  );
}

function ConnectionLimitCard() {
  return (
    <div className="tw-rounded-lg tw-bg-white/5 tw-p-6">
      <p className="tw-text-base tw-font-semibold tw-text-white">
        {t(ACCEPT_CONNECTION_LOCALE, "acceptConnection.limit.title")}
      </p>
      <p className="tw-mt-3 tw-text-sm tw-text-neutral-300">
        {t(ACCEPT_CONNECTION_LOCALE, "acceptConnection.limit.message", {
          maxCount: formatInteger(
            ACCEPT_CONNECTION_LOCALE,
            MAX_CONNECTED_PROFILES
          ),
        })}
      </p>
    </div>
  );
}

function IncomingDevicePermissions() {
  return (
    <div className="tw-mt-4 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-3 tw-text-sm">
      <p className="tw-mb-2 tw-mt-0 tw-text-iron-400">
        {t(ACCEPT_CONNECTION_LOCALE, "acceptConnection.incoming.permissions")}
      </p>
      <div className="tw-flex tw-items-center tw-gap-2 tw-font-semibold">
        <FontAwesomeIcon
          icon={faSignature}
          aria-hidden="true"
          className="tw-size-4 tw-text-iron-400"
        />
        {t(ACCEPT_CONNECTION_LOCALE, "e2ee.enroll.signingSection")}
      </div>
      <div className="tw-mt-1 tw-flex tw-items-center tw-gap-2 tw-font-semibold">
        <LockClosedIcon
          aria-hidden="true"
          className="tw-size-4 tw-text-iron-400"
        />
        {t(ACCEPT_CONNECTION_LOCALE, "e2ee.enroll.encryptionSection")}
      </div>
    </div>
  );
}

function IncomingConnectionCard({
  profile,
  profileLoading,
  address,
  includesDeviceSetup,
}: Readonly<{
  profile: SharedProfile;
  profileLoading: boolean;
  address: string;
  includesDeviceSetup: boolean;
}>) {
  const profileName = getSharedProfileName(profile, address);

  return (
    <section className="tw-rounded-2xl tw-border tw-border-solid tw-border-white/[0.03] tw-bg-iron-950 tw-p-5">
      <h2 className="tw-mb-4 tw-text-sm tw-font-semibold tw-uppercase tw-tracking-wide tw-text-neutral-400">
        {t(ACCEPT_CONNECTION_LOCALE, "acceptConnection.incoming.title")}
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
            showLevel={false}
          />
          <div className="tw-min-w-0 tw-flex-1">
            <div className="tw-flex tw-items-center tw-gap-2 tw-text-base tw-font-medium tw-text-white">
              <span className="tw-truncate">{profileName}</span>
              {profile && (
                <UserLevel
                  level={profile.level}
                  size="xxs"
                  asSpan
                  showLabel={false}
                  circle
                />
              )}
            </div>
            {profile ? (
              <div className="tw-mt-1 tw-truncate tw-text-sm tw-text-neutral-400">
                {t(
                  ACCEPT_CONNECTION_LOCALE,
                  "acceptConnection.incoming.profileStatsLabel",
                  {
                    tdh: formatInteger(
                      ACCEPT_CONNECTION_LOCALE,
                      profile.tdh ?? 0
                    ),
                  }
                )}
              </div>
            ) : null}
            {/* The whole address, so the account the link connects can be checked. */}
            <div className="tw-mt-0.5 tw-break-all tw-font-mono tw-text-[11px] tw-text-neutral-400">
              {address}
            </div>
          </div>
        </div>
      )}
      {includesDeviceSetup && <IncomingDevicePermissions />}
    </section>
  );
}

function CurrentProfileNotice({
  connectedAddress,
  connectedProfile,
  acceptingConnection,
  shouldShow,
}: Readonly<{
  connectedAddress: string | undefined;
  connectedProfile: ReturnType<typeof useAuth>["connectedProfile"];
  acceptingConnection: boolean;
  shouldShow: boolean;
}>) {
  const shouldShowNotice =
    shouldShow && Boolean(connectedAddress) && acceptingConnection === false;
  if (shouldShowNotice) {
    return (
      <p className="tw-text-center tw-text-sm tw-text-neutral-400">
        {t(ACCEPT_CONNECTION_LOCALE, "acceptConnection.currentProfile.prefix")}
        {connectedProfile?.handle ? (
          <> @{connectedProfile.handle}</>
        ) : null}{" "}
        {t(
          ACCEPT_CONNECTION_LOCALE,
          "acceptConnection.currentProfile.willStayAvailable"
        )}
        <br />
        {t(
          ACCEPT_CONNECTION_LOCALE,
          "acceptConnection.currentProfile.switchAfterAccepting"
        )}
      </p>
    );
  }

  return null;
}

function AcceptConnectionButton({
  acceptingConnection,
  disabled = false,
  onAccept,
  includesDeviceSetup,
}: Readonly<{
  acceptingConnection: boolean;
  disabled?: boolean;
  onAccept: () => void;
  includesDeviceSetup: boolean;
}>) {
  const isDisabled = acceptingConnection || disabled;
  const acceptLabel = includesDeviceSetup
    ? "acceptConnection.action.acceptWithSetup"
    : "acceptConnection.action.accept";

  return (
    <div className="tw-flex tw-justify-center">
      <button
        type="button"
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={acceptingConnection}
        onClick={onAccept}
        className="tw-flex tw-min-w-[200px] tw-items-center tw-justify-center tw-gap-2 tw-rounded-lg tw-border-0 tw-bg-primary-500 tw-px-6 tw-py-3 tw-text-sm tw-font-semibold tw-text-white tw-shadow-none tw-outline-none tw-ring-0 tw-transition-colors hover:tw-bg-primary-600 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-400 focus:tw-ring-offset-2 focus:tw-ring-offset-iron-950 disabled:tw-cursor-not-allowed disabled:tw-opacity-70"
      >
        {acceptingConnection ? (
          <>
            {t(ACCEPT_CONNECTION_LOCALE, "acceptConnection.action.processing")}{" "}
            <Spinner dimension={18} />
          </>
        ) : (
          t(ACCEPT_CONNECTION_LOCALE, acceptLabel)
        )}
      </button>
    </div>
  );
}

function isAddressInConnectedAccounts(address: string): boolean {
  if (!address.trim()) {
    return false;
  }

  return getConnectedWalletAccounts().some((account) =>
    areEqualAddresses(account.address, address)
  );
}

async function acceptLegacyDesktopConnection({
  address,
  token,
  role,
  setToast,
  seizeAcceptConnection,
  routerPush,
}: {
  readonly address: string;
  readonly token: string;
  readonly role: string | undefined;
  readonly setToast: SetToast;
  readonly seizeAcceptConnection: (address: string) => void;
  readonly routerPush: (path: string) => void;
}): Promise<boolean> {
  const redeemResponse = await commonApiPost<
    ApiRedeemRefreshTokenRequest,
    ApiRedeemRefreshTokenResponse
  >({
    endpoint: "auth/redeem-refresh-token",
    body: {
      address,
      token,
      ...(role ? { role } : {}),
    },
  });
  const hasValidRedeemResponse =
    !!redeemResponse.address &&
    !!redeemResponse.token &&
    areEqualAddresses(redeemResponse.address, address);
  if (hasValidRedeemResponse === false) {
    setToast({
      message: t(
        ACCEPT_CONNECTION_LOCALE,
        "acceptConnection.toast.invalidResponse"
      ),
      type: "error",
    });
    return false;
  }

  if (canStoreAnotherWalletAccount(redeemResponse.address) === false) {
    setToast({
      message: t(
        ACCEPT_CONNECTION_LOCALE,
        "acceptConnection.toast.maxProfiles"
      ),
      type: "error",
    });
    return false;
  }

  const didPersistJwt = setAuthJwt(
    redeemResponse.address,
    redeemResponse.token,
    token,
    role
  );
  if (didPersistJwt === false) {
    setToast({
      message: t(
        ACCEPT_CONNECTION_LOCALE,
        "acceptConnection.toast.persistFailed"
      ),
      type: "error",
    });
    return false;
  }

  seizeAcceptConnection(redeemResponse.address);
  routerPush("/");
  return true;
}

function ConnectionSharingContent({
  flow,
  profile,
  profileLoading,
  address,
  connectedAddress,
  connectedProfile,
  acceptingConnection,
  isIncomingConnectionAlreadyStored,
  isStorageLimitReached,
  onAccept,
  includesDeviceSetup,
}: Readonly<{
  flow: ConnectionFlow;
  profile: SharedProfile;
  profileLoading: boolean;
  address: string;
  connectedAddress: string | undefined;
  connectedProfile: ReturnType<typeof useAuth>["connectedProfile"];
  acceptingConnection: boolean;
  isIncomingConnectionAlreadyStored: boolean;
  isStorageLimitReached: boolean;
  onAccept: () => void;
  includesDeviceSetup: boolean;
}>) {
  if (flow === "pending") {
    return null;
  }

  if (flow === "unsupported-native-share") {
    return (
      <HomeLinkCard
        message={t(ACCEPT_CONNECTION_LOCALE, "acceptConnection.unsupportedWeb")}
      />
    );
  }

  if (flow === "unsupported-legacy-desktop") {
    return (
      <HomeLinkCard
        message={t(
          ACCEPT_CONNECTION_LOCALE,
          "acceptConnection.unsupportedLegacyDesktop"
        )}
      />
    );
  }

  if (flow === "native-share" || flow === "legacy-desktop") {
    return (
      <div className="tw-space-y-6">
        <IncomingConnectionCard
          profile={profile}
          profileLoading={profileLoading}
          address={address}
          includesDeviceSetup={includesDeviceSetup}
        />
        <CurrentProfileNotice
          connectedAddress={connectedAddress}
          connectedProfile={connectedProfile}
          acceptingConnection={acceptingConnection}
          shouldShow={isIncomingConnectionAlreadyStored === false}
        />
        {isStorageLimitReached ? <ConnectionLimitCard /> : null}
        <AcceptConnectionButton
          acceptingConnection={acceptingConnection}
          disabled={isStorageLimitReached}
          onAccept={onAccept}
          includesDeviceSetup={includesDeviceSetup}
        />
      </div>
    );
  }

  return (
    <HomeLinkCard
      message={t(
        ACCEPT_CONNECTION_LOCALE,
        "acceptConnection.missingParameters"
      )}
    />
  );
}

/** Renders the incoming connection and keeps a redeemed share's setup failure visible. */
function AcceptConnectionSharing(
  props: Readonly<AcceptConnectionSharingProps>
) {
  const router = useRouter();
  const { setToast, connectedProfile } = useAuth();
  const { seizeAcceptConnection, address: connectedAddress } =
    useSeizeConnectContext();

  const { connectionShareCode, token, address, role, awaitingLink } = props;
  const [acceptingConnection, setAcceptingConnection] = useState(false);
  const [failedSetupCode, setFailedSetupCode] = useState<string | null>(null);
  const shell = useConnectionShell();
  const flow = getConnectionFlow({
    connectionShareCode,
    token,
    address,
    shell: awaitingLink ? "pending" : shell,
  });
  const isIncomingConnectionAlreadyStored =
    isAddressInConnectedAccounts(address);
  const isStorageLimitReached =
    address.trim().length > 0 &&
    isIncomingConnectionAlreadyStored === false &&
    canStoreAnotherWalletAccount(address) === false;

  const { profile, isLoading: profileLoading } = useIdentity({
    handleOrWallet: address || null,
    initialProfile: null,
  });

  useSetTitle(t(ACCEPT_CONNECTION_LOCALE, "acceptConnection.title"));

  /** Opens Home after acceptance unless the current link needs recovery. */
  const acceptConnection = async () => {
    try {
      if (flow === "native-share") {
        const outcome = await acceptConnectionShare({
          address,
          connectionShareCode,
          setupSecret: props.setupSecret,
          includesDeviceSetup: props.includesDeviceSetup,
          target: shell === "desktop-app" ? "desktop" : "native",
          setToast,
          seizeAcceptConnection,
        });
        if (outcome === CONNECTION_SETUP_FAILED)
          setFailedSetupCode(connectionShareCode);
        if (outcome === "rejected" || outcome === CONNECTION_SETUP_FAILED) {
          setAcceptingConnection(false);
          return;
        }
        if (outcome === "pending-enrollment") {
          setToast({
            message: t(
              ACCEPT_CONNECTION_LOCALE,
              "e2ee.connectionSetup.pending"
            ),
            type: "info",
          });
        }
        router.push("/");
        return;
      }
      if (flow === "legacy-desktop") {
        const accepted = await acceptLegacyDesktopConnection({
          address,
          token,
          role,
          setToast,
          seizeAcceptConnection,
          routerPush: (path) => router.push(path),
        });
        if (!accepted) {
          setAcceptingConnection(false);
        }
      }
    } catch {
      setToast({
        message: t(
          ACCEPT_CONNECTION_LOCALE,
          "acceptConnection.toast.acceptFailed"
        ),
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
            {t(ACCEPT_CONNECTION_LOCALE, "acceptConnection.title")}
          </h1>
        </header>

        {failedSetupCode === connectionShareCode ? (
          <HomeLinkCard
            isError
            message={t(ACCEPT_CONNECTION_LOCALE, "e2ee.connectionSetup.failed")}
          />
        ) : (
          <ConnectionSharingContent
            flow={flow}
            profile={profile}
            profileLoading={profileLoading}
            address={address}
            connectedAddress={connectedAddress}
            connectedProfile={connectedProfile}
            acceptingConnection={acceptingConnection}
            includesDeviceSetup={
              flow === "native-share" && props.includesDeviceSetup
            }
            isIncomingConnectionAlreadyStored={
              isIncomingConnectionAlreadyStored
            }
            isStorageLimitReached={isStorageLimitReached}
            onAccept={() => {
              if (acceptingConnection || isStorageLimitReached) return;
              setAcceptingConnection(true);
              void acceptConnection();
            }}
          />
        )}
      </div>
    </main>
  );
}

/** Captures each incoming link's setup key before scrubbing credentials from the URL. */
export default function AcceptConnectionSharingPage() {
  // react-doctor-disable-next-line react-doctor/nextjs-no-use-search-params-without-suspense covered by app/accept-connection-sharing/page.tsx
  const searchParams = useSearchParams();
  const queryShareCode = searchParams?.get(SHARE_CODE_PARAM)?.trim() || "";
  const token = searchParams?.get("token") || "";
  const address = toLinkAddress(searchParams?.get("address"));
  const role = searchParams?.get("role") || undefined;
  // The whole query identifies a link visit, so reopening the same link (with
  // a new `_t`) on the mounted page is cleaned again.
  const linkQuery = searchParams.toString();
  const setupSecret = useRef<SetupKeyRef["current"]>(null);
  const fragmentShareCode = useRef<string | null>(null);
  const [setupLinkQuery, setSetupLinkQuery] = useState<string | null>(null);
  const [readFragment, setReadFragment] = useState<{
    readonly query: string;
    readonly shareCode: string;
  } | null>(null);
  const capturedQuery = useRef<string | null>(null);

  // A layout effect runs before paint and before passive effects, such as
  // analytics and monitoring, that may read the page URL. It reads the visible
  // URL itself, so whatever credential is shown is removed even if it differs
  // from the router values the accept action uses.
  useLayoutEffect(() => {
    const fragment = new URLSearchParams(globalThis.location.hash.slice(1));
    if (capturedQuery.current !== linkQuery) {
      setupSecret.current = null;
      fragmentShareCode.current = null;
    }
    capturedQuery.current = linkQuery;
    const unlockKey = fragment.get(SETUP_SECRET_PARAM);
    if (unlockKey) setupSecret.current = { key: unlockKey };
    const shareCode = fragment.get(SHARE_CODE_PARAM)?.trim();
    if (shareCode) fragmentShareCode.current = shareCode;
    removeConnectionSecretsFromAddressBar();
    // Publish the link type after scrubbing the URL. Strict Mode may replay
    // this effect after the fragment has already been removed.
    const setupQuery = setupSecret.current ? linkQuery : null;
    const fragmentRead = {
      query: linkQuery,
      shareCode: fragmentShareCode.current ?? "",
    };
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setSetupLinkQuery(setupQuery);
      setReadFragment(fragmentRead);
    });
    return () => {
      active = false;
    };
  }, [linkQuery]);

  // A code in the fragment never reaches a server, so it wins over the query.
  const fragmentForLink =
    readFragment?.query === linkQuery ? readFragment : null;
  const connectionShareCode = fragmentForLink?.shareCode || queryShareCode;

  return (
    <AcceptConnectionSharing
      connectionShareCode={connectionShareCode}
      awaitingLink={
        fragmentForLink === null && queryShareCode === "" && token === ""
      }
      setupSecret={setupSecret}
      includesDeviceSetup={setupLinkQuery === linkQuery}
      token={token}
      address={address}
      role={role}
    />
  );
}
