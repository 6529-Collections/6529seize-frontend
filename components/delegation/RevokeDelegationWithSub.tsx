import styles from "./Delegation.module.scss";
import { Container, Row, Col, Form } from "react-bootstrap";
import { useContractWrite, useEnsName, usePrepareContractWrite } from "wagmi";
import { useState } from "react";

import {
  DelegationCollection,
  SUPPORTED_COLLECTIONS,
  ALL_USE_CASES,
} from "../../pages/delegation/[...section]";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Tippy from "@tippyjs/react";
import { DELEGATION_ALL_ADDRESS, DELEGATION_CONTRACT } from "../../constants";
import { DELEGATION_ABI } from "../../abis";
import { areEqualAddresses, isValidEthAddress } from "../../helpers/Helpers";
import {
  DelegationAddressInput,
  DelegationFormLabel,
  DelegationSubmitGroups,
  getGasError,
} from "./delegation_shared";

interface Props {
  address: string;
  ens: string | null | undefined;
  originalDelegator: string;
  collection: DelegationCollection;
  showAddMore: boolean;
  onHide(): any;
  onSetToast(toast: any): any;
}

export default function RevokeDelegationWithSubComponent(
  props: Readonly<Props>
) {
  const [newDelegationCollection, setNewDelegationCollection] =
    useState<string>("0");
  const [newDelegationUseCase, setNewDelegationUseCase] = useState<number>(0);
  const [newDelegationUseCaseDisplay, setNewDelegationUseCaseDisplay] =
    useState("");

  const [newDelegationToAddress, setNewDelegationToAddress] = useState("");

  const orignalDelegatorEnsResolution = useEnsName({
    address: props.originalDelegator as `0x${string}`,
    chainId: 1,
  });

  const [gasError, setGasError] = useState<string>();

  const contractWriteDelegationConfig = usePrepareContractWrite({
    address: DELEGATION_CONTRACT.contract,
    abi: DELEGATION_ABI,
    chainId: DELEGATION_CONTRACT.chain_id,
    args: [
      props.originalDelegator,
      newDelegationCollection,
      newDelegationToAddress,
      newDelegationUseCase,
    ],
    functionName:
      validate().length === 0
        ? "revokeDelegationAddressUsingSubdelegation"
        : undefined,
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

  function clearErrors() {
    setGasError(undefined);
  }

  function validate() {
    const newErrors: string[] = [];
    if (!props.originalDelegator || props.originalDelegator === "") {
      newErrors.push("Missing or invalid Original Delegator");
    }
    if (!newDelegationCollection || newDelegationCollection === "0") {
      newErrors.push("Missing or invalid Collection");
    }
    if (!newDelegationUseCase) {
      newErrors.push("Missing or invalid Use Case");
    }
    if (!newDelegationToAddress || !isValidEthAddress(newDelegationToAddress)) {
      newErrors.push("Missing or invalid Address");
    }

    return newErrors;
  }

  return (
    <Container className="no-padding">
      <Row className="pt-2">
        <Col xs={10} className="pt-3 pb-1">
          <h4>Revoke as Delegation Manager</h4>
        </Col>
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
      </Row>
      <Row className="pt-4">
        <Col>
          <Form>
            <Form.Group as={Row} className="pb-4">
              <DelegationFormLabel
                title="Original Delegator"
                tooltip="Original Delegator of Sub Delegation - The address the delegation will be revoked for"
              />
              <Col sm={9}>
                <Form.Control
                  className={`${styles.formInput} ${styles.formInputDisabled}`}
                  type="text"
                  value={
                    orignalDelegatorEnsResolution.data
                      ? `${orignalDelegatorEnsResolution.data} - ${props.originalDelegator}`
                      : `${props.originalDelegator}`
                  }
                  disabled
                />
              </Col>
            </Form.Group>
            <Form.Group as={Row} className="pb-4">
              <DelegationFormLabel
                title="Delegation Manager"
                tooltip="Address executing the revocation"
              />
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
              <DelegationFormLabel
                title="Collection"
                tooltip="Collection address for delegation"
              />
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
                  {!props ||
                  areEqualAddresses(
                    props.collection.contract,
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
                      value={props.collection.contract}>
                      {`${props.collection.display}`}
                    </option>
                  )}
                </Form.Select>
              </Col>
            </Form.Group>
            <Form.Group as={Row} className="pb-4">
              <DelegationFormLabel
                title="Revoke Address"
                tooltip="Revoke wallet Address"
              />
              <Col sm={9}>
                <DelegationAddressInput
                  setAddress={(address: string) => {
                    setNewDelegationToAddress(address);
                    clearErrors();
                  }}
                />
              </Col>
            </Form.Group>
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
                    const i = parseInt(e.target.value);
                    const display = ALL_USE_CASES.find((u) => u.use_case === i);
                    setNewDelegationUseCase(i);
                    setNewDelegationUseCaseDisplay(
                      display ? display.display : ""
                    );
                    clearErrors();
                  }}>
                  <option value={0} disabled>
                    Select Use Case
                  </option>
                  {ALL_USE_CASES.map((uc) => (
                    <option
                      key={`revoke-delegation-select-use-case-${uc.use_case}`}
                      value={uc.use_case}>
                      #{uc.use_case} - {uc.display}
                    </option>
                  ))}
                </Form.Select>
              </Col>
            </Form.Group>
            <DelegationSubmitGroups
              title={`Revoking #${newDelegationUseCase} - ${newDelegationUseCaseDisplay} as Delegation Manager`}
              config={contractWriteDelegationConfig.config}
              showCancel={true}
              gasError={gasError}
              validate={validate}
              onHide={props.onHide}
              onSetToast={props.onSetToast}
              submitBtnLabel={"Revoke"}
            />
          </Form>
        </Col>
      </Row>
    </Container>
  );
}
