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
import type { DelegationToastState } from "./DelegationToast";
import {
  DelegationAddressDisabledInput,
  DelegationFormField,
  DelegationFormLabel,
  DelegationFormOptionsFormGroup,
  DelegationFormOriginalDelegatorFormGroup,
  DelegationFormRow,
  DelegationFormShell,
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
  onHide(): void;
  new_primary_address_query?: string | undefined;
  setNewPrimaryAddressQuery?(query: string): void;
  onSetToast(toast: DelegationToastState): void;
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
        onSettled(data: unknown, error: Error | null) {
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
        onSettled(data: unknown, error: Error | null) {
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
    );
  }

  function isValidConsolidation() {
    if (!tdhAddress) return false;
    return tdhAddress.consolidation_key.split("-").length > 1;
  }

  function printContent() {
    if (!connectedProfile) return null;
    if (isFetchingTdhAddress) {
      return (
        <div className="tw-flex tw-min-h-24 tw-items-center tw-justify-center">
          <DotLoader />
        </div>
      );
    } else if (!isValidConsolidation()) {
      return (
        <div className="tw-rounded-lg tw-border tw-border-solid tw-border-amber-400/40 tw-bg-amber-400/10 tw-p-4 tw-text-base tw-font-semibold tw-text-amber-200">
          You must have a consolidation to assign a Primary Address
        </div>
      );
    } else {
      return printForm();
    }
  }

  return (
    <DelegationFormShell
      title={`Assign Primary Address${
        subdelegation ? " as Delegation Manager" : ""
      }`}
      description="Choose the primary wallet used for TDH within an existing consolidation."
      closeTitle="Primary Address"
      onHide={onHide}
    >
      {!connectedProfile && (
        <div className="tw-rounded-lg tw-bg-iron-950 tw-p-4 tw-text-base tw-font-semibold tw-text-white">
          Connect Wallet to continue
        </div>
      )}
      {printContent()}
    </DelegationFormShell>
  );
}
