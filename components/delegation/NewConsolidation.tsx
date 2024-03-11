import styles from "./Delegation.module.scss";
import { Container, Row, Col, Form } from "react-bootstrap";
import { useContractWrite, usePrepareContractWrite } from "wagmi";
import { useState } from "react";

import {
  CONSOLIDATION_USE_CASE,
  DelegationCollection,
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
import { areEqualAddresses, isValidEthAddress } from "../../helpers/Helpers";
import {
  DelegationAddressInput,
  useOrignalDelegatorEnsResolution,
  getGasError,
  DelegationWaitContractWrite,
  DelegationFormLabel,
  NewDelegationButtons,
  DelegationSubmitGroups,
} from "./delegation_shared";

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

export default function NewConsolidationComponent(props: Readonly<Props>) {
  const orignalDelegatorEnsResolution = useOrignalDelegatorEnsResolution({
    subdelegation: props.subdelegation,
  });

  const [newDelegationCollection, setNewDelegationCollection] =
    useState<string>("0");

  const [newDelegationToAddress, setNewDelegationToAddress] = useState("");

  const [isWaitLoading, setIsWaitLoading] = useState(false);

  const [errors, setErrors] = useState<string[]>([]);
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
          NEVER_DATE,
          CONSOLIDATION_USE_CASE.use_case,
          true,
          0,
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
          NEVER_DATE,
          CONSOLIDATION_USE_CASE.use_case,
          true,
          0,
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

  const contractWriteDelegationConfig = usePrepareContractWrite(
    contractWriteDelegationConfigParams
  );

  const contractWriteDelegation = useContractWrite(
    contractWriteDelegationConfig.config
  );

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
        title: `Registering Consolidation`,
        message: "Confirm in your wallet...",
      });
    }
  }

  return (
    <Container>
      <Row>
        <Col xs={10} className="pt-3 pb-1">
          <h4>
            Register Consolidation{" "}
            {props.subdelegation && `as Delegation Manager`}
          </h4>
        </Col>
        <Col
          xs={2}
          className="pt-3 pb-1 d-flex align-items-center justify-content-end">
          <Tippy
            content={"Cancel Consolidation"}
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
            )}
            <Form.Group as={Row} className="pb-4">
              <DelegationFormLabel
                title={props.subdelegation ? `Delegation Manager` : `Delegator`}
                tooltip={`Address ${
                  props.subdelegation ? `executing` : `registering`
                } the sub-consolidation`}
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
              <DelegationFormLabel
                title="Delegate Address"
                tooltip="Consolidate with Address e.g. your hot wallet"
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
              <Form.Label column sm={12} className="d-flex align-items-center">
                Note: For TDH Consolidation use either &apos;Any
                Collection&apos; or &apos;The Memes&apos;
                <a
                  href={`/delegation/delegation-faq/register-consolidation`}
                  target="_blank"
                  rel="noreferrer">
                  <FontAwesomeIcon
                    className={styles.infoIconLink}
                    icon="info-circle"></FontAwesomeIcon>
                </a>
              </Form.Label>
            </Form.Group>
            <DelegationSubmitGroups
              showCancel={true}
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
        title={"Registering Consolidation"}
        data={contractWriteDelegation.data}
        error={contractWriteDelegation.error}
        onSetToast={props.onSetToast}
        setIsWaitLoading={setIsWaitLoading}
      />
    </Container>
  );
}
