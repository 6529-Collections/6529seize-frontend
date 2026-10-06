"use client";

import {
  ArrowPathIcon,
  ChevronUpIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { useRef, useState } from "react";
import { getAddress, type Address } from "viem";
import { useReadContract } from "wagmi";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { getConnectedActionFingerprint } from "@/components/auth/useConnectedAction";
import OnchainTransactionModal from "@/components/common/OnchainTransactionModal";
import { useDropForgeMintingConfig } from "@/components/drop-forge/drop-forge-config";
import Button from "@/components/utils/button/Button";
import EnsAddressInput from "@/components/utils/input/ens-address/EnsAddressInput";
import CustomTooltip from "@/components/utils/tooltip/CustomTooltip";
import { useDropForgePermissions } from "@/hooks/useDropForgePermissions";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { SupportedLocale } from "@/i18n/locales";
import { getAddressEtherscanLink } from "@/helpers/Helpers";
import { CREATOR_ADMIN_ABI } from "./creator-admin-abi";
import ContractAdminRow from "./ContractAdminRow";
import {
  getAdminAddressError,
  getCreatorAdminRows,
  getAdminValidationMessage,
} from "./contract-admins.helpers";
import {
  useContractAdminTransaction,
  type AdminOperation,
} from "./useContractAdminTransaction";

const MIN_REFRESH_DURATION_MS = 1500;

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
  const [addExpanded, setAddExpanded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const refreshInProgress = useRef(false);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const contextFingerprint = getConnectedActionFingerprint({
    contract,
    chainId: chain.id,
    activeWallet,
    canManageContractAdmins,
    input,
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
  const refresh = async () => {
    if (refreshInProgress.current) return;
    refreshInProgress.current = true;
    setRefreshing(true);
    await Promise.allSettled([
      ownerQuery.refetch(),
      adminsQuery.refetch(),
      new Promise<void>((resolve) =>
        setTimeout(resolve, MIN_REFRESH_DURATION_MS)
      ),
    ]);
    refreshInProgress.current = false;
    setRefreshing(false);
  };
  const closeAddForm = () => {
    setAddExpanded(false);
    setInput("");
    setResolvedAddress("");
    setResolving(false);
    setEnsError(false);
    addButtonRef.current?.focus();
  };

  return (
    <section
      aria-labelledby="contract-admins-heading"
      className="tailwind-scope tw-mt-6 tw-rounded-xl tw-bg-iron-950 tw-p-4 tw-ring-1 tw-ring-inset tw-ring-iron-800 sm:tw-p-6"
    >
      <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
        <h2
          id="contract-admins-heading"
          className="tw-mb-0 tw-text-xl tw-font-semibold tw-text-iron-50"
        >
          {t(locale, "dropForge.admins.heading")}
        </h2>
        <div className="tw-flex tw-items-center tw-gap-2">
          {canManageContractAdmins && (
            <Button
              ref={addButtonRef}
              size="md"
              aria-expanded={addExpanded}
              aria-controls="contract-admin-add-form"
              disabled={controlsDisabled}
              onClick={() => {
                if (addExpanded) closeAddForm();
                else setAddExpanded(true);
              }}
            >
              {addExpanded ? (
                <ChevronUpIcon aria-hidden="true" className="tw-size-5" />
              ) : (
                <PlusIcon aria-hidden="true" className="tw-size-5" />
              )}
              {t(locale, "dropForge.admins.add")}
            </Button>
          )}
          <CustomTooltip content={t(locale, "dropForge.admins.refresh")}>
            <Button
              variant="secondary"
              size="md"
              className="tw-w-10 !tw-px-0"
              aria-label={t(locale, "dropForge.admins.refresh")}
              loading={refreshing}
              hideChildrenWhenLoading
              onClick={() => void refresh()}
              disabled={ownerQuery.isFetching || adminsQuery.isFetching}
            >
              <ArrowPathIcon aria-hidden="true" className="tw-size-5" />
            </Button>
          </CustomTooltip>
        </div>
      </div>
      <p className="tw-mt-2 tw-break-all tw-text-sm tw-text-iron-400">
        {chain.name} ·{" "}
        <a
          href={getAddressEtherscanLink(chain.id, contract)}
          target="_blank"
          rel="noopener noreferrer"
          className="tw-text-iron-400 tw-underline tw-decoration-iron-600 tw-underline-offset-2 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-text-iron-200"
        >
          {contract}
        </a>
      </p>
      {listStatus}
      {canManageContractAdmins && addExpanded && (
        <form
          id="contract-admin-add-form"
          className="tw-mb-3 tw-mt-5 tw-border-x-0 tw-border-y tw-border-solid tw-border-iron-800 tw-py-5"
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
          <div className="tw-flex tw-flex-col tw-gap-3 sm:tw-flex-row sm:tw-items-center">
            <EnsAddressInput
              id="contract-admin-address"
              value={input}
              requireEnsResolution
              variant="dark"
              disabled={controlsDisabled}
              ariaDescribedBy="contract-admin-validation"
              ariaInvalid={hasInputError}
              placeholder={t(locale, "dropForge.admins.addressPlaceholder")}
              onValueChange={setInput}
              onAddressChange={setResolvedAddress}
              onLoadingChange={setResolving}
              onError={setEnsError}
              className="tw-min-w-0 tw-flex-1"
            />
            <div className="tw-flex tw-shrink-0 tw-flex-wrap tw-gap-2">
              <Button
                type="submit"
                size="md"
                disabled={controlsDisabled || resolving || !!error}
              >
                {t(locale, "dropForge.admins.review")}
              </Button>
              <Button
                variant="secondary"
                size="md"
                disabled={controlsDisabled}
                onClick={closeAddForm}
              >
                {t(locale, "dropForge.admins.cancel")}
              </Button>
            </div>
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
      {ready && (
        <ul className="tw-m-0 tw-list-none tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-iron-800 tw-p-0">
          {rows.map((admin) => (
            <ContractAdminRow
              key={admin.address}
              address={admin.address}
              isOwner={admin.isOwner}
              locale={locale}
              canManage={canManageContractAdmins}
              disabled={controlsDisabled}
              onRevoke={() =>
                setConfirmation({
                  functionName: "revokeAdmin",
                  address: admin.address,
                  context: contextFingerprint,
                })
              }
            />
          ))}
        </ul>
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
          subtitle={
            <span className="tw-block tw-break-all tw-font-mono">
              {transaction.address}
            </span>
          }
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
      subtitle={
        <span className="tw-block tw-break-all tw-font-mono">
          {operation.address}
        </span>
      }
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
            <Button variant="secondary" size="md" onClick={onClose}>
              {t(locale, "dropForge.admins.cancel")}
            </Button>
            <Button
              variant={approving ? "primary" : "destructive"}
              size="md"
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
