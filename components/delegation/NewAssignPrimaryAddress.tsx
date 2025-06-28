"use client";

import { Container, Row, Col, Form } from "react-bootstrap";
import { useContext, useEffect, useState } from "react";

import {
  DelegationCollection,
  PRIMARY_ADDRESS_USE_CASE,
} from "../../pages/delegation/[...section]";
import {
  DELEGATION_ALL_ADDRESS,
  DELEGATION_CONTRACT,
  NEVER_DATE,
} from "../../constants";
import { DELEGATION_ABI } from "../../abis";
import { areEqualAddresses, isValidEthAddress } from "../../helpers/Helpers";
import { getGasError } from "./delegation_shared";
import {
  DelegationCloseButton,
  DelegationFormOriginalDelegatorFormGroup,
  DelegationFormLabel,
  DelegationAddressDisabledInput,
  DelegationSubmitGroups,
  DelegationFormOptionsFormGroup,
} from "./DelegationFormParts";
import { AuthContext } from "../auth/Auth";
import { commonApiFetch } from "../../services/api/common-api";
import { useQuery } from "@tanstack/react-query";
import DotLoader from "../dotLoader/DotLoader";

interface Props {
  address: string;
  subdelegation?: {
    originalDelegator: string;
    collection: DelegationCollection;
  };
  ens: string | null | undefined;
  onHide(): any;
  new_primary_address_query?: string;
  setNewPrimaryAddressQuery?(query: string): any;
  onSetToast(toast: any): any;
}

export default function NewAssignPrimaryAddress(props: Readonly<Props>) {
  const { connectedProfile } = useContext(AuthContext);

  const [selectedToAddress, setSelectedToAddress] = useState<string>("");
  const [addressOptions, setAddressOptions] = useState<string[]>([]);

  const [gasError, setGasError] = useState<string>();

  const contractWriteDelegationConfigParams = props.subdelegation
    ? {
        address: DELEGATION_CONTRACT.contract,
        abi: DELEGATION_ABI,
        chainId: DELEGATION_CONTRACT.chain_id,
        args: [
          props.subdelegation.originalDelegator,
          DELEGATION_ALL_ADDRESS,
          selectedToAddress,
          NEVER_DATE,
          PRIMARY_ADDRESS_USE_CASE.use_case,
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
          DELEGATION_ALL_ADDRESS,
          selectedToAddress,
          NEVER_DATE,
          PRIMARY_ADDRESS_USE_CASE.use_case,
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

  function validate() {
    const newErrors: string[] = [];
    if (!selectedToAddress || !isValidEthAddress(selectedToAddress)) {
      newErrors.push("Missing or invalid Address");
    } else if (
      (props.subdelegation &&
        selectedToAddress.toUpperCase() ==
          props.subdelegation.originalDelegator.toUpperCase()) ||
      (!props.subdelegation &&
        selectedToAddress.toUpperCase() === props.address.toUpperCase())
    ) {
      newErrors.push("Invalid Address - cannot delegate to your own wallet");
    }

    return newErrors;
  }

  const { isFetching: isFetchingTdhAddress, data: tdhAddress } = useQuery({
    queryKey: [
      "primary-address",
      connectedProfile?.primary_wallet,
      props.subdelegation?.originalDelegator,
    ],
    queryFn: async () => {
      const addressPath =
        props.subdelegation?.originalDelegator ??
        connectedProfile?.primary_wallet;
      return await commonApiFetch<{
        consolidation_key: string;
        address: string;
        ens: string;
      }>({
        endpoint: `profiles/${addressPath}/primary-address/tdh-address`,
      });
    },
    enabled: !!connectedProfile?.primary_wallet,
  });

  useEffect(() => {
    if (tdhAddress) {
      const addresses = tdhAddress.consolidation_key.split("-");
      setAddressOptions(addresses);
      if (
        props.new_primary_address_query &&
        addresses.some((f) =>
          areEqualAddresses(f, props.new_primary_address_query)
        )
      ) {
        setSelectedToAddress(props.new_primary_address_query);
      } else {
        const newTo = addresses.length === 1 ? addresses[0] : "";
        setSelectedToAddress(newTo);
        props.setNewPrimaryAddressQuery?.(newTo);
      }
    }
  }, [tdhAddress]);

  function printForm() {
    return (
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
                title={props.subdelegation ? `Delegation Manager` : `Delegator`}
                tooltip={`Address ${
                  props.subdelegation ? `executing` : `registering`
                } the Primary Address assignment`}
              />
              <Col sm={9}>
                <DelegationAddressDisabledInput
                  address={props.address}
                  ens={props.ens}
                />
              </Col>
            </Form.Group>
            <DelegationFormOptionsFormGroup
              title={"Primary Address"}
              tooltip="Address to be assigned as Primary"
              options={addressOptions}
              selected={selectedToAddress}
              setSelected={setSelectedToAddress}
            />
            <DelegationSubmitGroups
              title={"Registering Primary Address"}
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
    );
  }

  function isValidConsolidation() {
    if (!tdhAddress) return false;
    return tdhAddress.consolidation_key.split("-").length > 1;
  }

  function printContent() {
    if (connectedProfile) {
      if (isFetchingTdhAddress) {
        return <DotLoader />;
      } else if (!isValidConsolidation()) {
        return (
          <Row>
            <Col className="font-larger font-bolder">
              You must have a consolidation to assign a Primary Address
            </Col>
          </Row>
        );
      } else {
        return printForm();
      }
    }
  }

  return (
    <Container>
      <Row className="pb-3">
        <Col xs={10} className="pt-3 pb-1">
          <h4>
            Assign Primary Address{" "}
            {props.subdelegation && `as Delegation Manager`}
          </h4>
        </Col>
        <Col
          xs={2}
          className="pt-3 pb-1 d-flex align-items-center justify-content-end">
          <DelegationCloseButton onHide={props.onHide} title="Consolidation" />
        </Col>
      </Row>
      {!connectedProfile && (
        <Row>
          <Col className="d-flex align-item-center justify-content-center font-larger font-bolder">
            Connect Wallet to continue
          </Col>
        </Row>
      )}
      {printContent()}
    </Container>
  );
}

function getAssignPrimartAddressConfig(toAddress: string) {
  return {
    address: DELEGATION_CONTRACT.contract,
    abi: DELEGATION_ABI,
    chainId: DELEGATION_CONTRACT.chain_id,
    args: [
      DELEGATION_ALL_ADDRESS,
      toAddress,
      NEVER_DATE,
      PRIMARY_ADDRESS_USE_CASE.use_case,
      true,
      0,
    ],
    functionName: "registerDelegationAddress",
  };
}
