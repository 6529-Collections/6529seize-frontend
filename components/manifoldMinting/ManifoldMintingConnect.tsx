import { useEffect, useState } from "react";
import { Col, Container, Form, Row } from "react-bootstrap";
import { useAccount, useEnsAddress, useEnsName } from "wagmi";
import HeaderUserConnect from "../header/user/HeaderUserConnect";
import { isValidEthAddress } from "../../helpers/Helpers";

export default function ManifoldMintingConnect(
  props: Readonly<{
    onMintFor: (address: string) => void;
  }>
) {
  const account = useAccount();
  const [mintForFren, setMintForFren] = useState<boolean>(false);

  const [mintFor, setMintFor] = useState<string>("");
  const [mintForAddress, setMintForAddress] = useState("");
  const [mintForLock, setMintForLock] = useState<boolean>(false);

  const walletAddressEns = useEnsName({
    address:
      mintFor && isValidEthAddress(mintFor)
        ? (mintFor as `0x${string}`)
        : undefined,
    chainId: 1,
  });
  const walletAddressFromEns = useEnsAddress({
    name: mintFor && mintFor.endsWith(".eth") ? mintFor : undefined,
    chainId: 1,
  });

  useEffect(() => {
    if (walletAddressEns.data) {
      setMintForAddress(mintFor);
      setMintFor(`${walletAddressEns.data} - ${mintFor}`);
      setMintForLock(true);
    }
  }, [walletAddressEns.data]);

  useEffect(() => {
    if (walletAddressFromEns.data) {
      setMintForAddress(walletAddressFromEns.data);
      setMintFor(`${mintFor} - ${walletAddressFromEns.data}`);
      setMintForLock(true);
    }
  }, [walletAddressFromEns.data]);

  useEffect(() => {
    if (!walletAddressFromEns.data && !walletAddressEns.data) {
      props.onMintFor("");
    }
  }, [mintFor]);

  useEffect(() => {
    if (mintForFren) {
      props.onMintFor(mintForAddress);
    } else {
      props.onMintFor(account.address as string);
    }
  }, [mintForAddress, mintForFren]);

  function printMintFor() {
    return (
      <div className="d-flex flex-column pt-1 pb-1">
        <span className="font-smaller font-lighter">Mint For</span>
        <span className="d-flex align-items-center justify-content-between">
          <Form.Control
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
              onClick={() => {
                setMintFor("");
                setMintForAddress("");
                setMintForLock(false);
              }}>
              <span className="font-smaller font-lighter pt-1">clear</span>
            </button>
          </span>
        )}
      </div>
    );
  }

  function printConnected() {
    return (
      <div className="d-flex flex-column pt-1 pb-1">
        <span className="font-smaller font-lighter">Connected Address</span>
        <span>
          <b>{account.address}</b>
        </span>
      </div>
    );
  }

  function printContent() {
    return (
      <>
        {printConnected()}
        {mintForFren && printMintFor()}
      </>
    );
  }

  if (!account.isConnected) {
    return <HeaderUserConnect />;
  }

  return (
    <Container className="no-padding">
      <Row>
        <Col>
          <button
            className={`btn ${mintForFren ? "btn-dark" : "btn-light"}`}
            onClick={() => setMintForFren(false)}>
            Mint for me
          </button>
          <button
            className={`btn ${mintForFren ? "btn-light" : "btn-dark"}`}
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
