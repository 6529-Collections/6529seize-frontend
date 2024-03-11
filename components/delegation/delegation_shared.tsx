import styles from "./Delegation.module.scss";
import { useEffect, useState } from "react";
import { Col, Container, Form, Row } from "react-bootstrap";
import { useEnsAddress, useEnsName, useWaitForTransaction } from "wagmi";
import { DELEGATION_CONTRACT } from "../../constants";
import { getTransactionLink } from "../../helpers/Helpers";
import Tippy from "@tippyjs/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export function useOrignalDelegatorEnsResolution(
  props: Readonly<{
    subdelegation?: { originalDelegator: string };
  }>
) {
  return useEnsName({
    address: props.subdelegation
      ? (props.subdelegation.originalDelegator as `0x${string}`)
      : undefined,
    chainId: 1,
  });
}

const DELEGATION_NETWORK_ERROR = `Switch to ${
  DELEGATION_CONTRACT.chain_id === 1 ? "Ethereum Mainnet" : "Sepolia Network"
}`;

const DELEGATION_LOCKED_ERROR =
  "CANNOT ESTIMATE GAS - This can be caused by locked collections/use-cases";

export function getGasError(error: any) {
  if (error.message.includes("Chain mismatch")) {
    return DELEGATION_NETWORK_ERROR;
  } else {
    return DELEGATION_LOCKED_ERROR;
  }
}

export function DelegationAddressInput(
  props: Readonly<{ setAddress: (address: string) => void }>
) {
  const [newDelegationInput, setNewDelegationInput] = useState("");
  const [newDelegationAddress, setNewDelegationAddress] = useState("");

  const newDelegationAddressEns = useEnsName({
    address:
      newDelegationInput && newDelegationInput.startsWith("0x")
        ? (newDelegationInput as `0x${string}`)
        : undefined,
    chainId: 1,
  });

  useEffect(() => {
    if (newDelegationAddressEns.data) {
      setNewDelegationAddress(newDelegationInput);
      setNewDelegationInput(
        `${newDelegationAddressEns.data} - ${newDelegationInput}`
      );
    }
  }, [newDelegationAddressEns.data]);

  const newDelegationToAddressFromEns = useEnsAddress({
    name:
      newDelegationInput && newDelegationInput.endsWith(".eth")
        ? newDelegationInput
        : undefined,
    chainId: 1,
  });

  useEffect(() => {
    if (newDelegationToAddressFromEns.data) {
      setNewDelegationAddress(newDelegationToAddressFromEns.data);
      setNewDelegationInput(
        `${newDelegationInput} - ${newDelegationToAddressFromEns.data}`
      );
    }
  }, [newDelegationToAddressFromEns.data]);

  useEffect(() => {
    props.setAddress(newDelegationAddress);
  }, [newDelegationAddress]);

  return (
    <Form.Control
      placeholder={"Consolidate with - 0x... or ENS"}
      className={`${styles.formInput}`}
      type="text"
      value={newDelegationInput}
      onChange={(e) => {
        setNewDelegationInput(e.target.value);
        setNewDelegationAddress(e.target.value);
      }}
    />
  );
}

export function DelegationWaitContractWrite(
  props: Readonly<{
    title: string;
    data: any;
    error: any;
    onSetToast: (toast: { title: string; message: string }) => void;
    setIsWaitLoading: (isLoading: boolean) => void;
  }>
) {
  const waitContractWriteDelegation = useWaitForTransaction({
    confirmations: 1,
    hash: props.data?.hash,
  });

  useEffect(() => {
    props.setIsWaitLoading(waitContractWriteDelegation.isLoading);
  }, [waitContractWriteDelegation.isLoading]);

  useEffect(() => {
    if (props.error) {
      props.onSetToast({
        title: props.title,
        message: props.error.message.split("Request Arguments")[0],
      });
    }
    if (props.data) {
      if (waitContractWriteDelegation.isLoading) {
        props.onSetToast({
          title: props.title,
          message: `Transaction submitted...
                    <a
                    href=${getTransactionLink(
                      DELEGATION_CONTRACT.chain_id,
                      props.data.hash
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className=${styles.etherscanLink}>
                    view
                  </a><br />Waiting for confirmation...`,
        });
      } else {
        props.onSetToast({
          title: props.title,
          message: `Transaction Successful!
                    <a
                    href=${getTransactionLink(
                      DELEGATION_CONTRACT.chain_id,
                      props.data.hash
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className=${styles.etherscanLink}>
                    view
                  </a>`,
        });
      }
    }
  }, [props.error, props.data, waitContractWriteDelegation.isLoading]);

  return <></>;
}

