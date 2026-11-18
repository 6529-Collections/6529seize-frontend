import { parseEther } from "viem";

export function isFundingAmountDraft(value: string): boolean {
  const [, fraction = "", extra] = value.split(".");
  return extra === undefined && fraction.length <= 18 && !/[^0-9.]/.test(value);
}

export function validFundingAmount(amount: string): boolean {
  const parts = amount.split(".");
  return (
    isFundingAmountDraft(amount) &&
    parts.every((part) => part.length > 0) &&
    parseEther(amount) > 0n
  );
}
