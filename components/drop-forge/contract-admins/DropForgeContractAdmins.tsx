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
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { SupportedLocale } from "@/i18n/locales";
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
  const locale = useBrowserLocale();
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
      contextFingerprint: getConnectedActionFingerprint({
        contextFingerprint,
        functionName: confirmation?.functionName,
        target: confirmation?.address,
      }),
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
    ? t(locale, "dropForge.admins.ensError")
    : getAdminAddressError(resolvedAddress, ownerQuery.data, admins, locale);
  const hasInputError = !!input && !resolving && !!error;
  const visibleConfirmation =
    !busy && !transaction && confirmation?.context === contextFingerprint
      ? confirmation
      : null;
  const controlsDisabled = busy || !ready || !!visibleConfirmation;
  let listStatus = null;
  if (hasReadError) {
    listStatus = (
      <p role="alert" className="tw-text-red">
        {t(locale, "dropForge.admins.loadError")}
      </p>
    );
  } else if (!ready) {
    listStatus = (
      <output className="tw-block tw-text-iron-400">
        {t(locale, "dropForge.admins.loading")}
      </output>
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
          {t(locale, "dropForge.admins.heading")}
        </h2>
        <Button
          variant="secondary"
          size="sm"
          aria-label={t(locale, "dropForge.admins.refresh")}
          title={t(locale, "dropForge.admins.refresh")}
          onClick={refresh}
          disabled={ownerQuery.isFetching || adminsQuery.isFetching}
        >
          <ArrowPathIcon aria-hidden="true" className="tw-size-4" />
        </Button>
      </div>
      <p className="tw-mt-2 tw-break-all tw-text-sm tw-text-iron-400">
        {chain.name} · {contract}
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
                  {t(
                    locale,
                    admin.isOwner
                      ? "dropForge.admins.owner"
                      : "dropForge.admins.admin"
                  )}
                </span>
              </div>
              {canManageContractAdmins && !admin.isOwner && (
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={controlsDisabled}
                  aria-label={t(locale, "dropForge.admins.revokeLabel", {
                    address: admin.address,
                  })}
                  title={t(locale, "dropForge.admins.revokeTooltip")}
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
            {t(locale, "dropForge.admins.addressLabel")}
          </label>
          <div className="tw-flex tw-flex-col tw-gap-3 sm:tw-flex-row">
            <EnsAddressInput
              id="contract-admin-address"
              value={input}
              variant="dark"
              disabled={controlsDisabled}
              ariaDescribedBy="contract-admin-validation"
              ariaInvalid={hasInputError}
              placeholder={t(locale, "dropForge.admins.addressPlaceholder")}
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
              {t(locale, "dropForge.admins.add")}
            </Button>
          </div>
          <p
            id="contract-admin-validation"
            role={hasInputError ? "alert" : undefined}
            aria-live={hasInputError ? undefined : "polite"}
            className="tw-mt-2 tw-min-h-5 tw-break-all tw-text-sm tw-text-iron-400"
          >
            {getAdminValidationMessage(
              resolving,
              input,
              error,
              resolvedAddress,
              locale
            )}
          </p>
        </form>
      )}
      {visibleConfirmation && (
        <AdminConfirmation
          operation={visibleConfirmation}
          locale={locale}
          isOwner={
            activeWallet?.toLowerCase() === ownerQuery.data?.toLowerCase()
          }
          chain={chain}
          onClose={() => setConfirmation(null)}
          onConfirm={() => {
            submit(visibleConfirmation);
          }}
        />
      )}
      {transaction && (
        <OnchainTransactionModal
          status={transaction.status}
          title={t(
            locale,
            transaction.functionName === "approveAdmin"
              ? "dropForge.admins.add"
              : "dropForge.admins.revoke"
          )}
          subtitle={<span className="tw-break-all">{transaction.address}</span>}
          message={transaction.message}
          transactionHash={transaction.hash}
          chain={transaction.chain}
          onClose={() => {
            closeTransaction();
            setConfirmation(null);
          }}
        />
      )}
    </section>
  );
}

function AdminConfirmation({
  operation,
  locale,
  isOwner,
  chain,
  onClose,
  onConfirm,
}: Readonly<{
  operation: AdminOperation;
  locale: SupportedLocale;
  isOwner: boolean;
  chain: { id: number };
  onClose: () => void;
  onConfirm: () => void;
}>) {
  const approving = operation.functionName === "approveAdmin";
  return (
    <OnchainTransactionModal
      status="confirm_wallet"
      allowCloseWhilePending
      title={t(
        locale,
        approving ? "dropForge.admins.add" : "dropForge.admins.revoke"
      )}
      subtitle={<span className="tw-break-all">{operation.address}</span>}
      chain={chain}
      onClose={onClose}
      pendingContent={
        <div className="tw-space-y-4">
          <p className="tw-m-0 tw-text-sm tw-text-iron-300">
            {t(
              locale,
              approving
                ? "dropForge.admins.grantQuestion"
                : "dropForge.admins.revokeQuestion"
            )}
          </p>
          <p className="tw-m-0 tw-text-sm tw-text-iron-400">
            {t(locale, "dropForge.admins.ownerRequired")}
          </p>
          {!isOwner && (
            <p className="tw-m-0 tw-text-sm tw-text-red">
              {t(locale, "dropForge.admins.nonOwnerWarning")}
            </p>
          )}
          <div className="tw-flex tw-flex-wrap tw-justify-center tw-gap-3">
            <Button variant="secondary" onClick={onClose}>
              {t(locale, "dropForge.admins.cancel")}
            </Button>
            <Button
              variant={approving ? "primary" : "destructive"}
              onClick={onConfirm}
            >
              {t(
                locale,
                approving
                  ? "dropForge.admins.confirmAdd"
                  : "dropForge.admins.confirmRevoke"
              )}
            </Button>
          </div>
        </div>
      }
    />
  );
}
