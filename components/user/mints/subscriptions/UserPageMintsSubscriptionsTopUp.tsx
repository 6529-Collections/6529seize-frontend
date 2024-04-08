import { useEffect, useState } from "react";
import { Container, Row, Col, Form, Button } from "react-bootstrap";
import { parseEther } from "viem";
import {
  sepolia,
  useAccount,
  useSendTransaction,
  useWaitForTransaction,
} from "wagmi";
import { Web3Button } from "@web3modal/react";
import { formatAddress, getTransactionLink } from "../../../../helpers/Helpers";
import { IProfileAndConsolidations } from "../../../../entities/IProfile";
import {
  SUBSCRIPTIONS_ADDRESS,
  SUBSCRIPTIONS_ADDRESS_ENS,
} from "../../../../constants";
import Tippy from "@tippyjs/react";
import DotLoader from "../../../dotLoader/DotLoader";

const MINT_PRICE = 0.06529;
const CHAIN_ID = sepolia.id;

export default function UserPageMintsSubscriptionsTopUp(
  props: Readonly<{
    profile: IProfileAndConsolidations;
  }>
) {
  const account = useAccount();
  const [memeCount, setMemeCount] = useState<string>("");
  const sendTransaction = useSendTransaction();

  const waitSendTransaction = useWaitForTransaction({
    confirmations: 1,
    chainId: CHAIN_ID,
    hash: sendTransaction.data?.hash,
  });

  const [error, setError] = useState<string>("");

  function submit() {
    setError("");
    sendTransaction.reset();
    const value = (MINT_PRICE * parseInt(memeCount)).toString();
    sendTransaction.sendTransaction({
      chainId: CHAIN_ID,
      to: SUBSCRIPTIONS_ADDRESS,
      value: parseEther(value),
    });
  }

  useEffect(() => {
    if (sendTransaction.error) {
      const errorMsg =
        sendTransaction.error.message.split("Request Arguments")[0];
      setError(`Error - ${errorMsg}`);
    }
  }, [sendTransaction.error]);

  function getStatusMessage() {
    if (waitSendTransaction.isLoading) {
      return "Transaction Submitted";
    } else if (waitSendTransaction.isSuccess) {
      return "Top Up Successful!";
    } else {
      return `Something went wrong`;
    }
  }

  return (
    <Container className="no-padding">
      <Row>
        <Col className="d-flex align-items-center gap-2 no-wrap">
          <h5>Top Up</h5>
          <span className="d-flex align-items-center gap-1 font-color-h font-smaller">
            Sending to{" "}
            <Tippy
              content={
                <span className="font-smaller">{SUBSCRIPTIONS_ADDRESS}</span>
              }>
              <span>
                {SUBSCRIPTIONS_ADDRESS_ENS}{" "}
                {formatAddress(SUBSCRIPTIONS_ADDRESS)}
              </span>
            </Tippy>
          </span>
        </Col>
      </Row>
      <Row className="pt-1">
        <Col>
          <Form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}>
            <Form.Group className="mb-3">
              <Row className="d-flex align-items-center">
                <Col xs={6}>
                  <Form.Control
                    type="number"
                    min={1}
                    placeholder="meme count"
                    value={memeCount}
                    className="font-smaller"
                    onChange={(e) => {
                      const value = e.target.value;
                      try {
                        parseInt(value);
                        setMemeCount(value);
                      } catch {
                        setMemeCount("");
                      }
                    }}
                  />
                </Col>
                <Col xs={6}>
                  {account.isConnected ? (
                    <Button
                      className="seize-btn btn-white btn-block"
                      type="submit"
                      disabled={
                        !memeCount ||
                        !parseInt(memeCount) ||
                        sendTransaction.isLoading
                      }>
                      Send{" "}
                      {parseInt(memeCount) ? (
                        <span className="font-smaller font-color-h">
                          {MINT_PRICE * parseInt(memeCount)} ETH
                        </span>
                      ) : (
                        <></>
                      )}
                    </Button>
                  ) : (
                    <Web3Button
                      label="Connect"
                      icon="hide"
                      avatar="hide"
                      balance="hide"
                    />
                  )}
                </Col>
              </Row>
              {error && (
                <Row>
                  <Col className="d-flex align-items-center pt-2">{error}</Col>
                </Row>
              )}
              {sendTransaction.data && (
                <Row>
                  <Col className="d-flex align-items-center gap-2 pt-2">
                    {getStatusMessage()}
                    <a
                      href={getTransactionLink(
                        CHAIN_ID,
                        sendTransaction.data.hash
                      )}
                      target="_blank"
                      rel="noreferrer">
                      view
                    </a>
                  </Col>
                </Row>
              )}
              {waitSendTransaction.isLoading && (
                <Row>
                  <Col>
                    Waiting for confirmation <DotLoader />
                  </Col>
                </Row>
              )}
            </Form.Group>
          </Form>
        </Col>
      </Row>
    </Container>
  );
}
