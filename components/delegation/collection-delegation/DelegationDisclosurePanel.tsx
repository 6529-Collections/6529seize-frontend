"use client";

import { ChevronDownIcon } from "@heroicons/react/24/outline";
import {
  useId,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

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
  const contentId = useId();

  return (
    <section
      className={`tw-overflow-hidden tw-rounded-lg tw-transition-colors tw-duration-200 motion-reduce:tw-transition-none ${
        props.isOpen
          ? "tw-bg-white/[0.055]"
          : "tw-bg-white/[0.035] desktop-hover:hover:tw-bg-white/[0.055]"
      } ${props.className ?? ""}`}
    >
      <h3 className="tw-m-0">
        <button
          type="button"
          className="tw-group tw-flex tw-min-h-14 tw-w-full tw-items-center tw-justify-between tw-gap-3 tw-border-0 tw-bg-transparent tw-px-4 tw-py-3.5 tw-text-left tw-text-base tw-font-semibold tw-text-iron-50 tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-400 motion-reduce:tw-transition-none"
          aria-controls={contentId}
          aria-expanded={props.isOpen}
          onClick={props.onToggle}
        >
          <span>{props.title}</span>
          <span
            aria-hidden="true"
            className={`tw-flex tw-size-7 tw-flex-none tw-items-center tw-justify-center tw-transition-colors motion-reduce:tw-transition-none ${
              props.isOpen
                ? "tw-text-primary-300"
                : "tw-text-iron-400 desktop-hover:group-hover:tw-text-iron-100"
            }`}
          >
            <ChevronDownIcon
              className={`tw-size-4 tw-transition-transform motion-reduce:tw-transition-none ${props.isOpen ? "tw-rotate-180" : ""}`}
            />
          </span>
        </button>
      </h3>
      {props.isOpen && (
        <div className="tw-bg-black/10 tw-p-3 sm:tw-p-4" id={contentId}>
          {props.children}
        </div>
      )}
    </section>
  );
}
