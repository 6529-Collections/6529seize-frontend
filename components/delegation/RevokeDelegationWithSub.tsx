import styles from "./Delegation.module.scss";
import { Container, Row, Col, Form } from "react-bootstrap";
import {
  useContractWrite,
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
import { DELEGATION_ALL_ADDRESS, DELEGATION_CONTRACT } from "../../constants";
import { DELEGATION_ABI } from "../../abis";
import { getTransactionLink, isValidEthAddress } from "../../helpers/Helpers";

interface Props {
  address: string;
  ens: string | null | undefined;
  incomingDelegations: string[];
  collection: DelegationCollection;
  showCancel: boolean;
  showAddMore: boolean;
  onHide(): any;
}

export default function RevokeDelegationWithSubComponent(props: Props) {
  const [newDelegationCollection, setNewDelegationCollection] =
    useState<string>(props.collection ? props.collection.contract : "0");
  const [newDelegationUseCase, setNewDelegationUseCase] = useState<number>(0);
  const [newDelegationToAddress, setNewDelegationToAddress] = useState("");
  const [newDelegationOriginalDelegator, setNewDelegationOriginalDelegator] =
    useState(
      props.incomingDelegations.length == 1 ? props.incomingDelegations[0] : ""
    );
  const [errors, setErrors] = useState<string[]>([]);

  const contractWriteDelegationConfig = usePrepareContractWrite({
    address: DELEGATION_CONTRACT.contract,
    abi: DELEGATION_ABI,
    chainId: DELEGATION_CONTRACT.chain_id,
    args: [
      newDelegationOriginalDelegator,
      newDelegationCollection == "all"
        ? DELEGATION_ALL_ADDRESS
        : newDelegationCollection,
      newDelegationToAddress,
      newDelegationUseCase,
    ],
    functionName:
      validate().length == 0
        ? "revokeDelegationAddressUsingSubdelegation"
        : undefined,
    onError: (e) => {
      setErrors(["CANNOT ESTIMATE GAS"]);
      window.scrollBy(0, 100);
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
    if (
      !newDelegationOriginalDelegator ||
      newDelegationOriginalDelegator == ""
    ) {
      newErrors.push("Missing or invalid Original Delegator");
    }
    if (!newDelegationUseCase) {
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
          <h4>Revoke Delegation With Sub-Delegation Rights</h4>
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
                Original Delegator
              </Form.Label>
              <Col sm={10}>
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
                  {props.incomingDelegations.map((id) => (
                    <option
                      key={`add-delegation-select-delegator-${id}`}
                      value={id}>
                      {id}
                    </option>
                  ))}
                </Form.Select>
              </Col>
            </Form.Group>
            <Form.Group as={Row} className="pb-4">
              <Form.Label column sm={2}>
                Collection
              </Form.Label>
              <Col sm={10}>
                {props.collection.contract == "all" ? (
                  <Form.Select
                    className={`${styles.formInput}`}
                    value={newDelegationCollection}
                    onChange={(e) =>
                      setNewDelegationCollection(e.target.value)
                    }>
                    <option value="0" disabled>
                      Select Collection
                    </option>
                    {SUPPORTED_COLLECTIONS.map((sc) => (
                      <option
                        key={`add-delegation-select-collection-${sc.contract}`}
                        value={sc.contract}>
                        {`${sc.display}${
                          sc.contract == "all" ? "" : `- ${sc.contract}`
                        }`}
                      </option>
                    ))}
                  </Form.Select>
                ) : (
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
                )}
              </Col>
            </Form.Group>
            <Form.Group as={Row} className="pb-4">
              <Form.Label column sm={2}>
                Address
              </Form.Label>
              <Col sm={10}>
                <Form.Control
                  placeholder="Deligation Address"
                  className={`${styles.formInput}`}
                  type="text"
                  value={newDelegationToAddress}
                  onChange={(e) => setNewDelegationToAddress(e.target.value)}
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
                  onChange={(e) =>
                    setNewDelegationUseCase(parseInt(e.target.value))
                  }>
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
            <Form.Group as={Row} className="pt-2 pb-4">
              <Form.Label column sm={2}></Form.Label>
              <Col sm={10} className="d-flex align-items-center">
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
                  <ul className="mb-0">
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
                  <ul className="mb-0">
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
