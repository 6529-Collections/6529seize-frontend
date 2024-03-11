import styles from "./Delegation.module.scss";
import { Container, Row, Col, Form } from "react-bootstrap";
import {
  useContractWrite,
  useEnsAddress,
  useEnsName,
  usePrepareContractWrite,
  useWaitForTransaction,
} from "wagmi";
import { useEffect, useState } from "react";

import {
  DelegationCollection,
  SUB_DELEGATION_USE_CASE,
  SUPPORTED_COLLECTIONS,
} from "../../pages/delegation/[...section]";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Tippy from "@tippyjs/react";
import {
  DELEGATION_ALL_ADDRESS,
  DELEGATION_CONTRACT,
  NEVER_DATE,
} from "../../constants";
import { DELEGATION_ABI } from "../../abis";
import {
  areEqualAddresses,
  getTransactionLink,
  isValidEthAddress,
} from "../../helpers/Helpers";

interface Props {
  address: string;
  subdelegation?: {
    originalDelegator: string;
    collection: DelegationCollection;
  };
  ens: string | null | undefined;
  onHide(): any;
  onSetToast(toast: any): any;
}

export default function NewSubDelegationComponent(props: Readonly<Props>) {
  const orignalDelegatorEnsResolution = useEnsName({
    address: props.subdelegation
      ? (props.subdelegation.originalDelegator as `0x${string}`)
      : undefined,
    chainId: 1,
  });

  const [newDelegationCollection, setNewDelegationCollection] =
    useState<string>("0");
  const [newDelegationToInput, setNewDelegationToInput] = useState("");
  const [newDelegationToAddress, setNewDelegationToAddress] = useState("");

  const [errors, setErrors] = useState<string[]>([]);
  const [gasError, setGasError] = useState<string>();

  const newDelegationToAddressEns = useEnsName({
    address:
      newDelegationToInput && newDelegationToInput.startsWith("0x")
        ? (newDelegationToInput as `0x${string}`)
        : undefined,
    chainId: 1,
  });

  useEffect(() => {
    if (newDelegationToAddressEns.data) {
      setNewDelegationToAddress(newDelegationToInput);
      setNewDelegationToInput(
        `${newDelegationToAddressEns.data} - ${newDelegationToInput}`
      );
    }
  }, [newDelegationToAddressEns.data]);

  const newDelegationToAddressFromEns = useEnsAddress({
    name:
      newDelegationToInput && newDelegationToInput.endsWith(".eth")
        ? newDelegationToInput
        : undefined,
    chainId: 1,
  });

  useEffect(() => {
    if (newDelegationToAddressFromEns.data) {
      setNewDelegationToAddress(newDelegationToAddressFromEns.data);
      setNewDelegationToInput(
        `${newDelegationToInput} - ${newDelegationToAddressFromEns.data}`
      );
    }
  }, [newDelegationToAddressFromEns.data]);

  const contractWriteDelegationConfig = props.subdelegation
    ? usePrepareContractWrite({
        address: DELEGATION_CONTRACT.contract,
        abi: DELEGATION_ABI,
        chainId: DELEGATION_CONTRACT.chain_id,
        args: [
          props.subdelegation.originalDelegator,
          newDelegationCollection,
          newDelegationToAddress,
          NEVER_DATE,
          SUB_DELEGATION_USE_CASE.use_case,
          true,
          0,
        ],
        functionName:
          validate().length === 0
            ? "registerDelegationAddressUsingSubDelegation"
            : undefined,
        onSettled(data, error) {
          if (data) {
            setGasError(undefined);
          }
          if (error) {
            if (error.message.includes("Chain mismatch")) {
              setGasError(
                `Switch to ${
                  DELEGATION_CONTRACT.chain_id === 1
                    ? "Ethereum Mainnet"
                    : "Sepolia Network"
                }`
              );
            } else {
              setGasError(
                "CANNOT ESTIMATE GAS - This can be caused by locked collections/use-cases"
              );
            }
          }
        },
      })
    : usePrepareContractWrite({
        address: DELEGATION_CONTRACT.contract,
        abi: DELEGATION_ABI,
        chainId: DELEGATION_CONTRACT.chain_id,
        args: [
          newDelegationCollection,
          newDelegationToAddress,
          NEVER_DATE,
          SUB_DELEGATION_USE_CASE.use_case,
          true,
          0,
        ],
        functionName:
          validate().length === 0 ? "registerDelegationAddress" : undefined,
        onSettled(data, error) {
          if (data) {
            setGasError(undefined);
          }
          if (error) {
            if (error.message.includes("Chain mismatch")) {
              setGasError(
                `Switch to ${
                  DELEGATION_CONTRACT.chain_id === 1
                    ? "Ethereum Mainnet"
                    : "Sepolia Network"
                }`
              );
            } else {
              setGasError(
                "CANNOT ESTIMATE GAS - This can be caused by locked collections/use-cases"
              );
            }
          }
        },
      });
  const contractWriteDelegation = useContractWrite(
    contractWriteDelegationConfig.config
  );

  const waitContractWriteDelegation = useWaitForTransaction({
    confirmations: 1,
    hash: contractWriteDelegation.data?.hash,
  });

  function clearErrors() {
    setGasError(undefined);
    setErrors([]);
  }

  function validate() {
    const newErrors: string[] = [];
    if (!newDelegationCollection || newDelegationCollection === "0") {
      newErrors.push("Missing or invalid Collection");
    }
    if (!newDelegationToAddress || !isValidEthAddress(newDelegationToAddress)) {
      newErrors.push("Missing or invalid Address");
    } else if (
      (props.subdelegation &&
        newDelegationToAddress.toUpperCase() ==
          props.subdelegation.originalDelegator.toUpperCase()) ||
      (!props.subdelegation &&
        newDelegationToAddress.toUpperCase() === props.address.toUpperCase())
    ) {
      newErrors.push("Invalid Address - cannot delegate to your own wallet");
    }

    return newErrors;
  }

  function clearForm() {
    setErrors([]);
    setNewDelegationToAddress("");
    setNewDelegationToInput("");
    setNewDelegationCollection("0");
  }

  function submitDelegation() {
    const newErrors = validate();
    if (newErrors.length > 0 || gasError) {
      setErrors(newErrors);
      window.scrollBy(0, 100);
    } else {
      contractWriteDelegation.write?.();
      props.onSetToast({
        title: `Registering Delegation Manager`,
        message: "Confirm in your wallet...",
      });
    }
  }

  useEffect(() => {
    if (contractWriteDelegation.error) {
      props.onSetToast({
        title: `Registering Delegation Manager`,
        message:
          contractWriteDelegation.error.message.split("Request Arguments")[0],
      });
    }
    if (contractWriteDelegation.data) {
      if (contractWriteDelegation.data?.hash) {
        if (waitContractWriteDelegation.isLoading) {
          props.onSetToast({
            title: `Registering Delegation Manager`,
            message: `Transaction submitted...
                    <a
                    href=${getTransactionLink(
                      DELEGATION_CONTRACT.chain_id,
                      contractWriteDelegation.data.hash
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className=${styles.etherscanLink}>
                    view
                  </a><br />Waiting for confirmation...`,
          });
        } else {
          props.onSetToast({
            title: `Registering Delegation Manager`,
            message: `Transaction Successful!
                    <a
                    href=${getTransactionLink(
                      DELEGATION_CONTRACT.chain_id,
                      contractWriteDelegation.data.hash
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className=${styles.etherscanLink}>
                    view
                  </a>`,
          });
        }
      }
    }
  }, [
    contractWriteDelegation.error,
    contractWriteDelegation.data,
    waitContractWriteDelegation.isLoading,
  ]);

  return (
    <Container>
      <Row>
        <Col xs={10} className="pt-3 pb-1">
          <h4>Register Delegation Manager (Sub-Delegation)</h4>
        </Col>
        <Col
          xs={2}
          className="pt-3 pb-1 d-flex align-items-center justify-content-end">
          <Tippy
            content={"Cancel Delegation Manager"}
            delay={250}
            placement={"top"}
            theme={"light"}>
            <FontAwesomeIcon
              className={styles.closeNewDelegationForm}
              icon="times-circle"
              onClick={() => props.onHide()}></FontAwesomeIcon>
          </Tippy>
        </Col>
      </Row>
      <Row className="pt-4">
        <Col>
          <Form>
            {props.subdelegation && (
              <Form.Group as={Row} className="pb-4">
                <Form.Label column sm={3} className="d-flex align-items-center">
                  Original Delegator
                  <Tippy
                    content={
                      "Original Delegator of Sub Delegation - The address the delegation will be registed for"
                    }
                    placement={"top"}
                    theme={"light"}>
                    <FontAwesomeIcon
                      className={styles.infoIcon}
                      icon="info-circle"></FontAwesomeIcon>
                  </Tippy>
                </Form.Label>
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
            )}
            <Form.Group as={Row} className="pb-4">
              <Form.Label column sm={3} className="d-flex align-items-center">
                {props.subdelegation ? `Delegation Manager` : `Delegator`}
                <Tippy
                  content={`Address ${
                    props.subdelegation ? `executing` : `registering`
                  } the sub-delegation`}
                  placement={"top"}
                  theme={"light"}>
                  <FontAwesomeIcon
                    className={styles.infoIcon}
                    icon="info-circle"></FontAwesomeIcon>
                </Tippy>
              </Form.Label>
              <Col sm={9}>
                <Form.Control
                  className={`${styles.formInput} ${styles.formInputDisabled}`}
                  type="text"
                  value={
                    props.ens
                      ? `${props.ens} - ${props.address}`
                      : `${props.address}`
                  }
                  disabled
                />
              </Col>
            </Form.Group>
            <Form.Group as={Row} className="pb-4">
              <Form.Label column sm={3} className="d-flex align-items-center">
                Collection{" "}
                <Tippy
                  content={"Collection address for delegation"}
                  placement={"top"}
                  theme={"light"}>
                  <FontAwesomeIcon
                    className={styles.infoIcon}
                    icon="info-circle"></FontAwesomeIcon>
                </Tippy>
              </Form.Label>
              <Col sm={9}>
                <Form.Select
                  className={`${styles.formInput}`}
                  value={newDelegationCollection}
                  onChange={(e) => {
                    setNewDelegationCollection(e.target.value);
                    clearErrors();
                  }}>
                  <option value="0" disabled>
                    Select Collection
                  </option>
                  {!props.subdelegation ||
                  areEqualAddresses(
                    props.subdelegation.collection.contract,
                    DELEGATION_ALL_ADDRESS
                  ) ? (
                    SUPPORTED_COLLECTIONS.map((sc) => (
                      <option
                        key={`add-delegation-select-collection-${sc.contract}`}
                        value={sc.contract}>
                        {`${sc.display}`}
                      </option>
                    ))
                  ) : (
                    <option
                      key={`add-delegation-select-collection`}
                      value={props.subdelegation.collection.contract}>
                      {`${props.subdelegation.collection.display}`}
                    </option>
                  )}
                </Form.Select>
              </Col>
            </Form.Group>
            <Form.Group as={Row} className="pb-4">
              <Form.Label column sm={3} className="d-flex align-items-center">
                Delegate Address
                <Tippy
                  content={"Delegate to Address e.g. your hot wallet"}
                  placement={"top"}
                  theme={"light"}>
                  <FontAwesomeIcon
                    className={styles.infoIcon}
                    icon="info-circle"></FontAwesomeIcon>
                </Tippy>
              </Form.Label>
              <Col sm={9}>
                <Form.Control
                  placeholder={"Delegate to - 0x... or ENS"}
                  className={`${styles.formInput}`}
                  type="text"
                  value={newDelegationToInput}
                  onChange={(e) => {
                    setNewDelegationToInput(e.target.value);
                    setNewDelegationToAddress(e.target.value);
                    clearErrors();
                  }}
                />
              </Col>
            </Form.Group>
            <Form.Group as={Row} className="pt-2 pb-4">
              <Form.Label
                column
                sm={3}
                className="d-flex align-items-center"></Form.Label>
              <Col
                sm={9}
                className="d-flex align-items-center justify-content-center">
                <span
                  className={styles.newDelegationCancelBtn}
                  onClick={() => props.onHide()}>
                  Cancel
                </span>
                <span
                  className={`${styles.newDelegationSubmitBtn} ${
                    contractWriteDelegation.isLoading ||
                    waitContractWriteDelegation.isLoading
                      ? `${styles.newDelegationSubmitBtnDisabled}`
                      : ``
                  }`}
                  onClick={() => {
                    setErrors([]);
                    submitDelegation();
                  }}>
                  Submit{" "}
                  {(contractWriteDelegation.isLoading ||
                    waitContractWriteDelegation.isLoading) && (
                    <div className="d-inline">
                      <div
                        className={`spinner-border ${styles.loader}`}
                        role="status">
                        <span className="sr-only"></span>
                      </div>
                    </div>
                  )}
                </span>
              </Col>
            </Form.Group>
            {(errors.length > 0 || gasError) && (
              <Form.Group
                as={Row}
                className={`pt-2 pb-2 ${styles.newDelegationError}`}>
                <Form.Label column sm={3} className="d-flex align-items-center">
                  Errors
                </Form.Label>
                <Col sm={9} className="d-flex align-items-center">
                  <ul className="mb-0">
                    {errors.map((e, index) => (
                      <li key={`new-delegation-error-${index}`}>{e}</li>
                    ))}
                    {gasError && <li>{gasError}</li>}
                  </ul>
                </Col>
              </Form.Group>
            )}
          </Form>
        </Col>
      </Row>
    </Container>
  );
}
