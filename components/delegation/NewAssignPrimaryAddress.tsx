"use client";

import { useContext, useEffect, useState } from "react";

import { DELEGATION_ABI } from "@/abis/abis";
import { AuthContext } from "@/components/auth/Auth";
import DotLoader from "@/components/dotLoader/DotLoader";
import {
  DELEGATION_ALL_ADDRESS,
  DELEGATION_CONTRACT,
  NEVER_DATE,
} from "@/constants/constants";
import { areEqualAddresses, isValidEthAddress } from "@/helpers/Helpers";
import { commonApiFetch } from "@/services/api/common-api";
import { useQuery } from "@tanstack/react-query";
import type { DelegationCollection } from "./delegation-constants";
import { PRIMARY_ADDRESS_USE_CASE } from "./delegation-constants";
import { getGasError } from "./delegation-shared";
import {
  DelegationAddressDisabledInput,
  DelegationCloseButton,
  DelegationFormField,
  DelegationFormLabel,
  DelegationFormOptionsFormGroup,
  DelegationFormOriginalDelegatorFormGroup,
  DelegationFormRow,
  DelegationSubmitGroups,
} from "./DelegationFormParts";

interface Props {
  address: string;
  subdelegation?:
    | {
        originalDelegator: string;
        collection: DelegationCollection;
      }
    | undefined;
  ens: string | null | undefined;
  onHide(): any;
  new_primary_address_query?: string | undefined;
  setNewPrimaryAddressQuery?(query: string): any;
  onSetToast(toast: any): any;
}

export default function NewAssignPrimaryAddress(props: Readonly<Props>) {
  const {
    address,
    subdelegation,
    ens,
    onHide,
    new_primary_address_query: newPrimaryAddressQuery,
    setNewPrimaryAddressQuery,
    onSetToast,
  } = props;
  const { connectedProfile } = useContext(AuthContext);

  const [selectedToAddress, setSelectedToAddress] = useState<string>("");
  const [addressOptions, setAddressOptions] = useState<string[]>([]);

  const [gasError, setGasError] = useState<string>();

  const contractWriteDelegationConfigParams = subdelegation
    ? {
        address: DELEGATION_CONTRACT.contract,
        abi: DELEGATION_ABI,
        chainId: DELEGATION_CONTRACT.chain_id,
        args: [
          subdelegation.originalDelegator,
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
      (subdelegation &&
        areEqualAddresses(
          selectedToAddress,
          subdelegation.originalDelegator
        )) ||
      (!subdelegation && areEqualAddresses(selectedToAddress, address))
    ) {
      newErrors.push("Invalid Address - cannot delegate to your own wallet");
    }

    return newErrors;
  }

  const { isFetching: isFetchingTdhAddress, data: tdhAddress } = useQuery({
    queryKey: [
      "primary-address",
      connectedProfile?.primary_wallet,
      subdelegation?.originalDelegator,
    ],
    queryFn: async () => {
      const addressPath =
        subdelegation?.originalDelegator ?? connectedProfile?.primary_wallet;
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
        newPrimaryAddressQuery &&
        addresses.some((candidate) =>
          areEqualAddresses(candidate, newPrimaryAddressQuery)
        )
      ) {
        setSelectedToAddress(newPrimaryAddressQuery);
      } else {
        const newTo = addresses.length === 1 ? addresses[0] : "";
        setSelectedToAddress(newTo!);
        setNewPrimaryAddressQuery?.(newTo!);
      }
    }
  }, [tdhAddress, newPrimaryAddressQuery, setNewPrimaryAddressQuery]);

  function printForm() {
    return (
      <div className="-tw-mx-3 tw-flex tw-flex-wrap tw-pt-4">
        <div className="tw-w-full tw-px-3">
          <form>
            {subdelegation && (
              <DelegationFormOriginalDelegatorFormGroup
                subdelegation={subdelegation}
              />
            )}
            <DelegationFormRow>
              <DelegationFormLabel
                title={subdelegation ? `Delegation Manager` : `Delegator`}
                tooltip={`Address ${
                  subdelegation ? `executing` : `registering`
                } the Primary Address assignment`}
              />
              <DelegationFormField>
                <DelegationAddressDisabledInput
                  address={address}
                  ens={ens}
                  label={subdelegation ? "Delegation Manager" : "Delegator"}
                />
              </DelegationFormField>
            </DelegationFormRow>
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
              onHide={onHide}
              onSetToast={onSetToast}
              submitBtnLabel="Assign Primary Address"
            />
          </form>
        </div>
      </div>
    );
  }

  function isValidConsolidation() {
    if (!tdhAddress) return false;
    return tdhAddress.consolidation_key.split("-").length > 1;
  }

  function printContent() {
    if (!connectedProfile) return null;
    if (isFetchingTdhAddress) {
      return <DotLoader />;
    } else if (!isValidConsolidation()) {
      return (
        <div className="-tw-mx-3 tw-flex tw-flex-wrap">
          <div className="font-larger font-bolder tw-w-full tw-px-3">
            You must have a consolidation to assign a Primary Address
          </div>
        </div>
      );
    } else {
      return printForm();
    }
  }

  return (
    <div className="tw-w-full tw-px-3">
      <div className="-tw-mx-3 tw-flex tw-flex-wrap tw-pb-3">
        <div className="tw-w-10/12 tw-px-3 tw-pb-1 tw-pt-3">
          <h4>
            Assign Primary Address {subdelegation && `as Delegation Manager`}
          </h4>
        </div>
        <div className="tw-flex tw-w-2/12 tw-items-center tw-justify-end tw-px-3 tw-pb-1 tw-pt-3">
          <DelegationCloseButton onHide={onHide} title="Consolidation" />
        </div>
      </div>
      {!connectedProfile && (
        <div className="-tw-mx-3 tw-flex tw-flex-wrap">
          <div className="font-larger font-bolder tw-flex tw-w-full tw-items-center tw-justify-center tw-px-3">
            Connect Wallet to continue
          </div>
        </div>
      )}
      {printContent()}
    </div>
  );
}
