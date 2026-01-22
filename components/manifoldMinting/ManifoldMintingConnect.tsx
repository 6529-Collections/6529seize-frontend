"use client";

import type { CommunityMemberMinimal } from "@/entities/IProfile";
import { areEqualAddresses } from "@/helpers/Helpers";
import useCapacitor from "@/hooks/useCapacitor";
import Link from "next/link";
import { useContext, useEffect, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { AuthContext } from "../auth/Auth";
import { useSeizeConnectContext } from "../auth/SeizeConnectContext";
import RecipientSelector from "../common/RecipientSelector";
import { useCookieConsent } from "../cookies/CookieConsentContext";
import HeaderUserConnect from "../header/user/HeaderUserConnect";
import UserCICAndLevel, {
    UserCICAndLevelSize,
} from "../user/utils/UserCICAndLevel";

export default function ManifoldMintingConnect(
  props: Readonly<{
    onMintFor: (address: string) => void;
  }>
) {
  const account = useSeizeConnectContext();
  const { connectedProfile } = useContext(AuthContext);
  const { isIos } = useCapacitor();
  const { country } = useCookieConsent();

  const [mintForFren, setMintForFren] = useState<boolean>(false);
  const [selectedProfile, setSelectedProfile] =
    useState<CommunityMemberMinimal | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  function reset() {
    setSelectedProfile(null);
    setSelectedWallet(null);
  }

  useEffect(() => {
    reset();
    setMintForFren(false);
  }, [account.address]);

  useEffect(() => {
    if (mintForFren && selectedWallet) {
      props.onMintFor(selectedWallet);
    } else {
      props.onMintFor(account.address as string);
    }
  }, [selectedWallet, mintForFren, account.address, props]);

  function printMintFor() {
    return (
      <div className="tw-pt-2 tw-pb-1">
        <RecipientSelector
          open={mintForFren}
          selectedProfile={selectedProfile}
          selectedWallet={selectedWallet}
          onProfileSelect={setSelectedProfile}
          onWalletSelect={setSelectedWallet}
          label="Mint For"
          placeholder="Search by handle, ens or wallet"
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
        <span className="pt-1 d-flex align-items-center gap-3">
          <UserCICAndLevel
            size={UserCICAndLevelSize.XLARGE}
            level={connectedProfile?.level ?? 0}
          />
          <span className="d-flex flex-column">
            <b>{profileHandle}</b>
            {showAddress && (
              <span className="font-lightest font-smaller">
                {account.address}
              </span>
            )}
          </span>
        </span>
      </div>
    );
  }

  function printContent() {
    return <>{mintForFren && printMintFor()}</>;
  }

  if (isIos) {
    if (country === "US") {
      return (
        <Link
          href={window.location.href}
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
            onClick={() => setMintForFren(false)}>
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
