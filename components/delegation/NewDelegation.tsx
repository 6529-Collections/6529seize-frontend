"use client";

import { useState } from "react";
import { Col, Container, Form, Row } from "react-bootstrap";
import styles from "./Delegation.module.scss";

import { DELEGATION_ABI } from "@/abis";
import { DELEGATION_CONTRACT, NEVER_DATE } from "@/constants";
import { isValidEthAddress } from "@/helpers/Helpers";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  DELEGATION_USE_CASES,
  DelegationCollection,
} from "./delegation-constants";
import { getGasError } from "./delegation-shared";
import {
  DelegationAddressDisabledInput,
  DelegationCloseButton,
  DelegationExpiryCalendar,
  DelegationFormCollectionFormGroup,
  DelegationFormDelegateAddressFormGroup,
  DelegationFormLabel,
  DelegationFormOriginalDelegatorFormGroup,
  DelegationSubmitGroups,
  DelegationTokenSelection,
} from "./DelegationFormParts";

interface Props {
  address: string;
  subdelegation?: {
    originalDelegator: string;
    collection: DelegationCollection;
  };
  ens: string | null | undefined;
  collection_query?: string;
  setCollectionQuery?(collection: string): any;
  use_case_query?: number;
  setUseCaseQuery?(useCase: number): any;
  onHide(): any;
  onSetToast(toast: any): any;
}

