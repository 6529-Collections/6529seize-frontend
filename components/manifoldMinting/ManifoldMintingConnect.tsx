import { useContext, useEffect, useState } from "react";
import { Col, Container, Form, Row } from "react-bootstrap";
import { useAccount, useEnsAddress, useEnsName } from "wagmi";
import HeaderUserConnect from "../header/user/HeaderUserConnect";
import {
  areEqualAddresses,
  cicToType,
  isValidEthAddress,
} from "../../helpers/Helpers";
import { AuthContext } from "../auth/Auth";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "../user/utils/UserCICAndLevel";

export default function ManifoldMintingConnect(
  props: Readonly<{
    onMintFor: (address: string) => void;
  }>
) {
  const account = useAccount();
  const { connectedProfile } = useContext(AuthContext);

  const [mintForFren, setMintForFren] = useState<boolean>(false);

  const [mintFor, setMintFor] = useState<string>("");
  const [mintForAddress, setMintForAddress] = useState("");
  const [mintForLock, setMintForLock] = useState<boolean>(false);

  function reset() {
    setMintFor("");
    setMintForAddress("");
    setMintForLock(false);
  }

  const walletAddressEns = useEnsName({
    address: isValidEthAddress(mintFor)
      ? (mintFor as `0x${string}`)
      : undefined,
    chainId: 1,
  });
  const walletAddressFromEns = useEnsAddress({
    name: mintFor?.endsWith(".eth") ? mintFor : undefined,
    chainId: 1,
  });

  useEffect(() => {
    if (walletAddressEns.data) {
      setMintForAddress(mintFor);
      setMintFor(`${walletAddressEns.data} - ${mintFor}`);
      setMintForLock(true);
    }
  }, [walletAddressEns.isFetched]);

  useEffect(() => {
    if (walletAddressFromEns.data) {
      setMintForAddress(walletAddressFromEns.data);
      setMintFor(`${mintFor} - ${walletAddressFromEns.data}`);
      setMintForLock(true);
    }
  }, [walletAddressFromEns.isFetched]);

  useEffect(() => {
    if (!walletAddressFromEns.data && !walletAddressEns.data) {
      props.onMintFor("");
    }
  }, [mintFor]);

  useEffect(() => {
    if (account.address) {
      setMintFor(account.address as string);
    } else {
      reset();
    }
  }, [account.address]);

  useEffect(() => {
    if (mintForFren) {
      console.log("mintForAddress: " + mintForAddress);
      props.onMintFor(mintForAddress);
    } else {
      console.log("account.address: " + account.address);
      props.onMintFor(account.address as string);
    }
  }, [mintForAddress, mintForFren]);

  function printMintFor() {
    return (
      <div className="d-flex flex-column pt-2 pb-1">
        <span className="font-smaller font-lighter">Mint For</span>
        <span className="d-flex align-items-center justify-content-between">
          <Form.Control
            style={{ fontSize: "smaller" }}
            autoFocus
            disabled={mintForLock}
            placeholder={"0x... or ENS"}
            type="text"
            value={mintFor}
            onChange={(e) => setMintFor(e.target.value)}
          />
        </span>
        {!mintForAddress && (
          <span className="font-smaller font-lighter text-danger pt-1">
            {mintFor ? `Invalid Address` : ``}
          </span>
        )}
        {mintForLock && (
          <span className="d-flex justify-content-end">
            <button
              className="btn-link decoration-none font-color"
              style={{
                width: "fit-content",
              }}
              onClick={() => reset()}>
              <span className="font-smaller font-lighter pt-1">clear</span>
            </button>
          </span>
        )}
      </div>
    );
  }

  function printConnected() {
    const type = cicToType(connectedProfile?.cic?.cic_rating ?? 0);
    const profileHandle =
      connectedProfile?.profile?.handle ??
      connectedProfile?.consolidation.consolidation_display ??
      account.address;
    const showAddress = !areEqualAddresses(profileHandle, account.address);
    return (
      <div className="d-flex flex-column pt-1 pb-1">
        <span className="font-smaller font-lighter">Connected Profile</span>
        <span className="pt-1 d-flex align-items-center gap-3">
          <UserCICAndLevel
            size={UserCICAndLevelSize.XLARGE}
            level={connectedProfile?.level ?? 0}
            cicType={type}
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
