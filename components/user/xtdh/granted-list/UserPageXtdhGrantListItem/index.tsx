"use client";

import type { ReactNode } from "react";

import type { ApiTdhGrantsPage } from "@/generated/models/ApiTdhGrantsPage";

import {
  GrantItemContent,
  GrantItemError,
  GrantItemSkeleton,
} from "./subcomponents";
import { useGrantItemViewModel } from "./useGrantItemViewModel";

export interface UserPageXtdhGrantListItemProps {
  readonly grant: ApiTdhGrantsPage["data"][number];
}

export function UserPageXtdhGrantListItem({
  grant,
}: Readonly<UserPageXtdhGrantListItemProps>) {
  const { contract, contractLabel, details, isLoading, status, variant } =
    useGrantItemViewModel(grant);

  if (isLoading) {
    return (
      <GrantListItemContainer>
        <GrantItemSkeleton />
      </GrantListItemContainer>
    );
  }

  return (
    <GrantListItemContainer>
      {variant === "contract" && contract ? (
        <GrantItemContent contract={contract} status={status} details={details} />
      ) : (
        <GrantItemError
          contractLabel={contractLabel}
          status={status}
          details={details}
        />
      )}
    </GrantListItemContainer>
  );
}

function GrantListItemContainer({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <li className="tw-list-none tw-rounded-xl tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-4">
      {children}
    </li>
  );
}
