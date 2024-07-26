import styles from "./Delegation.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Tippy from "@tippyjs/react";
import { useState, useEffect } from "react";
import { Form, Row, Col, Container } from "react-bootstrap";
import {
  useEnsName,
  useEnsAddress,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { DELEGATION_ALL_ADDRESS, DELEGATION_CONTRACT } from "../../constants";
import { getRandomObjectId } from "../../helpers/AllowlistToolHelpers";
import { areEqualAddresses, getTransactionLink } from "../../helpers/Helpers";
import {
  DelegationCollection,
  SUPPORTED_COLLECTIONS,
} from "../../pages/delegation/[...section]";
import { useOrignalDelegatorEnsResolution } from "./delegation_shared";

export function DelegationAddressInput(
  props: Readonly<{ setAddress: (address: string) => void }>
) {
  const [newDelegationInput, setNewDelegationInput] = useState("");
  const [newDelegationAddress, setNewDelegationAddress] = useState("");

  const newDelegationAddressEns = useEnsName({
    address: newDelegationInput?.startsWith("0x")
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
    name: newDelegationInput?.endsWith(".eth") ? newDelegationInput : undefined,
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
      placeholder={"0x... or ENS"}
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
          className={`${styles.formInput} ${styles.formInputDisabled}`}
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
      className={`${styles.formInput} ${styles.formInputDisabled}`}
      type="text"
      value={props.ens ? `${props.ens} - ${props.address}` : `${props.address}`}
      disabled
    />
  );
}

export function DelegationAddressDisplay(props: Readonly<{ address: string }>) {
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
          className={`${styles.formInput}`}
          value={props.selected}
          onChange={(e) => props.setSelected(e.target.value)}>
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
    subdelegation?: {
      originalDelegator: string;
      collection: DelegationCollection;
    };
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
        tooltip="Collection address for delegation"
      />
      <Col sm={9}>
        <Form.Select
          className={`${styles.formInput}`}
          value={props.collection}
          onChange={(e) => props.setCollection(e.target.value)}>
          <option value="0" disabled>
            Select Collection
          </option>
          {collections.map((sc) => (
            <option
              key={`add-delegation-select-collection-${sc.contract}`}
              value={sc.contract}>
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
            <output className={`spinner-border ${styles.loader}`}>
              <span className="sr-only"></span>
            </output>
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
  const writeDelegation = useWriteContract();
  const waitWriteDelegation = useWaitForTransactionReceipt({
    confirmations: 1,
    hash: writeDelegation.data,
  });
  const [errors, setErrors] = useState<string[]>([]);

  function submitDelegation() {
    const newErrors = props.validate();
    if (newErrors.length > 0 || props.gasError) {
      setErrors(newErrors);
      window.scrollBy(0, 100);
    } else {
      writeDelegation.writeContract(props.writeParams);
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
                    ${getTransactionAnchor(writeDelegation.data)}
                    <br />Waiting for confirmation...`,
        });
      } else {
        props.onSetToast({
          title: props.title,
          message: `Transaction Successful!
                    ${getTransactionAnchor(writeDelegation.data)}`,
        });
      }
    }
  }, [
    writeDelegation.error,
    writeDelegation.data,
    waitWriteDelegation.isLoading,
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
                <output className={`spinner-border ${styles.loader}`}>
                  <span className="sr-only"></span>
                </output>
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
          <Col sm={8} className="d-flex align-items-center">
            <ul className="mb-0">
              {errors.map((e, index) => (
                <li key={getRandomObjectId()}>{e}</li>
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
