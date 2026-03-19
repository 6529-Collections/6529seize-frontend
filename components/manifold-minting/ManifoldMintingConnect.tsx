"use client";

import Link from "next/link";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { CommunityMemberMinimal } from "@/entities/IProfile";
import { areEqualAddresses } from "@/helpers/Helpers";
import useCapacitor from "@/hooks/useCapacitor";
import { AuthContext } from "../auth/Auth";
import { useSeizeConnectContext } from "../auth/SeizeConnectContext";
import RecipientSelector from "../common/RecipientSelector";
import { useCookieConsent } from "../cookies/CookieConsentContext";
import HeaderUserConnect from "../header/user/HeaderUserConnect";
import TransferModalPfp from "../nft-transfer/TransferModalPfp";

const noopProfileSelection = (_: CommunityMemberMinimal | null) => undefined;

export default function ManifoldMintingConnect(
  props: Readonly<{
    onMintFor: (address: string) => void;
    showConnect?: boolean;
  }>
) {
  const { onMintFor, showConnect } = props;
  const account = useSeizeConnectContext();
  const { connectedProfile } = useContext(AuthContext);
  const { isIos } = useCapacitor();
  const { country } = useCookieConsent();

  const [mintForFren, setMintForFren] = useState<boolean>(false);
  const [selectedFrenProfile, setSelectedFrenProfile] =
    useState<CommunityMemberMinimal | null>(null);
  const [selectedFrenWallet, setSelectedFrenWallet] = useState<string | null>(
    null
  );
  const [selectedMintForMeWallet, setSelectedMintForMeWallet] = useState<
    string | null
  >(null);

  const connectedRecipientProfile =
    useMemo<CommunityMemberMinimal | null>(() => {
      if (!account.address) {
        return null;
      }

      return {
        profile_id: connectedProfile?.id ?? null,
        handle: connectedProfile?.handle ?? null,
        normalised_handle: connectedProfile?.normalised_handle ?? null,
        primary_wallet: connectedProfile?.primary_wallet ?? account.address,
        display: connectedProfile?.display ?? account.address,
        tdh: connectedProfile?.tdh ?? 0,
        level: connectedProfile?.level ?? 0,
        cic_rating: connectedProfile?.cic ?? 0,
        wallet: account.address,
        pfp: connectedProfile?.pfp ?? null,
      };
    }, [connectedProfile, account.address]);

  const resetFren = useCallback(() => {
    setSelectedFrenProfile(null);
    setSelectedFrenWallet(null);
  }, []);

  useEffect(() => {
    resetFren();
    setMintForFren(false);
  }, [account.address, resetFren]);

  useEffect(() => {
    if (mintForFren) {
      return;
    }

    setSelectedMintForMeWallet(account.address ?? null);
  }, [account.address, mintForFren]);

  useEffect(() => {
    if (mintForFren) {
      if (!selectedFrenWallet) {
        onMintFor("");
        return;
      }

      onMintFor(selectedFrenWallet);
      return;
    }

    const mintDestination = selectedMintForMeWallet ?? account.address ?? "";
    if (!mintDestination) {
      onMintFor("");
      return;
    }

    onMintFor(mintDestination);
  }, [
    selectedFrenWallet,
    selectedMintForMeWallet,
    mintForFren,
    account.address,
    onMintFor,
  ]);

  function printMintForFren() {
    return (
      <div className="tw-pb-1 tw-pt-2">
        <RecipientSelector
          open={mintForFren}
          selectedProfile={selectedFrenProfile}
          selectedWallet={selectedFrenWallet}
          onProfileSelect={setSelectedFrenProfile}
          onWalletSelect={setSelectedFrenWallet}
          label="Mint For"
          placeholder="Search by handle, ens or wallet"
        />
      </div>
    );
  }

  function printMintForMe() {
    if (!connectedRecipientProfile) {
      return <></>;
    }

    return (
      <div className="tw-pb-1 tw-pt-2">
        <RecipientSelector
          open={!mintForFren}
          selectedProfile={connectedRecipientProfile}
          selectedWallet={selectedMintForMeWallet}
          onProfileSelect={noopProfileSelection}
          onWalletSelect={setSelectedMintForMeWallet}
          showLabel={false}
          label="Choose destination wallet"
          allowProfileChange={false}
          disableSingleWalletSelection={true}
          showSelectedProfileCard={false}
        />
      </div>
    );
  }

  function printConnected() {
    const profileHandle =
      connectedProfile?.handle ?? connectedProfile?.display ?? account.address;
    const showAddress = !areEqualAddresses(profileHandle, account.address);
    return (
      <div className="tw-py-1">
        <span className="tw-text-sm tw-font-light tw-text-iron-300">
          Connected Profile
        </span>
        <div className="tw-mt-2 tw-flex tw-items-center tw-gap-3 tw-rounded-lg tw-bg-white/10 tw-px-3 tw-py-2">
          <TransferModalPfp
            src={connectedProfile?.pfp ?? null}
            alt={profileHandle ?? ""}
            level={connectedProfile?.level ?? 0}
          />
          <div className="tw-min-w-0">
            <div className="tw-truncate tw-text-sm tw-font-medium">
              {profileHandle}
            </div>
            <div className="tw-truncate tw-text-[11px] tw-opacity-60">
              TDH: {(connectedProfile?.tdh ?? 0).toLocaleString()} - Level:{" "}
              {connectedProfile?.level ?? 0}
            </div>
            {showAddress && (
              <div className="tw-truncate tw-text-[11px] tw-opacity-60">
                {account.address}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  function printContent() {
    return <>{mintForFren ? printMintForFren() : printMintForMe()}</>;
  }

  const mintOn6529Href = globalThis.window?.location?.href ?? "https://6529.io";

  if (isIos) {
    if (country === "US") {
      return (
        <Link
          href={mintOn6529Href}
          className="tw-block tw-py-2"
          target="_blank"
          rel="noopener noreferrer"
        >
          <button
            type="button"
            className="tw-w-full tw-rounded-xl tw-border tw-border-white/15 tw-bg-white tw-px-4 tw-py-3 tw-font-semibold tw-text-iron-950 tw-transition hover:tw-bg-iron-100"
          >
            Mint on 6529.io
          </button>
        </Link>
      );
    } else {
      return <></>;
    }
  }

  if (!account.isConnected) {
    if (showConnect) {
      return null;
    }
    return (
      <div className="tw-py-2 tw-text-center">
        <HeaderUserConnect />
      </div>
    );
  }

  return (
    <div>
      <div>{printConnected()}</div>
      <div className="tw-pt-3">
        <div className="tw-grid tw-grid-cols-2 tw-gap-0">
          <button
            type="button"
            className={`tw-rounded-md tw-border tw-px-4 tw-py-0.5 tw-text-2xl tw-font-normal tw-transition ${
              mintForFren
                ? "tw-border-[#3a3a3a] tw-bg-[#262b31] tw-text-white"
                : "tw-border-transparent tw-bg-white tw-text-black"
            }`}
            onClick={() => {
              resetFren();
              setMintForFren(false);
            }}
          >
            Mint for me
          </button>
          <button
            type="button"
            className={`tw-rounded-md tw-border tw-px-4 tw-py-0.5 tw-text-2xl tw-font-normal tw-transition ${
              mintForFren
                ? "tw-border-transparent tw-bg-white tw-text-black"
                : "tw-border-[#3a3a3a] tw-bg-[#262b31] tw-text-white"
            }`}
            onClick={() => setMintForFren(true)}
          >
            Mint for fren
          </button>
        </div>
      </div>
      <div className="tw-pt-2">{printContent()}</div>
    </div>
  );
}
