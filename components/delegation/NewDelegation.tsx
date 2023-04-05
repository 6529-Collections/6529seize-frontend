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
  DELEGATION_USE_CASES,
  SUPPORTED_COLLECTIONS,
} from "../../pages/delegations/[contract]";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Tippy from "@tippyjs/react";
import { DELEGATION_CONTRACT, NEVER_DATE } from "../../constants";
import { DELEGATION_ABI } from "../../abis";
import { getTransactionLink, isValidEthAddress } from "../../helpers/Helpers";

interface Props {
  address: string;
  ens: string | null | undefined;
  collection?: DelegationCollection;
  showCancel: boolean;
  showAddMore: boolean;
  onHide(): any;
  onSetToast(toast: any): any;
  onSetShowToast(show: boolean): any;
}

export default function NewDelegationComponent(props: Props) {
  const [showExpiryCalendar, setShowExpiryCalendar] = useState(false);
  const [showTokensInput, setShowTokensInput] = useState(false);

  const [newDelegationDate, setNewDelegationDate] = useState<Date | undefined>(
    undefined
  );
  const [newDelegationToken, setNewDelegationToken] = useState<
    number | undefined
  >(undefined);
  const [newDelegationUseCase, setNewDelegationUseCase] = useState<number>(0);
  const [newDelegationCollection, setNewDelegationCollection] =
    useState<string>(props.collection ? props.collection.contract : "0");
  const [newDelegationToInput, setNewDelegationToInput] = useState("");
  const [newDelegationToAddress, setNewDelegationToAddress] = useState("");

  const [errors, setErrors] = useState<string[]>([]);
  const [gasError, setGasError] = useState(false);

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

  const contractWriteDelegationConfig = usePrepareContractWrite({
    address: DELEGATION_CONTRACT.contract,
    abi: DELEGATION_ABI,
    chainId: DELEGATION_CONTRACT.chain_id,
    args: [
      newDelegationCollection,
      newDelegationToAddress,
      showExpiryCalendar && newDelegationDate
        ? newDelegationDate.getTime() / 1000
        : NEVER_DATE,
      newDelegationUseCase,
      showTokensInput ? false : true,
      showTokensInput ? newDelegationToken : 0,
    ],
    functionName:
      validate().length == 0 ? "registerDelegationAddress" : undefined,
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

  function validate() {
    const newErrors: string[] = [];
    if (!newDelegationCollection || newDelegationCollection == "0") {
      newErrors.push("Missing or invalid Collection");
    }
    if (!newDelegationUseCase) {
      newErrors.push("Missing or invalid Use Case");
    }
    if (!newDelegationToAddress || !isValidEthAddress(newDelegationToAddress)) {
      newErrors.push("Missing or invalid Address");
    }
    if (showExpiryCalendar && !newDelegationDate) {
      newErrors.push("Missing or invalid Expiry");
    }
    if (showTokensInput && !newDelegationToken) {
      newErrors.push("Missing or invalid Token ID");
    }

    return newErrors;
  }

  function clearForm() {
    setErrors([]);
    setShowExpiryCalendar(false);
    setShowTokensInput(false);
    setNewDelegationDate(undefined);
    setNewDelegationToken(undefined);
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
        title: `Registering Delegation`,
        message: "Confirm in your wallet...",
      });
      props.onSetShowToast(true);
    }
  }

  useEffect(() => {
    if (contractWriteDelegation.error) {
      props.onSetToast({
        title: `Registering Delegation`,
        message: contractWriteDelegation.error.message,
      });
    }
    if (contractWriteDelegation.data) {
      if (contractWriteDelegation.data?.hash) {
        if (waitContractWriteDelegation.isLoading) {
          props.onSetToast({
            title: "Registering Delegation",
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
            title: "Registering Delegation",
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
        <Col xs={10} className="pt-3 pb-3">
          <h4>Register Delegation</h4>
        </Col>
        {props.showCancel && (
          <Col xs={2} className="d-flex align-items-center justify-content-end">
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
      </Row>
      <Row>
        <Col>
          <Form>
            <Form.Group as={Row} className="pb-4">
              <Form.Label column sm={2}>
                Delegator
              </Form.Label>
              <Col sm={10}>
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
              <Form.Label column sm={2}>
                Collection
              </Form.Label>
              <Col sm={10}>
                <Form.Select
                  className={`${styles.formInput}`}
                  value={newDelegationCollection}
                  onChange={(e) => {
                    setNewDelegationCollection(e.target.value);
                    setGasError(false);
                  }}>
                  <option value="0" disabled>
                    Select Collection
                  </option>
                  {SUPPORTED_COLLECTIONS.map((sc) => (
                    <option
                      key={`add-delegation-select-collection-${sc.contract}`}
                      value={sc.contract}>
                      {`${sc.display}`}
                    </option>
                  ))}
                </Form.Select>
              </Col>
            </Form.Group>
            <Form.Group as={Row} className="pb-4">
              <Form.Label column sm={2}>
                Address
              </Form.Label>
              <Col sm={10}>
                <Form.Control
                  placeholder="Delegate to"
                  className={`${styles.formInput}`}
                  type="text"
                  value={newDelegationToInput}
                  onChange={(e) => {
                    setNewDelegationToInput(e.target.value);
                    setNewDelegationToAddress(e.target.value);
                    setGasError(false);
                  }}
                />
              </Col>
            </Form.Group>
            <Form.Group as={Row} className="pb-4">
              <Form.Label column sm={2}>
                Use Case
              </Form.Label>
              <Col sm={10}>
                <Form.Select
                  className={`${styles.formInput}`}
                  value={newDelegationUseCase}
                  onChange={(e) => {
                    const newCase = parseInt(e.target.value);
                    setNewDelegationUseCase(newCase);
                    if (newCase == 16 || newCase == 99) {
                      setNewDelegationDate(undefined);
                      setShowExpiryCalendar(false);
                      setNewDelegationToken(undefined);
                      setShowTokensInput(false);
                    }
                    setGasError(false);
                  }}>
                  <option value={0} disabled>
                    Select Use Case
                  </option>
                  {DELEGATION_USE_CASES.map((uc) => (
                    <option
                      key={`add-delegation-select-use-case-${uc.use_case}`}
                      value={uc.use_case}>
                      #{uc.use_case} - {uc.display}
                    </option>
                  ))}
                </Form.Select>
              </Col>
            </Form.Group>
            <Form.Group as={Row} className="pb-4">
              <Form.Label column sm={2}>
                Expiry
              </Form.Label>
              <Col sm={10}>
                <Form.Check
                  checked={!showExpiryCalendar}
                  className={styles.newDelegationFormToggle}
                  type="radio"
                  label="Never"
                  name="expiryRadio"
                  onChange={() => setShowExpiryCalendar(false)}
                />
                &nbsp;&nbsp;
                <Form.Check
                  checked={showExpiryCalendar}
                  className={styles.newDelegationFormToggle}
                  type="radio"
                  disabled={
                    newDelegationUseCase == 16 || newDelegationUseCase == 99
                  }
                  label="Select Date"
                  name="expiryRadio"
                  onChange={() => setShowExpiryCalendar(true)}
                />
                {showExpiryCalendar && (
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
                              setNewDelegationDate(new Date(value));
                            } else {
                              setNewDelegationDate(undefined);
                            }
                          }}
                        />
                      </Col>
                    </Row>
                  </Container>
                )}
              </Col>
            </Form.Group>
            <Form.Group as={Row} className="pb-4">
              <Form.Label column sm={2}>
                Tokens
              </Form.Label>
              <Col sm={10}>
                <Form.Check
                  checked={!showTokensInput}
                  className={styles.newDelegationFormToggle}
                  type="radio"
                  label="All"
                  name="tokenIdRadio"
                  onChange={() => setShowTokensInput(false)}
                />
                &nbsp;&nbsp;
                <Form.Check
                  checked={showTokensInput}
                  className={styles.newDelegationFormToggle}
                  type="radio"
                  label="Select Token ID"
                  disabled={
                    newDelegationUseCase == 16 || newDelegationUseCase == 99
                  }
                  name="tokenIdRadio"
                  onChange={() => setShowTokensInput(true)}
                />
                {showTokensInput && (
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
                              setNewDelegationToken(intValue);
                            } catch {
                              setNewDelegationToken(undefined);
                            }
                          }}
                        />
                      </Col>
                    </Row>
                  </Container>
                )}
              </Col>
            </Form.Group>
            <Form.Group as={Row} className="pt-2 pb-4">
              <Form.Label column sm={2}></Form.Label>
              <Col sm={10} className="d-flex align-items-center">
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
                {props.showCancel && (
                  <span
                    className={styles.newDelegationCancelBtn}
                    onClick={() => props.onHide()}>
                    Cancel
                  </span>
                )}
              </Col>
            </Form.Group>
            {(errors.length > 0 || gasError) && (
              <Form.Group
                as={Row}
                className={`pt-2 pb-2 ${styles.newDelegationError}`}>
                <Form.Label column sm={2}>
                  Errors
                </Form.Label>
                <Col sm={10} className="d-flex align-items-center">
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
