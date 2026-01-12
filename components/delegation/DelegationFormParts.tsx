"use client";

import {
  DELEGATION_ALL_ADDRESS,
  DELEGATION_CONTRACT,
} from "@/constants/constants";
import { getRandomObjectId } from "@/helpers/AllowlistToolHelpers";
import { areEqualAddresses, getTransactionLink } from "@/helpers/Helpers";
import { useEnsResolution } from "@/hooks/useEnsResolution";
import { faInfoCircle, faTimesCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useEffectEvent, useState } from "react";
import { Col, Container, Form, Row } from "react-bootstrap";
import { Tooltip } from "react-tooltip";
import {
  useEnsName,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import type { DelegationCollection } from "./delegation-constants";
import { SUPPORTED_COLLECTIONS } from "./delegation-constants";
import { useOrignalDelegatorEnsResolution } from "./delegation-shared";
import styles from "./Delegation.module.scss";

function DelegationAddressInput(
  props: Readonly<{ setAddress: (address: string) => void }>
) {
  const { setAddress } = props;
  const { inputValue, address, handleInputChange } = useEnsResolution({
    chainId: 1,
  });

  useEffect(() => {
    setAddress(address);
  }, [setAddress, address]);

  return (
    <Form.Control
      placeholder={"0x... or ENS"}
      className={`${styles["formInput"]}`}
      type="text"
      value={inputValue}
      onChange={(e) => {
        handleInputChange(e.target.value);
      }}
    />
  );
}

export function DelegationFormLabel(
  props: Readonly<{ title: string; tooltip: string; span?: number | undefined }>
) {
  const tooltipId = `delegation-form-label-${props.title
    .toLowerCase()
    .replace(/\s+/g, "-")}`;

  return (
    <Form.Label
      column
      sm={props.span ?? 3}
      className="d-flex align-items-center"
    >
      {props.title}
      <FontAwesomeIcon
        className={styles["infoIcon"]}
        icon={faInfoCircle}
        data-tooltip-id={tooltipId}
      ></FontAwesomeIcon>
      <Tooltip
        id={tooltipId}
        place="top"
        style={{
          backgroundColor: "#1F2937",
          color: "white",
          padding: "4px 8px",
        }}
      >
        {props.tooltip}
      </Tooltip>
    </Form.Label>
  );
}

export function DelegationFormOriginalDelegatorFormGroup(
  props: Readonly<{
    subdelegation: { originalDelegator: string };
  }>
) {
  const orignalDelegatorEnsResolution = useOrignalDelegatorEnsResolution({
    subdelegation: props.subdelegation,
  });

  return (
    <Form.Group as={Row} className="pb-4">
      <DelegationFormLabel
        title="Original Delegator"
        tooltip="Original Delegator of Sub Delegation - The address the delegation will be registed for"
      />
      <Col sm={9}>
        <Form.Control
          className={`${styles["formInput"]} ${styles["formInputDisabled"]}`}
          type="text"
          value={
            orignalDelegatorEnsResolution.data
              ? `${orignalDelegatorEnsResolution.data} - ${props.subdelegation.originalDelegator}`
              : `${props.subdelegation.originalDelegator}`
          }
          disabled
        />
      </Col>
    </Form.Group>
  );
}

export function DelegationAddressDisabledInput(
  props: Readonly<{ address: string; ens: string | null | undefined }>
) {
  return (
    <Form.Control
      className={`${styles["formInput"]} ${styles["formInputDisabled"]}`}
      type="text"
      value={props.ens ? `${props.ens} - ${props.address}` : `${props.address}`}
      disabled
    />
  );
}

function DelegationAddressDisplay(props: Readonly<{ address: string }>) {
  const ens = useEnsName({
    address: props.address as `0x${string}`,
    chainId: 1,
  });

  return (
    <>
      {props.address}
      {ens.data && ` - ${ens.data}`}
    </>
  );
}

export function DelegationFormOptionsFormGroup(
  props: Readonly<{
    title: string;
    tooltip: string;
    options: string[];
    selected: string;
    setSelected: (s: string) => void;
  }>
) {
  return (
    <Form.Group as={Row} className="pb-4">
      <DelegationFormLabel title={props.title} tooltip={props.tooltip} />
      <Col sm={9}>
        <Form.Select
          className={`${styles["formInput"]}`}
          value={props.selected}
          onChange={(e) => props.setSelected(e.target.value)}
        >
          <option value="" disabled>
            Select
          </option>
          {props.options.map((o) => (
            <option key={o} value={o}>
              <DelegationAddressDisplay address={o} />
            </option>
          ))}
        </Form.Select>
      </Col>
    </Form.Group>
  );
}

export function DelegationFormCollectionFormGroup(
  props: Readonly<{
    collection: string;
    setCollection: (collection: string) => void;
    subdelegation?:
      | {
          originalDelegator: string;
          collection: DelegationCollection;
        }
      | undefined;
    consolidation?: boolean | undefined;
  }>
) {
  const collections =
    !props.subdelegation ||
    areEqualAddresses(
      props.subdelegation.collection.contract,
      DELEGATION_ALL_ADDRESS
    )
      ? SUPPORTED_COLLECTIONS
      : [props.subdelegation.collection];

  return (
    <Form.Group as={Row} className="pb-4">
      <DelegationFormLabel
        title="Collection"
        tooltip={`Collection address for ${
          props.consolidation ? "consolidation" : "delegation"
        }`}
      />
      <Col sm={9}>
        <Form.Select
          className={`${styles["formInput"]}`}
          value={props.collection}
          onChange={(e) => props.setCollection(e.target.value)}
        >
          <option value="0" disabled>
            Select Collection
          </option>
          {collections.map((sc) => (
            <option
              key={`add-delegation-select-collection-${sc.contract}`}
              value={sc.contract}
            >
              {`${sc.display}`}
            </option>
          ))}
        </Form.Select>
      </Col>
    </Form.Group>
  );
}

export function DelegationFormDelegateAddressFormGroup(
  props: Readonly<{
    setAddress: (address: string) => void;
    title: string;
    tooltip: string;
  }>
) {
  return (
    <Form.Group as={Row} className="pb-4">
      <DelegationFormLabel title={props.title} tooltip={props.tooltip} />
      <Col sm={9}>
        <DelegationAddressInput
          setAddress={(address: string) => props.setAddress(address)}
        />
      </Col>
    </Form.Group>
  );
}

export function DelegationSubmitGroups(
  props: Readonly<{
    title: string;
    writeParams: any;
    showCancel: boolean;
    gasError?: string | undefined;
    validate: () => string[];
    onHide: () => void;
    onSetToast: (toast: { title: string; message: string }) => void;
    submitBtnLabel?: string | undefined;
  }>
) {
  const {
    title,
    writeParams,
    showCancel,
    gasError,
    validate,
    onHide,
    onSetToast,
    submitBtnLabel,
  } = props;
  const writeDelegation = useWriteContract();
  const waitWriteDelegation = useWaitForTransactionReceipt({
    confirmations: 1,
    hash: writeDelegation.data,
  });
  const [errors, setErrors] = useState<string[]>([]);
  const emitToast = useEffectEvent(
    (toast: { title: string; message: string }) => {
      onSetToast(toast);
    }
  );

  function submitDelegation() {
    const newErrors = validate();
    if (newErrors.length > 0 || gasError) {
      setErrors(newErrors);
      window.scrollBy(0, 100);
    } else {
      writeDelegation.writeContract(writeParams);
      onSetToast({
        title,
        message: "Confirm in your wallet...",
      });
    }
  }

  function getTransactionAnchor(hash: any) {
    return `<a href=${getTransactionLink(DELEGATION_CONTRACT.chain_id, hash)}
    target="_blank"
    rel="noopener noreferrer"
    className=${styles["etherscanLink"]}>
      view
    </a>`;
  }

  useEffect(() => {
    if (writeDelegation.error) {
      emitToast({
        title,
        message: writeDelegation.error.message.split("Request Arguments")[0]!,
      });
    }
    if (writeDelegation.data) {
      if (waitWriteDelegation.isLoading) {
        emitToast({
          title,
          message: `Transaction submitted...
                    ${getTransactionAnchor(writeDelegation.data)}
                    <br />Waiting for confirmation...`,
        });
      } else {
        emitToast({
          title,
          message: `Transaction Successful!
                    ${getTransactionAnchor(writeDelegation.data)}`,
        });
      }
    }
  }, [
    writeDelegation.error,
    writeDelegation.data,
    waitWriteDelegation.isLoading,
    title,
  ]);

  function isLoading() {
    return writeDelegation.isPending || waitWriteDelegation.isLoading;
  }

  return (
    <>
      <Form.Group as={Row} className="pt-2 pb-4">
        <Form.Label
          column
          sm={4}
          className="d-flex align-items-center"
        ></Form.Label>
        <Col
          sm={8}
          className="d-flex align-items-center justify-content-center"
        >
          {showCancel && (
            <button
              className={styles["newDelegationCancelBtn"]}
              onClick={() => onHide()}
            >
              Cancel
            </button>
          )}
          <button
            className={`${styles["newDelegationSubmitBtn"]} ${
              isLoading() ? `${styles["newDelegationSubmitBtnDisabled"]}` : ``
            }`}
            onClick={(e) => {
              e.preventDefault();
              submitDelegation();
            }}
          >
            {submitBtnLabel ?? "Submit"}{" "}
            {isLoading() && (
              <div className="d-inline">
                <output className={`spinner-border ${styles["loader"]}`}>
                  <span className="sr-only"></span>
                </output>
              </div>
            )}
          </button>
        </Col>
      </Form.Group>
      {(errors.length > 0 || gasError) && (
        <Form.Group
          as={Row}
          className={`pt-2 pb-2 ${styles["newDelegationError"]}`}
        >
          <Form.Label column sm={4} className="d-flex align-items-center">
            Errors
          </Form.Label>
          <Col sm={8} className="d-flex align-items-center">
            <ul className="mb-0">
              {errors.map((e) => (
                <li key={getRandomObjectId()}>{e}</li>
              ))}
              {gasError && <li>{gasError}</li>}
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
            className={`${styles["formInput"]}`}
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
            className={`${styles["formInput"]}`}
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
  const tooltipId = `delegation-close-button-${props.title
    .toLowerCase()
    .replace(/\s+/g, "-")}`;

  return (
    <>
      <FontAwesomeIcon
        aria-label={`Cancel ${props.title}`}
        className={styles["closeNewDelegationForm"]}
        icon={faTimesCircle}
        onClick={() => props.onHide()}
        data-tooltip-id={tooltipId}
      ></FontAwesomeIcon>
      <Tooltip
        id={tooltipId}
        place="top"
        delayShow={250}
        style={{
          backgroundColor: "#1F2937",
          color: "white",
          padding: "4px 8px",
        }}
      >
        {`Cancel ${props.title}`}
      </Tooltip>
    </>
  );
}
