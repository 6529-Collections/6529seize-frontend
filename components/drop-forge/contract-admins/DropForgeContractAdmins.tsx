"use client";

import {
  ArrowPathIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { getAddress, type Address } from "viem";
import { useReadContract } from "wagmi";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { getConnectedActionFingerprint } from "@/components/auth/useConnectedAction";
import OnchainTransactionModal from "@/components/common/OnchainTransactionModal";
import { useDropForgeMintingConfig } from "@/components/drop-forge/drop-forge-config";
import Button from "@/components/utils/button/Button";
import EnsAddressInput from "@/components/utils/input/ens-address/EnsAddressInput";
import { useDropForgePermissions } from "@/hooks/useDropForgePermissions";
import { CREATOR_ADMIN_ABI } from "./creator-admin-abi";
import {
  getAdminAddressError,
  getCreatorAdminRows,
  getAdminValidationMessage,
} from "./contract-admins.helpers";
import {
  useContractAdminTransaction,
  type AdminOperation,
} from "./useContractAdminTransaction";

export default function DropForgeContractAdmins() {
  const { contract, chain } = useDropForgeMintingConfig();
  const { address: activeWallet } = useSeizeConnectContext();
  const { canManageContractAdmins } = useDropForgePermissions();
  const parameters = {
    address: contract as Address,
    abi: CREATOR_ADMIN_ABI,
    chainId: chain.id,
    query: { staleTime: 0, refetchInterval: 15000 },
  };
  const ownerQuery = useReadContract({ ...parameters, functionName: "owner" });
  const adminsQuery = useReadContract({
    ...parameters,
    functionName: "getAdmins",
  });
  const [input, setInput] = useState("");
  const [resolvedAddress, setResolvedAddress] = useState("");
  const [resolving, setResolving] = useState(false);
  const [ensError, setEnsError] = useState(false);
  const contextFingerprint = getConnectedActionFingerprint({
    contract,
    chainId: chain.id,
    activeWallet,
    canManageContractAdmins,
    resolvedAddress,
    owner: ownerQuery.data,
    admins: adminsQuery.data,
    ownerReadError: ownerQuery.isError,
    adminsReadError: adminsQuery.isError,
  });
  const [confirmation, setConfirmation] = useState<
    (AdminOperation & { context: string }) | null
  >(null);
  const { transaction, busy, submit, closeTransaction } =
    useContractAdminTransaction({
      contract: contract as Address,
      chain,
      canManage: canManageContractAdmins,
      contextFingerprint,
    });
  const hasReadError = ownerQuery.isError || adminsQuery.isError;
  const ready =
    !hasReadError &&
    ownerQuery.data !== undefined &&
    adminsQuery.data !== undefined;
  const admins = adminsQuery.data ?? [];
  const rows = ownerQuery.data
    ? getCreatorAdminRows(ownerQuery.data, admins)
    : [];
  const error = ensError
    ? "Unable to resolve this ENS name."
    : getAdminAddressError(resolvedAddress, ownerQuery.data, admins);
  const visibleConfirmation =
    confirmation?.context === contextFingerprint ? confirmation : null;
  const controlsDisabled = busy || !ready || !!visibleConfirmation;
  let listStatus = null;
  if (hasReadError) {
    listStatus = (
      <p role="alert" className="tw-text-red">
        Unable to load contract admins. Try refreshing.
      </p>
    );
  } else if (!ready) {
    listStatus = (
      <p role="status" className="tw-text-iron-400">
        Loading contract admins...
      </p>
    );
  }
  const refresh = () => {
    void ownerQuery.refetch();
    void adminsQuery.refetch();
  };

  return (
    <section aria-labelledby="contract-admins-heading" className="tw-mt-10">
      <div className="tw-flex tw-items-center tw-justify-between tw-gap-4">
        <h2
          id="contract-admins-heading"
          className="tw-mb-0 tw-text-xl tw-font-semibold tw-text-iron-50"
        >
          Contract Admins
        </h2>
        <Button
          variant="secondary"
          size="sm"
          aria-label="Refresh contract admins"
          title="Refresh contract admins"
          onClick={refresh}
          disabled={ownerQuery.isFetching || adminsQuery.isFetching}
        >
          <ArrowPathIcon aria-hidden="true" className="tw-size-4" />
        </Button>
      </div>
      <p className="tw-mt-2 tw-break-all tw-text-sm tw-text-iron-400">
        {chain.name} · {getAddress(contract)}
      </p>
      {listStatus}
      {ready && (
        <ul className="tw-m-0 tw-list-none tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-iron-800 tw-p-0">
          {rows.map((admin) => (
            <li
              key={admin.address}
              className="tw-flex tw-items-center tw-justify-between tw-gap-3 tw-py-4"
            >
              <div className="tw-min-w-0 tw-flex-1">
                <span className="tw-block tw-break-all tw-font-mono tw-text-sm tw-text-iron-100">
                  {admin.address}
                </span>
                <span className="tw-text-xs tw-text-iron-400">
                  {admin.isOwner ? "Owner" : "Admin"}
                </span>
              </div>
              {canManageContractAdmins && !admin.isOwner && (
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={controlsDisabled}
                  aria-label={`Revoke admin ${admin.address}`}
                  title="Revoke admin"
                  onClick={() =>
                    setConfirmation({
                      functionName: "revokeAdmin",
                      address: admin.address,
                      context: contextFingerprint,
                    })
                  }
                >
                  <TrashIcon aria-hidden="true" className="tw-size-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      {canManageContractAdmins && (
        <form
          className="tw-mt-6"
          onSubmit={(event) => {
            event.preventDefault();
            if (controlsDisabled || resolving || error) return;
            setConfirmation({
              functionName: "approveAdmin",
              address: getAddress(resolvedAddress),
              context: contextFingerprint,
            });
          }}
        >
          <label
            htmlFor="contract-admin-address"
            className="tw-mb-2 tw-block tw-text-sm tw-font-medium tw-text-iron-200"
          >
            Admin wallet or ENS
          </label>
          <div className="tw-flex tw-flex-col tw-gap-3 sm:tw-flex-row">
            <EnsAddressInput
              id="contract-admin-address"
              value={input}
              variant="dark"
              disabled={controlsDisabled}
              ariaDescribedBy="contract-admin-validation"
              onValueChange={setInput}
              onAddressChange={setResolvedAddress}
              onLoadingChange={setResolving}
              onError={setEnsError}
              className="tw-flex-1"
            />
            <Button
              type="submit"
              disabled={controlsDisabled || resolving || !!error}
              className="tw-shrink-0"
            >
              <PlusIcon aria-hidden="true" className="tw-size-4" />
              Add Admin
            </Button>
          </div>
          <p
            id="contract-admin-validation"
            aria-live="polite"
            className="tw-mt-2 tw-min-h-5 tw-break-all tw-text-sm tw-text-iron-400"
          >
            {getAdminValidationMessage(
              resolving,
              input,
              error,
              resolvedAddress
            )}
          </p>
        </form>
      )}
      {visibleConfirmation && (
        <AdminConfirmation
          operation={visibleConfirmation}
          chain={chain}
          onClose={() => setConfirmation(null)}
          onConfirm={() => {
            submit(visibleConfirmation);
            setConfirmation(null);
          }}
        />
      )}
      {transaction && (
        <OnchainTransactionModal
          status={transaction.status}
          title={
            transaction.functionName === "approveAdmin"
              ? "Add Admin"
              : "Revoke Admin"
          }
          subtitle={<span className="tw-break-all">{transaction.address}</span>}
          message={transaction.message}
          transactionHash={transaction.hash}
          chain={transaction.chain}
          onClose={closeTransaction}
        />
      )}
    </section>
  );
}

function AdminConfirmation({
  operation,
  chain,
  onClose,
  onConfirm,
}: Readonly<{
  operation: AdminOperation;
  chain: { id: number };
  onClose: () => void;
  onConfirm: () => void;
}>) {
  const approving = operation.functionName === "approveAdmin";
  return (
    <OnchainTransactionModal
      status="confirm_wallet"
      allowCloseWhilePending
      title={approving ? "Add Admin" : "Revoke Admin"}
      subtitle={<span className="tw-break-all">{operation.address}</span>}
      chain={chain}
      onClose={onClose}
      pendingContent={
        <div className="tw-space-y-4">
          <p className="tw-m-0 tw-text-sm tw-text-iron-300">
            {approving
              ? "Grant creator-contract admin access?"
              : "Remove creator-contract admin access?"}
          </p>
          <p className="tw-m-0 tw-text-sm tw-text-iron-400">
            Only the contract owner can authorize this transaction.
          </p>
          <div className="tw-flex tw-flex-wrap tw-justify-center tw-gap-3">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button variant={approving ? "primary" : "destructive"} onClick={onConfirm}>Confirm {approving ? "Add Admin" : "Revoke"}</Button>
          </div>
        </div>
      }
    />
  );
}
