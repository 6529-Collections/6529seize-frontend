"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { Spinner } from "@/components/dotLoader/DotLoader";
import { useSetTitle } from "@/contexts/TitleContext";
import type { ApiRedeemRefreshTokenRequest } from "@/generated/models/ApiRedeemRefreshTokenRequest";
import type { ApiRedeemRefreshTokenResponse } from "@/generated/models/ApiRedeemRefreshTokenResponse";
import { areEqualAddresses } from "@/helpers/Helpers";
import { useIdentity } from "@/hooks/useIdentity";
import { commonApiPost } from "@/services/api/common-api";
import {
  canStoreAnotherWalletAccount,
  setAuthJwt,
} from "@/services/auth/auth.utils";
import TransferModalPfp from "@/components/nft-transfer/TransferModalPfp";

interface AcceptConnectionSharingProps {
  token: string;
  address: string;
  role?: string | undefined;
}

function AcceptConnectionSharing(
  props: Readonly<AcceptConnectionSharingProps>
) {
  const router = useRouter();
  const { setToast, connectedProfile } = useAuth();
  const { seizeAcceptConnection, address: connectedAddress } =
    useSeizeConnectContext();

  const { token, address, role } = props;
  const [acceptingConnection, setAcceptingConnection] = useState(false);

  const { profile, isLoading: profileLoading } = useIdentity({
    handleOrWallet: address || null,
    initialProfile: null,
  });

  useSetTitle("Accept Connection Sharing");

  const acceptConnection = async () => {
    try {
      const redeemResponse = await commonApiPost<
        ApiRedeemRefreshTokenRequest,
        ApiRedeemRefreshTokenResponse
      >({
        endpoint: "auth/redeem-refresh-token",
        body: {
          address,
          token,
        },
      });
      const hasValidRedeemResponse =
        !!redeemResponse.address &&
        !!redeemResponse.token &&
        areEqualAddresses(redeemResponse.address, address);
      if (!hasValidRedeemResponse) {
        setToast({ message: "Invalid connection response", type: "error" });
        setAcceptingConnection(false);
        return;
      }

      if (!canStoreAnotherWalletAccount(redeemResponse.address)) {
        setToast({
          message: "Maximum connected profiles reached",
          type: "error",
        });
        setAcceptingConnection(false);
        return;
      }

      const didPersistJwt = setAuthJwt(
        redeemResponse.address,
        redeemResponse.token,
        token,
        role ?? undefined
      );
      if (!didPersistJwt) {
        setToast({
          message: "Failed to store connected profile",
          type: "error",
        });
        setAcceptingConnection(false);
        return;
      }

      seizeAcceptConnection(redeemResponse.address);
      router.push("/");
    } catch (error) {
      console.error(error);
      setToast({ message: "Failed to accept connection", type: "error" });
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

        {!token || !address ? (
          <div className="tw-rounded-lg tw-bg-white/5 tw-p-6">
            <p className="tw-text-base tw-text-neutral-300">
              Missing required parameters
            </p>
            <p className="tw-mt-4">
              <Link
                href="/"
                className="tw-text-sm tw-font-medium tw-text-emerald-400 hover:tw-underline"
              >
                Take me home
              </Link>
            </p>
          </div>
        ) : (
          <div className="tw-space-y-6">
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
                    alt={profile?.handle ?? profile?.display ?? address}
                    level={profile?.level ?? 0}
                    size={56}
                  />
                  <div className="tw-min-w-0 tw-flex-1">
                    <div className="tw-truncate tw-text-base tw-font-medium tw-text-white">
                      {profile?.handle ??
                        profile?.display ??
                        address.slice(0, 6) + "…" + address.slice(-4)}
                    </div>
                    {profile ? (
                      <div className="tw-mt-1 tw-truncate tw-text-sm tw-text-neutral-400">
                        TDH: {(profile.tdh ?? 0).toLocaleString()} · Level:{" "}
                        {profile.level ?? 0}
                      </div>
                    ) : null}
                    <div className="tw-mt-0.5 tw-truncate tw-font-mono tw-text-[11px] tw-text-neutral-500">
                      {address}
                    </div>
                  </div>
                </div>
              )}
            </section>

            {connectedAddress && !acceptingConnection && (
              <p className="tw-text-center tw-text-sm tw-text-neutral-400">
                Your current profile
                {connectedProfile?.handle ? (
                  <> @{connectedProfile.handle}</>
                ) : null}{" "}
                will stay available.
                <br />
                You can switch between both after accepting.
              </p>
            )}

            <div className="tw-flex tw-justify-center">
              <button
                type="button"
                disabled={acceptingConnection}
                aria-disabled={acceptingConnection}
                aria-busy={acceptingConnection}
                onClick={() => {
                  if (acceptingConnection) return;
                  setAcceptingConnection(true);
                  void acceptConnection();
                }}
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
          </div>
        )}
      </div>
    </main>
  );
}

export default function AcceptConnectionSharingPage() {
  const searchParams = useSearchParams();
  const token = searchParams?.get("token") || "";
  const address = searchParams?.get("address") || "";
  const role = searchParams?.get("role") || undefined;
  return (
    <AcceptConnectionSharing token={token} address={address} role={role} />
  );
}