export default function NewDelegationComponent(props: Readonly<Props>) {
  const [showExpiryCalendar, setShowExpiryCalendar] = useState(false);
  const [showTokensInput, setShowTokensInput] = useState(false);

  const [newDelegationDate, setNewDelegationDate] = useState<Date | undefined>(
    undefined
  );
  const [newDelegationToken, setNewDelegationToken] = useState<
    number | undefined
  >(undefined);
  const [newDelegationUseCase, setNewDelegationUseCase] = useState<number>(
    props.use_case_query ?? 0
  );
  const [newDelegationCollection, setNewDelegationCollection] =
    useState<string>(props.collection_query ?? "0");

  const [newDelegationToAddress, setNewDelegationToAddress] = useState("");

  const [gasError, setGasError] = useState<string>();

  const contractWriteDelegationConfigParams = props.subdelegation
    ? {
        address: DELEGATION_CONTRACT.contract,
        abi: DELEGATION_ABI,
        chainId: DELEGATION_CONTRACT.chain_id,
        args: [
          props.subdelegation.originalDelegator,
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
          validate().length === 0
            ? "registerDelegationAddressUsingSubDelegation"
            : undefined,
        onSettled(data: any, error: any) {
          if (data) {
            setGasError(undefined);
          }
          if (error) {
            setGasError(getGasError(error));
          }
        },
      }
    : {
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
          validate().length === 0 ? "registerDelegationAddress" : undefined,
        onSettled(data: any, error: any) {
          if (data) {
            setGasError(undefined);
          }
          if (error) {
            setGasError(getGasError(error));
          }
        },
      };

  function clearErrors() {
    setGasError(undefined);
  }

  function validate() {
    const newErrors: string[] = [];
    if (!newDelegationCollection || newDelegationCollection === "0") {
      newErrors.push("Missing or invalid Collection");
    }
    if (!newDelegationUseCase) {
      newErrors.push("Missing or invalid Use Case");
    }
    if (!newDelegationToAddress || !isValidEthAddress(newDelegationToAddress)) {
      newErrors.push("Missing or invalid Address");
    } else if (
      (props.subdelegation &&
        newDelegationToAddress?.toUpperCase() ==
          props.subdelegation.originalDelegator?.toUpperCase()) ||
      (!props.subdelegation &&
        newDelegationToAddress?.toUpperCase() === props.address?.toUpperCase())
    ) {
      newErrors.push("Invalid Address - cannot delegate to your own wallet");
    }
    if (showExpiryCalendar && !newDelegationDate) {
      newErrors.push("Missing or invalid Expiry");
    }
    if (showTokensInput && !newDelegationToken) {
      newErrors.push("Missing or invalid Token ID");
    }

    return newErrors;
  }

  return (
    <Container>
      <Row>
        <Col xs={10} className="pt-3 pb-1">
          <h4>
            Register Delegation {props.subdelegation && `as Delegation Manager`}
          </h4>
        </Col>
        <Col
          xs={2}
          className="pt-3 pb-1 d-flex align-items-center justify-content-end">
          <DelegationCloseButton onHide={props.onHide} title="Delegation" />
        </Col>
      </Row>
      <Row className="pt-4">
        <Col>
          <Form>
            {props.subdelegation && (
              <DelegationFormOriginalDelegatorFormGroup
                subdelegation={props.subdelegation}
              />
            )}
            <Form.Group as={Row} className="pb-4">
              <DelegationFormLabel
                title={props.subdelegation ? "Delegation Manager" : "Delegator"}
                tooltip={`Address ${
                  props.subdelegation ? `executing` : `registering`
                } the delegation`}
              />
              <Col sm={9}>
                <DelegationAddressDisabledInput
                  address={props.address}
                  ens={props.ens}
                />
              </Col>
            </Form.Group>
            <DelegationFormCollectionFormGroup
              collection={newDelegationCollection}
              setCollection={(c: string) => {
                setNewDelegationCollection(c);
                if (props.setCollectionQuery) {
                  props.setCollectionQuery(c);
                }
              }}
              subdelegation={props.subdelegation}
            />
            <DelegationFormDelegateAddressFormGroup
              setAddress={setNewDelegationToAddress}
              title="Delegate Address"
              tooltip="Delegate to Address e.g. your hot wallet"
            />
            <Form.Group as={Row} className="pb-4">
              <DelegationFormLabel
                title="Use Case"
                tooltip="Delegation Use Case"
              />
              <Col sm={9}>
                <Form.Select
                  className={`${styles.formInput}`}
                  value={newDelegationUseCase}
                  onChange={(e) => {
                    const newCase = parseInt(e.target.value);
                    setNewDelegationUseCase(newCase);
                    if (props.setUseCaseQuery) {
                      props.setUseCaseQuery(newCase);
                    }
                    clearErrors();
                  }}>
                  <option value={0} disabled>
                    Select Use Case
                  </option>
                  {DELEGATION_USE_CASES.map((uc) => {
                    return (
                      <option
                        key={`add-delegation-select-use-case-${uc.use_case}`}
                        value={uc.use_case}>
                        #{uc.use_case} - {uc.display}
                      </option>
                    );
                  })}
                </Form.Select>
              </Col>
            </Form.Group>
            <Form.Group as={Row} className="pb-4">
              <DelegationFormLabel
                title="Expiry Date"
                tooltip="Expiry date for delegation (optional)"
              />
              <Col sm={9}>
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
                  name="expiryRadio"
                  onChange={() => setShowExpiryCalendar(true)}
                />
                {showExpiryCalendar && (
                  <DelegationExpiryCalendar
                    setDelegationDate={setNewDelegationDate}
                  />
                )}
              </Col>
            </Form.Group>
            <Form.Group as={Row} className="pb-4">
              <DelegationFormLabel
                title="Tokens"
                tooltip="Tokens involved in the delegation (optional)"
              />
              <Col sm={9}>
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
                  label="Select Token ID"
                  name="tokenIdRadio"
                  onChange={() => setShowTokensInput(true)}
                />
                {showTokensInput && (
                  <DelegationTokenSelection
                    setDelegationToken={setNewDelegationToken}
                  />
                )}
              </Col>
            </Form.Group>
            <Form.Group as={Row} className="pb-4">
              <Form.Label column sm={12} className="d-flex align-items-center">
                Note: The currently supported use cases on 6529.io are: #1 -
                All, #2 - Minting/Allowlist, #3 - Airdrops{" "}
                <a
                  href={`/delegation/delegation-faq/use-cases-overview`}
                  target="_blank"
                  rel="noopener noreferrer">
                  <FontAwesomeIcon
                    className={styles.infoIconLink}
                    icon={faInfoCircle}></FontAwesomeIcon>
                </a>
              </Form.Label>
            </Form.Group>
            <DelegationSubmitGroups
              title={"Registering Delegation"}
              writeParams={contractWriteDelegationConfigParams}
              showCancel={true}
              gasError={gasError}
              validate={validate}
              onHide={props.onHide}
              onSetToast={props.onSetToast}
            />
          </Form>
        </Col>
      </Row>
    </Container>
  );
}
