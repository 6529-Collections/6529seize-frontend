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
  CONSOLIDATION_USE_CASE,
  DelegationCollection,
  DELEGATION_USE_CASES,
  SUPPORTED_COLLECTIONS,
} from "../../pages/delegations/[contract]";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Tippy from "@tippyjs/react";
import { DELEGATION_ALL_ADDRESS, DELEGATION_CONTRACT } from "../../constants";
import { DELEGATION_ABI } from "../../abis";
import {
  areEqualAddresses,
  getTransactionLink,
  isValidEthAddress,
} from "../../helpers/Helpers";

interface Props {
  address: string;
  ens: string | null | undefined;
  incomingDelegations: string[];
  collection: DelegationCollection;
  showCancel: boolean;
  showAddMore: boolean;
  onHide(): any;
  onSetToast(toast: any): any;
  onSetShowToast(show: boolean): any;
}

export default function RevokeDelegationWithSubComponent(props: Props) {
  const [showingConsolidation, setShowingConsolidation] = useState(false);
  const [newDelegationCollection, setNewDelegationCollection] =
    useState<string>(props.collection ? props.collection.contract : "0");
  const [newDelegationUseCase, setNewDelegationUseCase] = useState<number>(0);
  const [newDelegationToInput, setNewDelegationToInput] = useState("");
  const [newDelegationToAddress, setNewDelegationToAddress] = useState("");
  const [newDelegationOriginalDelegator, setNewDelegationOriginalDelegator] =
    useState(
      props.incomingDelegations.length == 1 ? props.incomingDelegations[0] : ""
    );

  const [errors, setErrors] = useState<string[]>([]);
  const [gasError, setGasError] = useState(false);

  const newDelegationToAddressEns = useEnsName({
    address:
      newDelegationToInput && newDelegationToInput.startsWith("0x")
        ? (newDelegationToInput as `0x${string}`)
        : undefined,
    chainId: 1,
  });

  const incomingDelegationsEns = props.incomingDelegations.map((id) => {
    return useEnsName({
      address: id as `0x${string}`,
      chainId: 1,
    });
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

  const contractWriteDelegationConfig = usePrepareContractWrite({
    address: DELEGATION_CONTRACT.contract,
    abi: DELEGATION_ABI,
    chainId: DELEGATION_CONTRACT.chain_id,
    args: [
      newDelegationOriginalDelegator,
      showingConsolidation ? DELEGATION_ALL_ADDRESS : newDelegationCollection,
      newDelegationToAddress,
      showingConsolidation ? CONSOLIDATION_USE_CASE : newDelegationUseCase,
    ],
    functionName:
      validate().length == 0
        ? "revokeDelegationAddressUsingSubdelegation"
        : undefined,
    onSettled(data, error) {
      if (data) {
        setGasError(false);
      }
      if (error) {
        setGasError(true);
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
    setGasError(false);
    setErrors([]);
  }

  function validate() {
    const newErrors: string[] = [];
    if (
      !newDelegationOriginalDelegator ||
      newDelegationOriginalDelegator == ""
    ) {
      newErrors.push("Missing or invalid Original Delegator");
    }
    if (
      (!newDelegationCollection || newDelegationCollection == "0") &&
      !showingConsolidation
    ) {
      newErrors.push("Missing or invalid Collection");
    }
    if (!newDelegationUseCase && !showingConsolidation) {
      newErrors.push("Missing or invalid Use Case");
    }
    if (!newDelegationToAddress || !isValidEthAddress(newDelegationToAddress)) {
      newErrors.push("Missing or invalid Address");
    }

    return newErrors;
  }

  function clearForm() {
    setErrors([]);
    setNewDelegationUseCase(0);
  }

  function submitDelegation() {
    const newErrors = validate();
    if (newErrors.length > 0 || gasError) {
      setErrors(newErrors);
      window.scrollBy(0, 100);
    } else {
      contractWriteDelegation.write?.();
      props.onSetToast({
        title: `Revoking ${
          showingConsolidation ? `Consolidation` : `Delegation`
        } Using Sub-Delegation Rights`,
        message: "Confirm in your wallet...",
      });
      props.onSetShowToast(true);
    }
  }

  useEffect(() => {
    if (contractWriteDelegation.error) {
      props.onSetToast({
        title: `Revoking ${
          showingConsolidation ? `Consolidation` : `Delegation`
        } Using Sub-Delegation Rights`,
        message: contractWriteDelegation.error.message,
      });
    }
    if (contractWriteDelegation.data) {
      if (contractWriteDelegation.data?.hash) {
        if (waitContractWriteDelegation.isLoading) {
          props.onSetToast({
            title: `Revoking ${
              showingConsolidation ? `Consolidation` : `Delegation`
            } Using Sub-Delegation Rights`,
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
            title: `Revoking ${
              showingConsolidation ? `Consolidation` : `Delegation`
            } Using Sub-Delegation Rights`,
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
    <Container className="no-padding">
      <Row>
        <Col xs={10} className="pt-3 pb-1">
          <h4>Revoke Using Sub-Delegation Rights</h4>
        </Col>
        {props.showCancel && (
          <Col
            xs={2}
            className="pt-3 pb-1 d-flex align-items-center justify-content-end">
            <Tippy
              content={"Cancel Delegation"}
              delay={250}
              placement={"top"}
              theme={"light"}>
              <FontAwesomeIcon
                className={styles.closeNewDelegationForm}
                icon="times-circle"
                onClick={() => props.onHide()}></FontAwesomeIcon>
            </Tippy>
          </Col>
        )}
        <Col
          xs={12}
          className="pt-1 pb-4 d-flex align-items-center justify-content-start">
          <h5
            onClick={() => setShowingConsolidation(false)}
            className={`
              ${styles.registerHeading} ${
              !showingConsolidation ? styles.registerHeadingActive : ``
            }
            `}>
            Delegation
          </h5>
          <h5>&nbsp;&nbsp;|&nbsp;&nbsp;</h5>
          <h5
            onClick={() => setShowingConsolidation(true)}
            className={`
              ${styles.registerHeading} ${
              showingConsolidation ? styles.registerHeadingActive : ``
            }
            `}>
            Consolidation
          </h5>
        </Col>
      </Row>
      <Row>
        <Col>
          <Form>
            <Form.Group as={Row} className="pb-4">
              <Form.Label column sm={3} className="d-flex align-items-center">
                Delegator
                <Tippy
                  content={"Address initiating the delegation"}
                  placement={"top"}
                  theme={"light"}>
                  <FontAwesomeIcon
                    className={styles.infoIcon}
                    icon="info-circle"
                    onClick={() => props.onHide()}></FontAwesomeIcon>
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
                Original Delegator
                <Tippy
                  content={"Original Delegator of Sub Delegation"}
                  placement={"top"}
                  theme={"light"}>
                  <FontAwesomeIcon
                    className={styles.infoIcon}
                    icon="info-circle"
                    onClick={() => props.onHide()}></FontAwesomeIcon>
                </Tippy>
              </Form.Label>
              <Col sm={9}>
                <Form.Select
                  className={`${styles.formInput}`}
                  value={newDelegationOriginalDelegator}
                  onChange={(e) =>
                    setNewDelegationOriginalDelegator(e.target.value)
                  }>
                  {props.incomingDelegations.length > 1 && (
                    <option value="" disabled>
                      Select
                    </option>
                  )}
                  {props.incomingDelegations.map((id, index) => (
                    <option
                      key={`revoke-delegation-select-delegator-${id}`}
                      value={id}>
                      {incomingDelegationsEns?.length > 0 &&
                      incomingDelegationsEns[index].data
                        ? `${incomingDelegationsEns[index].data} - `
                        : ``}
                      {id}
                    </option>
                  ))}
                </Form.Select>
              </Col>
            </Form.Group>
            {!showingConsolidation && (
              <Form.Group as={Row} className="pb-4">
                <Form.Label column sm={3} className="d-flex align-items-center">
                  Collection
                  <Tippy
                    content={"Collection address for delegation"}
                    placement={"top"}
                    theme={"light"}>
                    <FontAwesomeIcon
                      className={styles.infoIcon}
                      icon="info-circle"
                      onClick={() => props.onHide()}></FontAwesomeIcon>
                  </Tippy>
                </Form.Label>
                <Col sm={9}>
                  {areEqualAddresses(
                    props.collection.contract,
                    DELEGATION_ALL_ADDRESS
                  ) ? (
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
                      {SUPPORTED_COLLECTIONS.map((sc) => (
                        <option
                          key={`revoke-delegation-select-collection-${sc.contract}`}
                          value={sc.contract}>
                          {`${sc.display}`}
                        </option>
                      ))}
                    </Form.Select>
                  ) : (
                    <Form.Control
                      className={`${styles.formInput} ${styles.formInputDisabled}`}
                      type="text"
                      value={`${props.collection.display}`}
                      disabled
                    />
                  )}
                </Col>
              </Form.Group>
            )}
            <Form.Group as={Row} className="pb-4">
              <Form.Label column sm={3} className="d-flex align-items-center">
                Address
                <Tippy
                  content={"Delegate to Address e.g. your hot wallet"}
                  placement={"top"}
                  theme={"light"}>
                  <FontAwesomeIcon
                    className={styles.infoIcon}
                    icon="info-circle"
                    onClick={() => props.onHide()}></FontAwesomeIcon>
                </Tippy>
              </Form.Label>
              <Col sm={9}>
                <Form.Control
                  placeholder="Delegation Address"
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
            {!showingConsolidation && (
              <Form.Group as={Row} className="pb-4">
                <Form.Label column sm={3} className="d-flex align-items-center">
                  Use Case
                  <Tippy
                    content={"Delegation Use Case"}
                    placement={"top"}
                    theme={"light"}>
                    <FontAwesomeIcon
                      className={styles.infoIcon}
                      icon="info-circle"
                      onClick={() => props.onHide()}></FontAwesomeIcon>
                  </Tippy>
                </Form.Label>
                <Col sm={9}>
                  <Form.Select
                    className={`${styles.formInput}`}
                    value={newDelegationUseCase}
                    onChange={(e) => {
                      setNewDelegationUseCase(parseInt(e.target.value));
                      clearErrors();
                    }}>
                    <option value={0} disabled>
                      Select Use Case
                    </option>
                    {DELEGATION_USE_CASES.map((uc) => (
                      <option
                        key={`revoke-delegation-select-use-case-${uc.use_case}`}
                        value={uc.use_case}>
                        #{uc.use_case} - {uc.display}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
              </Form.Group>
            )}
            <Form.Group as={Row} className="pt-2 pb-4">
              <Form.Label
                column
                sm={3}
                className="d-flex align-items-center"></Form.Label>
              <Col
                sm={9}
                className="d-flex align-items-center justify-content-center">
                {props.showCancel && (
                  <span
                    className={styles.newDelegationCancelBtn}
                    onClick={() => props.onHide()}>
                    Cancel
                  </span>
                )}
                <span
                  className={`${styles.revokeDelegationBtn} ${
                    contractWriteDelegation.isLoading ||
                    waitContractWriteDelegation.isLoading
                      ? `${styles.revokeDelegationBtnDisabled}`
                      : ``
                  }`}
                  onClick={() => {
                    setErrors([]);
                    submitDelegation();
                  }}>
                  Revoke{" "}
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
                <Col sm={9}>
                  <ul className="mb-0">
                    {errors.map((e, index) => (
                      <li key={`new-delegation-error-${index}`}>{e}</li>
                    ))}
                    {gasError && (
                      <li>
                        CANNOT ESTIMATE GAS - This can be caused by locked
                        collections/use-cases
                      </li>
                    )}
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
