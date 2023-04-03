import styles from "./Delegation.module.scss";
import { Container, Row, Col, Form } from "react-bootstrap";
import {
  useContractWrite,
  usePrepareContractWrite,
  useWaitForTransaction,
} from "wagmi";
import { useEffect, useState } from "react";

import { DelegationCollection } from "../../pages/delegations/[contract]";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Tippy from "@tippyjs/react";
import {
  DELEGATION_ALL_ADDRESS,
  DELEGATION_CONTRACT,
  NEVER_DATE,
} from "../../constants";
import { DELEGATION_ABI } from "../../abis";
import { getTransactionLink, isValidEthAddress } from "../../helpers/Helpers";

interface Props {
  address: string;
  delegation: { wallet: string; use_case: number; display: string };
  ens: string | null | undefined;
  collection: DelegationCollection;
  showCancel: boolean;
  showAddMore: boolean;
  onHide(): any;
}

export default function NewDelegationComponent(props: Props) {
  const [showExpiryCalendar, setShowExpiryCalendar] = useState(false);
  const [showTokensInput, setShowTokensInput] = useState(false);

  const [delegationDate, setDelegationDate] = useState<Date | undefined>(
    undefined
  );
  const [delegationToken, setDelegationToken] = useState<number | undefined>(
    undefined
  );

  const [delegationToAddress, setDelegationToAddress] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  const contractWriteDelegationConfig = usePrepareContractWrite({
    address: DELEGATION_CONTRACT.contract,
    abi: DELEGATION_ABI,
    chainId: DELEGATION_CONTRACT.chain_id,
    args: [
      props.collection.contract == "all"
        ? DELEGATION_ALL_ADDRESS
        : props.collection.contract,
      props.delegation.wallet,
      delegationToAddress,
      showExpiryCalendar && delegationDate
        ? delegationDate.getTime() / 1000
        : NEVER_DATE,
      props.delegation.use_case,
      showTokensInput ? false : true,
      showTokensInput ? delegationToken : 0,
    ],
    functionName:
      validate().length == 0 ? "updateDelegationAddress" : undefined,
    onError: (e) => {},
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
    if (!delegationToAddress || !isValidEthAddress(delegationToAddress)) {
      newErrors.push("Missing or invalid New Address");
    }
    if (showExpiryCalendar && !delegationDate) {
      newErrors.push("Missing or invalid Expiry");
    }
    if (showTokensInput && !delegationToken) {
      newErrors.push("Missing or invalid Token ID");
    }

    return newErrors;
  }

  function clearForm() {
    setErrors([]);
    setShowExpiryCalendar(false);
    setShowTokensInput(false);
    setDelegationDate(undefined);
    setDelegationToken(undefined);
  }

  function submitDelegation() {
    const newErrors = validate();
    if (newErrors.length > 0) {
      setErrors(newErrors);
      window.scrollBy(0, 100);
    } else {
      contractWriteDelegation.write?.();
    }
  }

  useEffect(() => {
    if (contractWriteDelegation.error) {
      setErrors((err) => [...err, contractWriteDelegation.error!.message]);
      window.scrollBy(0, 100);
    }
  }, [contractWriteDelegation.error]);

  return (
    <Container className="no-padding">
      <Row>
        <Col xs={10} className="pt-3 pb-3">
          <h4>Update Delegation</h4>
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
                  defaultValue={
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
                <Form.Control
                  className={`${styles.formInput} ${styles.formInputDisabled}`}
                  type="text"
                  defaultValue={`${props.collection.display}${
                    props.collection.contract == "all"
                      ? ""
                      : `- ${props.collection.contract}`
                  }`}
                  disabled
                />
              </Col>
            </Form.Group>
            <Form.Group as={Row} className="pb-4">
              <Form.Label column sm={2}>
                Previous Address
              </Form.Label>
              <Col sm={10}>
                <Form.Control
                  placeholder="Delegate to"
                  className={`${styles.formInput}`}
                  type="text"
                  value={props.delegation.wallet}
                  disabled
                />
              </Col>
            </Form.Group>
            <Form.Group as={Row} className="pb-4">
              <Form.Label column sm={2}>
                New Address
              </Form.Label>
              <Col sm={10}>
                <Form.Control
                  placeholder="Delegate to"
                  className={`${styles.formInput}`}
                  type="text"
                  value={delegationToAddress}
                  onChange={(e) => setDelegationToAddress(e.target.value)}
                />
              </Col>
            </Form.Group>
            <Form.Group as={Row} className="pb-4">
              <Form.Label column sm={2}>
                Use Case
              </Form.Label>
              <Col sm={10}>
                <Form.Control
                  className={`${styles.formInput} ${styles.formInputDisabled}`}
                  type="text"
                  defaultValue={`#${props.delegation.use_case} - ${props.delegation.display}`}
                  disabled
                />
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
                  label="Select Date"
                  disabled={
                    props.delegation.use_case == 16 ||
                    props.delegation.use_case == 99
                  }
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
                              setDelegationDate(new Date(value));
                            } else {
                              setDelegationDate(undefined);
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
                  disabled={
                    props.delegation.use_case == 16 ||
                    props.delegation.use_case == 99
                  }
                  label="Select Token ID"
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
                              setDelegationToken(intValue);
                            } catch {
                              setDelegationToken(undefined);
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
            {errors.length > 0 && (
              <Form.Group
                as={Row}
                className={`pt-2 pb-2 ${styles.newDelegationError}`}>
                <Form.Label column sm={2}>
                  Errors
                </Form.Label>
                <Col sm={10}>
                  <ul>
                    {errors.map((e, index) => (
                      <li key={`new-delegation-error-${index}`}>{e}</li>
                    ))}
                  </ul>
                </Col>
              </Form.Group>
            )}
            {contractWriteDelegation.data && (
              <Form.Group
                as={Row}
                className={`pt-2 pb-2 ${styles.newDelegationRedultsList} ${
                  waitContractWriteDelegation.data &&
                  waitContractWriteDelegation.data.status
                    ? styles.newDelegationSuccess
                    : waitContractWriteDelegation.data &&
                      !waitContractWriteDelegation.data.status
                    ? styles.newDelegationError
                    : ``
                }`}>
                <Form.Label
                  column
                  sm={2}
                  className={`${styles.newDelegationRedultsList} ${
                    waitContractWriteDelegation.data &&
                    waitContractWriteDelegation.data.status
                      ? styles.newDelegationSuccess
                      : waitContractWriteDelegation.data &&
                        !waitContractWriteDelegation.data.status
                      ? styles.newDelegationError
                      : ``
                  }`}>
                  Status
                </Form.Label>
                <Col sm={10}>
                  <ul>
                    <li
                      className={`${styles.newDelegationRedultsList} ${
                        waitContractWriteDelegation.data &&
                        waitContractWriteDelegation.data.status
                          ? styles.newDelegationSuccess
                          : waitContractWriteDelegation.data &&
                            !waitContractWriteDelegation.data.status
                          ? styles.newDelegationError
                          : ``
                      }`}>
                      {waitContractWriteDelegation.isLoading
                        ? `Transaction Submitted...`
                        : waitContractWriteDelegation.data?.status
                        ? `Transaction Successful!`
                        : `Transaction Failed`}
                    </li>
                    {waitContractWriteDelegation.isLoading && (
                      <li>Waiting for confirmation...</li>
                    )}
                  </ul>
                  <a
                    href={getTransactionLink(
                      DELEGATION_CONTRACT.chain_id,
                      contractWriteDelegation.data.hash
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.etherscanLink}>
                    view txn
                  </a>
                </Col>
              </Form.Group>
            )}
          </Form>
        </Col>
      </Row>
    </Container>
  );
}
