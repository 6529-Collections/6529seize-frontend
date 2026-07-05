"use client";

import type { Dispatch, ReactNode, SetStateAction } from "react";

import type { ContractDelegation } from "../CollectionDelegation.utils";

export function toggleDisclosureKey(
  key: string,
  setKeys: Dispatch<SetStateAction<string[]>>,
  setChanged: Dispatch<SetStateAction<boolean>>
) {
  setKeys((keys) =>
    keys.includes(key)
      ? keys.filter((current) => current !== key)
      : [...keys, key]
  );
  setChanged(true);
}

export function getDelegationsCount(delegations: ContractDelegation[]) {
  let count = 0;
  for (const delegation of delegations) {
    if (delegation.wallets.length > 0) {
      count += delegation.wallets.length;
    }
  }
  return count;
}

export function getActiveKeys(
  outDelegations: ContractDelegation[],
  inDelegations: ContractDelegation[]
) {
  const outCount = getDelegationsCount(outDelegations);
  const inCount = getDelegationsCount(inDelegations);

  if (outCount > 0 && inCount > 0) {
    return ["0", "1"];
  }
  if (outCount > 0) {
    return ["0"];
  }
  if (inCount > 0) {
    return ["1"];
  }
  return [""];
}

export function DelegationDisclosurePanel(
  props: Readonly<{
    title: string;
    isOpen: boolean;
    onToggle: () => void;
    children: ReactNode;
    className?: string | undefined;
  }>
) {
  return (
    <section
      className={`tw-overflow-hidden tw-bg-iron-900 tw-ring-1 tw-ring-inset tw-ring-iron-800 ${props.className ?? ""}`}
    >
      <h6 className="tw-m-0">
        <button
          type="button"
          className="tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-3 tw-border-0 tw-bg-iron-800 tw-px-4 tw-py-3 tw-text-left tw-font-bold tw-text-iron-50 hover:tw-bg-iron-700 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          aria-expanded={props.isOpen}
          onClick={props.onToggle}
        >
          <span>{props.title}</span>
          <span aria-hidden="true">{props.isOpen ? "-" : "+"}</span>
        </button>
      </h6>
      {props.isOpen && (
        <div className="tw-bg-iron-950 tw-p-3">{props.children}</div>
      )}
    </section>
  );
}
