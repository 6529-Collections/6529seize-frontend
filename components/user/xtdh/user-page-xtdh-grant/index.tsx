"use client";

import UserPageXtdhGrantSummary from "../UserPageXtdhGrantSummary";
import UserPageXtdhGrantAmount from "../UserPageXtdhGrantAmount";
import UserPageXtdhGrantValidity from "../UserPageXtdhGrantValidity";
import UserPageXtdhGrantSelection from "../UserPageXtdhGrantSelection";
import UserPageXtdhGrantSubmit from "../UserPageXtdhGrantSubmit";
import { useUserPageXtdhGrantForm } from "./hooks/useUserPageXtdhGrantForm";

export default function UserPageXtdhGrant() {
  const {
    contract,
    selection,
    amount,
    validUntil,
    setContract,
    setSelection,
    setAmount,
    setValidUntil,
    submitError,
    submitSuccess,
    isSubmitting,
    handleSubmit,
    maxGrantRate,
    isMaxGrantLoading,
    isMaxGrantError,
  } = useUserPageXtdhGrantForm();

  return (
    <div className="tw-flex tw-flex-col tw-gap-6">
      <UserPageXtdhGrantSummary
        contract={contract}
        selection={selection}
        amount={amount}
        validUntil={validUntil}
      />

      <UserPageXtdhGrantSelection
        onSelectionChange={setSelection}
        onContractChange={setContract}
      />

      <UserPageXtdhGrantAmount
        amount={amount}
        onAmountChange={setAmount}
        maxGrantRate={maxGrantRate}
        isMaxGrantLoading={isMaxGrantLoading}
        isMaxGrantError={isMaxGrantError}
      />

      <UserPageXtdhGrantValidity value={validUntil} onChange={setValidUntil} />

      <UserPageXtdhGrantSubmit
        contract={contract}
        selection={selection}
        amount={amount}
        validUntil={validUntil}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        errorMessage={submitError}
        successMessage={submitSuccess}
      />
    </div>
  );
}
