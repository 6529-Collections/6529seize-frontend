"use client";

import styles from "./UserPageSubscriptions.module.scss";
import { useEffect, useState } from "react";
import { Container, Row, Col, Form, Button } from "react-bootstrap";
import { parseEther } from "viem";
import { useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { formatAddress, getTransactionLink } from "../../../helpers/Helpers";
import {
  MEMES_MINT_PRICE,
  SUBSCRIPTIONS_ADDRESS,
  SUBSCRIPTIONS_ADDRESS_ENS,
  SUBSCRIPTIONS_CHAIN,
} from "../../../constants";
import { Tooltip } from "react-tooltip";
import DotLoader from "../../dotLoader/DotLoader";
import {
  numberOfCardsForCalendarEnd,
  numberOfCardsForSeasonEnd,
} from "../../../helpers/meme_calendar.helpers";
import { useCookieConsent } from "../../cookies/CookieConsentContext";
import useCapacitor from "../../../hooks/useCapacitor";
import Link from "next/link";

export default function UserPageSubscriptionsTopUp() {
  const { isIos } = useCapacitor();
  const { country } = useCookieConsent();
  const [memeCount, setMemeCount] = useState<string>("");
  const sendTransaction = useSendTransaction();

  const remainingMintsForSeason = numberOfCardsForSeasonEnd();
  const remainingMintsForYear = numberOfCardsForCalendarEnd();

  const waitSendTransaction = useWaitForTransactionReceipt({
    chainId: SUBSCRIPTIONS_CHAIN.id,
    confirmations: 1,
    hash: sendTransaction.data,
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
      chainId: SUBSCRIPTIONS_CHAIN.id,
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
    if (sendTransaction.isPending) {
      return "Confirming Transaction...";
    }
    if (sendTransaction.data) {
      return (
        <>
          {getStatusMessage()}{" "}
          <a
            href={getTransactionLink(
              SUBSCRIPTIONS_CHAIN.id,
              sendTransaction.data
            )}
            target="_blank"
            rel="noreferrer">
            view
          </a>
        </>
      );
    }
    return <>&nbsp;</>;
  }

  if (isIos && country !== "US") {
    return <></>;
  }

  const iOsContent = (
    <Row className="pt-2">
      <Col>
        <Link
          href={window.location.href}
          className="text-center pt-2 pb-2"
          target="_blank">
          <button className="btn btn-light" style={{ width: "100%" }}>
            Top-up on 6529.io
          </button>
        </Link>
      </Col>
    </Row>
  );

  const topUpContent = (
    <>
      <Row className="pt-2">
        <Col>
          <CardCountTopup
            count={1}
            disabled={
              sendTransaction.isPending || waitSendTransaction.isLoading
            }
            submit={(value: number) => {
              submit(value);
            }}
          />
        </Col>
      </Row>
      <Row className="pt-3">
        <Col>
          <CardCountTopup
            count={10}
            disabled={
              sendTransaction.isPending || waitSendTransaction.isLoading
            }
            submit={(value: number) => {
              submit(value);
            }}
          />
        </Col>
      </Row>
      {remainingMintsForSeason.count > 0 && (
        <Row className="pt-3">
          <Col>
            <CardCountTopup
              count={remainingMintsForSeason.count ?? 0}
              display={`Remaining SZN${remainingMintsForSeason.szn}`}
              disabled={
                sendTransaction.isPending || waitSendTransaction.isLoading
              }
              submit={(value: number) => {
                submit(value);
              }}
            />
          </Col>
        </Row>
      )}
      {remainingMintsForYear.count > 0 && (
        <Row className="pt-3">
          <Col>
            <CardCountTopup
              count={remainingMintsForYear.count ?? 0}
              display={`Remaining ${remainingMintsForYear.year}`}
              disabled={
                sendTransaction.isPending || waitSendTransaction.isLoading
              }
              submit={(value: number) => {
                submit(value);
              }}
            />
          </Col>
        </Row>
      )}
      <Row className="pt-3">
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
                <Col xs={9} sm={8} className="d-flex align-items-center gap-2">
                  <span>Other</span>
                  <Form.Control
                    type="number"
                    min={1}
                    placeholder="count"
                    value={memeCount}
                    style={{ width: "100px", padding: "2px 10px" }}
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
                <Col xs={3} sm={4}>
                  <Button
                    className={styles.sendBtn}
                    type="submit"
                    aria-label="Send custom top up"
                    disabled={
                      sendTransaction.isPending || waitSendTransaction.isLoading
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
    </>
  );

  return (
    <Container className="no-padding">
      <Row className="pb-2">
        <Col className="d-flex align-items-end gap-2 no-wrap">
          <h5 className="mb-0">Top Up</h5>
          <span className="d-flex align-items-center gap-1 font-color-h font-smaller">
            Sending to{" "}
            <>
              <span data-tooltip-id="subscription-address">
                {SUBSCRIPTIONS_ADDRESS_ENS}{" "}
                {formatAddress(SUBSCRIPTIONS_ADDRESS)}
              </span>
              <Tooltip
                id="subscription-address"
                style={{
                  backgroundColor: "#1F2937",
                  color: "white",
                  padding: "4px 8px",
                }}
              >
                <span className="font-smaller">{SUBSCRIPTIONS_ADDRESS}</span>
              </Tooltip>
            </>
          </span>
        </Col>
      </Row>
      {isIos ? iOsContent : topUpContent}
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
          <Col xs={9} sm={8} className="d-flex">
            {props.display && <span>{props.display}&nbsp;-&nbsp;</span>}
            {props.count} Card{props.count > 1 && "s"} (
            {MEMES_MINT_PRICE * props.count} ETH)
          </Col>
          <Col xs={3} sm={4}>
            <Button
              className={styles.sendBtn}
              type="submit"
              disabled={props.disabled}
              aria-label={`Send top up for ${
                props.display ??
                `${props.count} Card${props.count > 1 ? "s" : ""}`
              }`}>
              Send
            </Button>
          </Col>
        </Row>
      </Form.Group>
    </Form>
  );
}
