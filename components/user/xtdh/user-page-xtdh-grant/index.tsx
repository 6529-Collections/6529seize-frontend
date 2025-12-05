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
    formKey,
  } = useUserPageXtdhGrantForm();

  const isSelectionValid =
    selection &&
    !("error" in selection) &&
    (selection.allSelected || selection.tokenIds.length > 0);

  const isAmountValid = amount !== null && amount > 0;

  return (
    <div className="tw-flex tw-flex-col tw-gap-8">
      {/* Step 1: Select Collection & Tokens */}
      <section id="create-grant-section" className="tw-bg-[#111] tw-border tw-border-solid tw-border-white/10 tw-rounded-xl tw-p-6">
        <h3 className="tw-m-0 tw-text-xs tw-font-bold tw-text-iron-400 tw-uppercase tw-tracking-wider tw-mb-3">
          1. Select Collection & Tokens
        </h3>
        <UserPageXtdhGrantSelection
          key={formKey}
          onSelectionChange={setSelection}
          onContractChange={setContract}
        />
      </section>

      {/* Step 2: Enter Amount */}
      {isSelectionValid && (
        <section className="tw-flex tw-flex-col tw-gap-4 tw-animate-in tw-fade-in tw-slide-in-from-top-4 tw-duration-300">
          <h3 className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-400 tw-uppercase tw-tracking-wider">
            2. Enter Grant Amount
          </h3>
          <UserPageXtdhGrantAmount
            amount={amount}
            onAmountChange={setAmount}
            maxGrantRate={maxGrantRate}
            isMaxGrantLoading={isMaxGrantLoading}
            isMaxGrantError={isMaxGrantError}
          />
        </section>
      )}

      {/* Step 3: Review & Submit */}
      {isSelectionValid && isAmountValid && (
        <section className="tw-flex tw-flex-col tw-gap-6 tw-animate-in tw-fade-in tw-slide-in-from-top-4 tw-duration-300">
          <div className="tw-flex tw-flex-col tw-gap-4">
            <h3 className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-400 tw-uppercase tw-tracking-wider">
              3. Review & Submit
            </h3>

            <div className="tw-rounded-xl tw-bg-iron-950 tw-p-4 tw-border tw-border-iron-800">
              <UserPageXtdhGrantSummary
                contract={contract}
                selection={selection}
                amount={amount}
                validUntil={validUntil}
              />
            </div>

            <UserPageXtdhGrantValidity value={validUntil} onChange={setValidUntil} />
          </div>

          <UserPageXtdhGrantSubmit
            contract={contract}
            selection={selection}
            amount={amount}
            validUntil={validUntil}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            errorMessage={submitError}
            successMessage={submitSuccess}
            maxGrantRate={maxGrantRate}
          />
        </section>
      )}
    </div>
  );
}