export function DelegationFormLabel(
  props: Readonly<{ title: string; tooltip: string; span?: number }>
) {
  return (
    <Form.Label
      column
      sm={props.span ?? 3}
      className="d-flex align-items-center">
      {props.title}
      <Tippy content={props.tooltip} placement={"top"} theme={"light"}>
        <FontAwesomeIcon
          className={styles.infoIcon}
          icon="info-circle"></FontAwesomeIcon>
      </Tippy>
    </Form.Label>
  );
}

export function DelegationButtons(
  props: Readonly<{
    showCancel: boolean;
    onSubmit: () => void;
    onHide: () => void;
    isLoading: boolean;
  }>
) {
  return (
    <>
      {props.showCancel && (
        <button
          className={styles.newDelegationCancelBtn}
          onClick={() => props.onHide()}>
          Cancel
        </button>
      )}
      <button
        className={`${styles.newDelegationSubmitBtn} ${
          props.isLoading ? `${styles.newDelegationSubmitBtnDisabled}` : ``
        }`}
        onClick={() => {
          props.onSubmit();
        }}>
        Submit{" "}
        {props.isLoading && (
          <div className="d-inline">
            <div className={`spinner-border ${styles.loader}`} role="status">
              <span className="sr-only"></span>
            </div>
          </div>
        )}
      </button>
    </>
  );
}

export function DelegationSubmitGroups(
  props: Readonly<{
    showCancel: boolean;
    onSubmit: () => void;
    onHide: () => void;
    isLoading: boolean;
    errors: string[];
    gasError?: string;
  }>
) {
  return (
    <>
      <Form.Group as={Row} className="pt-2 pb-4">
        <Form.Label
          column
          sm={4}
          className="d-flex align-items-center"></Form.Label>
        <Col
          sm={8}
          className="d-flex align-items-center  justify-content-center">
          <DelegationButtons
            showCancel={props.showCancel}
            onSubmit={props.onSubmit}
            onHide={props.onHide}
            isLoading={props.isLoading}
          />
        </Col>
      </Form.Group>
      {(props.errors.length > 0 || props.gasError) && (
        <Form.Group
          as={Row}
          className={`pt-2 pb-2 ${styles.newDelegationError}`}>
          <Form.Label column sm={4} className="d-flex align-items-center">
            Errors
          </Form.Label>
          <Col sm={8}>
            <ul className="mb-0">
              {props.errors.map((e, index) => (
                <li key={`new-delegation-error-${index}`}>{e}</li>
              ))}
              {props.gasError && <li>{props.gasError}</li>}
            </ul>
          </Col>
        </Form.Group>
      )}
    </>
  );
}

export function DelegationExpiryCalendar(
  props: Readonly<{
    setDelegationDate: (date: Date | undefined) => void;
  }>
) {
  return (
    <Container fluid className="no-padding pt-3">
      <Row>
        <Col xs={12} xm={12} md={6} lg={4}>
          <Form.Control
            min={new Date().toISOString().slice(0, 10)}
            className={`${styles.formInput}`}
            type="date"
            placeholder="Expiry Date"
            onChange={(e) => {
              const value = e.target.value;
              if (value) {
                props.setDelegationDate(new Date(value));
              } else {
                props.setDelegationDate(undefined);
              }
            }}
          />
        </Col>
      </Row>
    </Container>
  );
}

export function DelegationTokenSelection(
  props: Readonly<{
    setDelegationToken: (token: number | undefined) => void;
  }>
) {
  return (
    <Container fluid className="no-padding pt-3">
      <Row>
        <Col xs={12} xm={12} md={6} lg={4}>
          <Form.Control
            min={0}
            className={`${styles.formInput}`}
            type="number"
            placeholder="Token ID"
            onChange={(e) => {
              const value = e.target.value;
              try {
                const intValue = parseInt(value);
                props.setDelegationToken(intValue);
              } catch {
                props.setDelegationToken(undefined);
              }
            }}
          />
        </Col>
      </Row>
    </Container>
  );
}
