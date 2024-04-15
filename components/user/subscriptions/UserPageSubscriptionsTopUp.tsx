import { useEffect, useState } from "react";
import { Container, Row, Col, Form, Button } from "react-bootstrap";
import { parseEther } from "viem";
import { sepolia, useSendTransaction, useWaitForTransaction } from "wagmi";
import { formatAddress, getTransactionLink } from "../../../helpers/Helpers";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import {
  MEMES_MINT_PRICE,
  SUBSCRIPTIONS_ADDRESS,
  SUBSCRIPTIONS_ADDRESS_ENS,
} from "../../../constants";
import Tippy from "@tippyjs/react";
import DotLoader from "../../dotLoader/DotLoader";
import {
  numberOfCardsForCalendarEnd,
  numberOfCardsForSeasonEnd,
} from "../../../helpers/meme_calendar.helplers";

const CHAIN_ID = sepolia.id;

export default function UserPageSubscriptionsTopUp(
  props: Readonly<{
    profile: IProfileAndConsolidations;
  }>
) {
  const [memeCount, setMemeCount] = useState<string>("");
  const sendTransaction = useSendTransaction();

  const remainingMintsForSeason = numberOfCardsForSeasonEnd();
  const remainingMintsForYear = numberOfCardsForCalendarEnd();

  const waitSendTransaction = useWaitForTransaction({
    chainId: CHAIN_ID,
    confirmations: 1,
    hash: sendTransaction.data?.hash,
  });

  const [error, setError] = useState<string>("");

  function submit(value: number) {
    setError("");
    if (isNaN(value)) {
      setError("Select card count");
      return;
    }
    sendTransaction.reset();
    sendTransaction.sendTransaction({
      chainId: CHAIN_ID,
      to: SUBSCRIPTIONS_ADDRESS,
      value: parseEther(value.toString()),
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

  function getMessage() {
    if (error) {
      return error;
    }
    if (sendTransaction.isLoading) {
      return "Confirming Transaction...";
    }
    if (sendTransaction.data) {
      return (
        <>
          {getStatusMessage()}{" "}
          <a
            href={getTransactionLink(CHAIN_ID, sendTransaction.data.hash)}
            target="_blank"
            rel="noreferrer">
            view
          </a>
        </>
      );
    }
    return <>&nbsp;</>;
  }

  return (
    <Container className="no-padding">
      <Row className="pb-2">
        <Col className="d-flex align-items-end gap-2 no-wrap">
          <h5 className="mb-0">Top Up</h5>
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
          <CardCountTopup
            count={1}
            disabled={
              sendTransaction.isLoading || waitSendTransaction.isLoading
            }
            submit={(value: number) => {
              submit(value);
            }}
          />
        </Col>
      </Row>
      <Row className="pt-2">
        <Col>
          <CardCountTopup
            count={10}
            disabled={
              sendTransaction.isLoading || waitSendTransaction.isLoading
            }
            submit={(value: number) => {
              submit(value);
            }}
          />
        </Col>
      </Row>
      {remainingMintsForSeason.count > 0 && (
        <Row className="pt-2">
          <Col>
            <CardCountTopup
              count={remainingMintsForSeason.count ?? 0}
              display={`Remaining SZN${remainingMintsForSeason.szn}`}
              disabled={
                sendTransaction.isLoading || waitSendTransaction.isLoading
              }
              submit={(value: number) => {
                submit(value);
              }}
            />
          </Col>
        </Row>
      )}
      {remainingMintsForYear.count > 0 && (
        <Row className="pt-2">
          <Col>
            <CardCountTopup
              count={remainingMintsForYear.count ?? 0}
              display={`Remaining ${remainingMintsForYear.year}`}
              disabled={
                sendTransaction.isLoading || waitSendTransaction.isLoading
              }
              submit={(value: number) => {
                submit(value);
              }}
            />
          </Col>
        </Row>
      )}
      <Row className="pt-2">
        <Col>
          <Form
            onSubmit={(e) => {
              e.preventDefault();
              const count = parseInt(memeCount);
              if (isNaN(count) || count < 1) {
                setError("Enter a valid count");
              } else {
                submit(count * MEMES_MINT_PRICE);
              }
            }}>
            <Form.Group className="mb-3">
              <Row className="d-flex align-items-center">
                <Col xs={6} className="d-flex align-items-center gap-2">
                  <span>Other</span>
                  <Form.Control
                    type="number"
                    min={1}
                    placeholder="count"
                    value={memeCount}
                    style={{ width: "100px", padding: "5px 10px" }}
                    className="font-smaller"
                    onChange={(e) => {
                      setError("");
                      const value = e.target.value;
                      try {
                        parseInt(value);
                        setMemeCount(value);
                      } catch {
                        setMemeCount("");
                      }
                    }}
                  />
                  <span className="no-wrap">
                    {!isNaN(parseInt(memeCount)) && (
                      <>({parseInt(memeCount) * MEMES_MINT_PRICE} ETH)</>
                    )}
                  </span>
                </Col>
                <Col xs={6} className="text-right">
                  <Button
                    style={{ padding: "2px 75px" }}
                    size="lg"
                    type="submit"
                    disabled={
                      sendTransaction.isLoading || waitSendTransaction.isLoading
                    }>
                    Send
                  </Button>
                </Col>
              </Row>
            </Form.Group>
          </Form>
        </Col>
      </Row>
      <Row>
        <Col className="d-flex align-items-center gap-2">{getMessage()}</Col>
      </Row>
      {waitSendTransaction.isLoading && (
        <Row>
          <Col>
            Waiting for confirmation <DotLoader />
          </Col>
        </Row>
      )}
    </Container>
  );
}

function CardCountTopup(
  props: Readonly<{
    count: number;
    display?: string;
    disabled: boolean;
    submit: (value: number) => void;
  }>
) {
  return (
    <Form
      onSubmit={(e) => {
        e.preventDefault();
        props.submit(props.count * MEMES_MINT_PRICE);
      }}>
      <Form.Group>
        <Row className="d-flex align-items-center no-wrap">
          <Col xs={6}>
            {props.display && <span>{props.display} - </span>}
            {props.count} Card{props.count > 1 && "s"} (
            {MEMES_MINT_PRICE * props.count} ETH)
          </Col>
          <Col xs={6} className="text-right">
            <Button
              style={{ padding: "2px 75px" }}
              size="lg"
              type="submit"
              disabled={props.disabled}>
              Send
            </Button>
          </Col>
        </Row>
      </Form.Group>
    </Form>
  );
}
