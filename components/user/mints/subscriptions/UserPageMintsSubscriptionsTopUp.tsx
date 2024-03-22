import { useEffect, useState } from "react";
import { Container, Row, Col, Form, Button } from "react-bootstrap";
import { parseEther } from "viem";
import {
  mainnet,
  sepolia,
  useAccount,
  useEnsAddress,
  useSendTransaction,
  useWaitForTransaction,
} from "wagmi";
import { Web3Button } from "@web3modal/react";
import { getTransactionLink } from "../../../../helpers/Helpers";

const MINT_PRICE = 0.06529;
const CHAIN_ID = sepolia.id;

export default function UserPageMintsSubscriptionsTopUp() {
  const account = useAccount();
  const [trfValue, setTrfValue] = useState<string>("");
  const sendTransaction = useSendTransaction();
  const waitSendTransaction = useWaitForTransaction({
    confirmations: 1,
    chainId: CHAIN_ID,
    hash: sendTransaction.data?.hash,
  });

  const [error, setError] = useState<string>("");

  const useAddress = useEnsAddress({
    chainId: mainnet.id,
    name: "social.museum.6529.eth",
  });

  function submit() {
    setError("");
    sendTransaction.reset();
    if (!useAddress.data) {
      setError("Invalid to address");
      return;
    }
    const value = (MINT_PRICE * parseInt(trfValue)).toString();
    sendTransaction.sendTransaction({
      chainId: CHAIN_ID,
      to: useAddress.data,
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
      return "Submitted";
    } else if (waitSendTransaction.isSuccess) {
      return "Successful";
    } else {
      return `Failed - ${waitSendTransaction.error?.message}`;
    }
  }

  return (
    <Container className="no-padding">
      <Row>
        <Col>
          <h2 className="tw-mb-1 tw-text-xl tw-font-semibold tw-text-iron-50 sm:tw-text-l sm:tw-tracking-tight">
            Top Up
          </h2>
        </Col>
      </Row>
      <Row className="pt-2">
        <Col>
          <Form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}>
            <Form.Group className="mb-3">
              <Form.Label className="mb-1">Memes Count</Form.Label>
              <Row className="d-flex align-items-center">
                <Col xs={6} sm={4} md={2}>
                  <Form.Control
                    type="number"
                    placeholder="meme count"
                    value={trfValue}
                    onChange={(e) => {
                      const value = e.target.value;
                      try {
                        parseInt(value);
                        setTrfValue(value);
                      } catch {
                        setTrfValue("");
                      }
                    }}
                  />
                </Col>
                <Col xs={6} sm={4} md={2}>
                  {account.isConnected ? (
                    <Button
                      className="seize-btn btn-white btn-block"
                      type="submit"
                      disabled={!trfValue || sendTransaction.isLoading}>
                      Send
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
                {error && (
                  <Col
                    xs={12}
                    sm={4}
                    md={8}
                    className="d-flex align-items-center">
                    {error}
                  </Col>
                )}
                {sendTransaction.data && (
                  <Col
                    xs={12}
                    sm={4}
                    md={8}
                    className="d-flex align-items-center gap-2">
                    Transaction {getStatusMessage()}
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
                )}
              </Row>
            </Form.Group>
          </Form>
        </Col>
      </Row>
    </Container>
  );
}
