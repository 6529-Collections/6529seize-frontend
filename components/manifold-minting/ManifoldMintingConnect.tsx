"use client";

import type { CommunityMemberMinimal } from "@/entities/IProfile";
import { areEqualAddresses } from "@/helpers/Helpers";
import useCapacitor from "@/hooks/useCapacitor";
import Link from "next/link";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
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
  }>
) {
  const { onMintFor } = props;
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

  const connectedRecipientProfile = useMemo<CommunityMemberMinimal | null>(() => {
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
    if (!account.address || mintForFren) {
      return;
    }
    setSelectedMintForMeWallet(account.address);
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

    const mintDestination = selectedMintForMeWallet ?? account.address;
    if (!mintDestination) {
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
      <div className="tw-pt-2 tw-pb-1">
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
      <div className="tw-pt-2 tw-pb-1">
        <RecipientSelector
          open={!mintForFren}
          selectedProfile={connectedRecipientProfile}
          selectedWallet={selectedMintForMeWallet}
          onProfileSelect={noopProfileSelection}
          onWalletSelect={setSelectedMintForMeWallet}
          showLabel={false}
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
      <div className="d-flex flex-column pt-1 pb-1">
        <span className="font-smaller font-lighter">Connected Profile</span>
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

  if (isIos) {
    if (country === "US") {
      return (
        <Link
          href={
            typeof window !== "undefined" ? window.location.href : "https://6529.io"
          }
          className="text-center pt-2 pb-2"
          target="_blank" rel="noopener noreferrer">
          <button className="btn btn-light" style={{ width: "100%" }}>
            Mint on 6529.io
          </button>
        </Link>
      );
    } else {
      return <></>;
    }
  }

  if (!account.isConnected) {
    return (
      <div className="text-center pt-2 pb-2">
        <HeaderUserConnect />
      </div>
    );
  }

  return (
    <Container className="no-padding">
      <Row>
        <Col>{printConnected()}</Col>
      </Row>
      <Row className="pt-3">
        <Col>
          <button
            className={`btn ${mintForFren ? "btn-dark" : "btn-light"}`}
            style={{ width: "50%" }}
            onClick={() => {
              resetFren();
              setMintForFren(false);
            }}>
            Mint for me
          </button>
          <button
            className={`btn ${mintForFren ? "btn-light" : "btn-dark"}`}
            style={{ width: "50%" }}
            onClick={() => setMintForFren(true)}>
            Mint for fren
          </button>
        </Col>
      </Row>
      <Row className="pt-2">
        <Col>{printContent()}</Col>
      </Row>
    </Container>
  );
}
