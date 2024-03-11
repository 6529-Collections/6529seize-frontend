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
  SUB_DELEGATION_USE_CASE,
} from "../../pages/delegation/[...section]";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Tippy from "@tippyjs/react";
import { DELEGATION_CONTRACT, NEVER_DATE } from "../../constants";
import { DELEGATION_ABI } from "../../abis";
import { getTransactionLink, isValidEthAddress } from "../../helpers/Helpers";
import {
  DelegationFormLabel,
  DelegationSubmitGroups,
  DelegationWaitContractWrite,
  NewDelegationButtons,
  getGasError,
} from "./delegation_shared";

interface Props {
  address: string;
  delegation: { wallet: string; use_case: number; display: string };
  ens: string | null | undefined;
  collection: DelegationCollection;
  showCancel: boolean;
  showAddMore: boolean;
  onHide(): any;
  onSetToast(toast: any): any;
}

export default function UpdateDelegationComponent(props: Readonly<Props>) {
  const [isDelegation, setIsDelegation] = useState(
    ![
      CONSOLIDATION_USE_CASE.use_case,
      SUB_DELEGATION_USE_CASE.use_case,
    ].includes(props.delegation.use_case)
  );
  const [showExpiryCalendar, setShowExpiryCalendar] = useState(false);
  const [showTokensInput, setShowTokensInput] = useState(false);

  const [delegationDate, setDelegationDate] = useState<Date | undefined>(
    undefined
  );
  const [delegationToken, setDelegationToken] = useState<number | undefined>(
    undefined
  );

  const [delegationToInput, setDelegationToInput] = useState("");
  const [delegationToAddress, setDelegationToAddress] = useState("");

  const [errors, setErrors] = useState<string[]>([]);
  const [gasError, setGasError] = useState<string>();

  const [isWaitLoading, setIsWaitLoading] = useState(false);

  const previousDelegationEns = useEnsName({
    address: props.delegation.wallet as `0x${string}`,
    chainId: 1,
  });

  const newDelegationToAddressEns = useEnsName({
    address:
      delegationToInput && delegationToInput.startsWith("0x")
        ? (delegationToInput as `0x${string}`)
        : undefined,
    chainId: 1,
  });

  useEffect(() => {
    if (newDelegationToAddressEns.data) {
      setDelegationToAddress(delegationToInput);
      setDelegationToInput(
        `${newDelegationToAddressEns.data} - ${delegationToInput}`
      );
    }
  }, [newDelegationToAddressEns.data]);

  const newDelegationToAddressFromEns = useEnsAddress({
    name:
      delegationToInput && delegationToInput.endsWith(".eth")
        ? delegationToInput
        : undefined,
    chainId: 1,
  });

  useEffect(() => {
    if (newDelegationToAddressFromEns.data) {
      setDelegationToAddress(newDelegationToAddressFromEns.data);
      setDelegationToInput(
        `${delegationToInput} - ${newDelegationToAddressFromEns.data}`
      );
    }
  }, [newDelegationToAddressFromEns.data]);

  const contractWriteDelegationConfig = usePrepareContractWrite({
    address: DELEGATION_CONTRACT.contract,
    abi: DELEGATION_ABI,
    chainId: DELEGATION_CONTRACT.chain_id,
    args: [
      props.collection.contract,
      props.delegation.wallet,
      delegationToAddress,
      isDelegation && showExpiryCalendar && delegationDate
        ? delegationDate.getTime() / 1000
        : NEVER_DATE,
      props.delegation.use_case,
      isDelegation && showTokensInput ? false : true,
      isDelegation && showTokensInput ? delegationToken : 0,
    ],
    functionName:
      validate().length === 0 ? "updateDelegationAddress" : undefined,
    onSettled(data, error) {
      if (data) {
        setGasError(undefined);
      }
      if (error) {
        setGasError(getGasError(error));
      }
    },
  });
  const contractWriteDelegation = useContractWrite(
    contractWriteDelegationConfig.config
  );

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
    if (newErrors.length > 0 || gasError) {
      setErrors(newErrors);
      window.scrollBy(0, 100);
    } else {
      contractWriteDelegation.write?.();
      props.onSetToast({
        title: `Updating Delegation`,
        message: "Confirm in your wallet...",
      });
    }
  }

  return (
    <Container className="no-padding">
      <Row>
        <Col xs={10} className="pt-3 pb-4">
          <h4>
            Update{" "}
            {props.delegation.use_case === CONSOLIDATION_USE_CASE.use_case
              ? "Consolidation"
              : props.delegation.use_case === SUB_DELEGATION_USE_CASE.use_case
              ? "Delegation Manager"
              : "Delegation"}
          </h4>
        </Col>
        {props.showCancel && (
          <Col xs={2} className="d-flex align-items-center justify-content-end">
            <Tippy
              content={`Cancel Update`}
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
              <DelegationFormLabel
                title="Delegator"
                tooltip="Original Delegator"
                span={4}
              />
              <Col sm={8}>
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
              <DelegationFormLabel
                title="Collection"
                tooltip="Collection address for delegation"
                span={4}
              />
              <Col sm={8}>
                <Form.Control
                  className={`${styles.formInput} ${styles.formInputDisabled}`}
                  type="text"
                  value={`${props.collection.display}`}
                  disabled
                />
              </Col>
            </Form.Group>
            {isDelegation && (
              <Form.Group as={Row} className="pb-4">
                <DelegationFormLabel
                  title="Use Case"
                  tooltip="Delegation Use Case"
                  span={4}
                />
                <Col sm={8}>
                  <Form.Control
                    className={`${styles.formInput} ${styles.formInputDisabled}`}
                    type="text"
                    value={`#${props.delegation.use_case} - ${props.delegation.display}`}
                    disabled
                  />
                </Col>
              </Form.Group>
            )}
            <Form.Group as={Row} className="pb-4">
              <DelegationFormLabel
                title="Current Delegate Address"
                tooltip="Current Delegate to Address"
                span={4}
              />
              <Col sm={8}>
                <Form.Control
                  className={`${styles.formInput} ${styles.formInputDisabled}`}
                  type="text"
                  value={
                    previousDelegationEns.data
                      ? `${previousDelegationEns.data} - ${props.delegation.wallet}`
                      : props.delegation.wallet
                  }
                  disabled
                />
              </Col>
            </Form.Group>
            <Form.Group as={Row} className="pb-4">
              <DelegationFormLabel
                title="New Delegate Address"
                tooltip="New Delegate to Address"
                span={4}
              />
              <Col sm={8}>
                <Form.Control
                  placeholder="Delegate to - 0x... or ENS"
                  className={`${styles.formInput}`}
                  type="text"
                  value={delegationToInput}
                  onChange={(e) => {
                    setDelegationToInput(e.target.value);
                    setDelegationToAddress(e.target.value);
                    setGasError(undefined);
                  }}
                />
              </Col>
            </Form.Group>
            {isDelegation && (
              <Form.Group as={Row} className="pb-4">
                <DelegationFormLabel
                  title="Expiry Date"
                  tooltip="Expiry date for delegation (optional)"
                  span={4}
                />
                <Col sm={8}>
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
                      props.delegation.use_case === 16 ||
                      props.delegation.use_case === 99
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
            )}
            {isDelegation && (
              <Form.Group as={Row} className="pb-4">
                <DelegationFormLabel
                  title="Tokens"
                  tooltip="Tokens involved in the delegation (optional)"
                  span={4}
                />
                <Col sm={8}>
                  <Form.Check
                    checked={!showTokensInput}
                    className={styles.newDelegationFormToggle}
                    type="radio"
                    label="All&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"
                    name="tokenIdRadio"
                    onChange={() => setShowTokensInput(false)}
                  />
                  &nbsp;&nbsp;
                  <Form.Check
                    checked={showTokensInput}
                    className={styles.newDelegationFormToggle}
                    type="radio"
                    disabled={
                      props.delegation.use_case === 16 ||
                      props.delegation.use_case === 99
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
            )}
            <DelegationSubmitGroups
              showCancel={props.showCancel}
              onSubmit={() => {
                setErrors([]);
                submitDelegation();
              }}
              onHide={props.onHide}
              isLoading={contractWriteDelegation.isLoading || isWaitLoading}
              errors={errors}
              gasError={gasError}
            />
          </Form>
        </Col>
      </Row>
      <DelegationWaitContractWrite
        title={"Updaing Delegation"}
        data={contractWriteDelegation.data}
        error={contractWriteDelegation.error}
        onSetToast={props.onSetToast}
        setIsWaitLoading={setIsWaitLoading}
      />
    </Container>
  );
}
