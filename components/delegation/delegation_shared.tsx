import styles from "./Delegation.module.scss";
import { useEffect, useState } from "react";
import { Col, Container, Form, Row } from "react-bootstrap";
import {
  useContractWrite,
  useEnsAddress,
  useEnsName,
  usePrepareContractWrite,
  useWaitForTransaction,
} from "wagmi";
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
    title: string;
    writeParams: any;
    showCancel: boolean;
    gasError?: string;
    validate: () => string[];
    onHide: () => void;
    onSetToast: (toast: { title: string; message: string }) => void;
    submitBtnLabel?: string;
  }>
) {
  const writeConfig = usePrepareContractWrite(props.writeParams);
  const writeDelegation = useContractWrite(writeConfig.config);
  const waitWriteDelegation = useWaitForTransaction({
    confirmations: 1,
    hash: writeDelegation.data?.hash,
  });
  const [errors, setErrors] = useState<string[]>([]);

  function submitDelegation() {
    const newErrors = props.validate();
    if (newErrors.length > 0 || props.gasError) {
      setErrors(newErrors);
      window.scrollBy(0, 100);
    } else {
      writeDelegation.write?.();
      props.onSetToast({
        title: props.title,
        message: "Confirm in your wallet...",
      });
    }
  }

  function getTransactionAnchor(hash: any) {
    return `<a href=${getTransactionLink(DELEGATION_CONTRACT.chain_id, hash)}
    target="_blank"
    rel="noreferrer"
    className=${styles.etherscanLink}>
      view
    </a>`;
  }

  useEffect(() => {
    if (writeDelegation.error) {
      props.onSetToast({
        title: props.title,
        message: writeDelegation.error.message.split("Request Arguments")[0],
      });
    }
    if (writeDelegation.data) {
      if (waitWriteDelegation.isLoading) {
        props.onSetToast({
          title: props.title,
          message: `Transaction submitted...
                    ${getTransactionAnchor(writeDelegation.data.hash)}
                    <br />Waiting for confirmation...`,
        });
      } else {
        props.onSetToast({
          title: props.title,
          message: `Transaction Successful!
                    ${getTransactionAnchor(writeDelegation.data.hash)}`,
        });
      }
    }
  }, [
    writeDelegation.error,
    writeDelegation.data,
    waitWriteDelegation.isLoading,
  ]);

  function isLoading() {
    return writeDelegation.isLoading || waitWriteDelegation.isLoading;
  }

  return (
    <>
      <Form.Group as={Row} className="pt-2 pb-4">
        <Form.Label
          column
          sm={4}
          className="d-flex align-items-center"></Form.Label>
        <Col
          sm={8}
          className="d-flex align-items-center justify-content-center">
          {props.showCancel && (
            <button
              className={styles.newDelegationCancelBtn}
              onClick={() => props.onHide()}>
              Cancel
            </button>
          )}
          <button
            className={`${styles.newDelegationSubmitBtn} ${
              isLoading() ? `${styles.newDelegationSubmitBtnDisabled}` : ``
            }`}
            onClick={(e) => {
              e.preventDefault();
              submitDelegation();
            }}>
            {props.submitBtnLabel ?? "Submit"}{" "}
            {isLoading() && (
              <div className="d-inline">
                <div
                  className={`spinner-border ${styles.loader}`}
                  role="status">
                  <span className="sr-only"></span>
                </div>
              </div>
            )}
          </button>
        </Col>
      </Form.Group>
      {(errors.length > 0 || props.gasError) && (
        <Form.Group
          as={Row}
          className={`pt-2 pb-2 ${styles.newDelegationError}`}>
          <Form.Label column sm={4} className="d-flex align-items-center">
            Errors
          </Form.Label>
          <Col sm={8}>
            <ul className="mb-0">
              {errors.map((e, index) => (
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

export function DelegationCloseButton(
  props: Readonly<{ title: string; onHide: () => void }>
) {
  return (
    <Tippy
      content={`Cancel ${props.title}`}
      delay={250}
      placement={"top"}
      theme={"light"}>
      <FontAwesomeIcon
        className={styles.closeNewDelegationForm}
        icon="times-circle"
        onClick={() => props.onHide()}></FontAwesomeIcon>
    </Tippy>
  );
}
