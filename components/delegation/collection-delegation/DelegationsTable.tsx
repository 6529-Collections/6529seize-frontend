"use client";

import { Fragment, type ReactNode } from "react";

import { areEqualAddresses } from "@/helpers/Helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type {
  ContractDelegation,
  ContractWalletDelegation,
} from "../CollectionDelegation.utils";
import type { DelegationCollection } from "../delegation-constants";
import { CONSOLIDATION_USE_CASE } from "../delegation-constants";
import { getDelegationsCount } from "./DelegationDisclosurePanel";
import type { ActiveConsolidation } from "./useCollectionDelegationReads";

/** Everything a table row renderer needs about one wallet delegation. */
export interface DelegationRowRenderArgs {
  readonly delegationIndex: number;
  readonly walletIndex: number;
  readonly delegationsCount: number;
  readonly del: ContractDelegation;
  readonly walletDelegation: ContractWalletDelegation;
  readonly consolidationStatus: string | undefined;
  readonly statusUnavailable: boolean;
  readonly pending: boolean;
  readonly isConsolidation: boolean;
}

/**
 * Shared scaffolding for the outgoing/incoming delegation tables: the
 * scroll container, per-use-case header rows, wallet rows (delegated to
 * `renderRow`), the fetching/empty states, and an optional footer row.
 */
export function DelegationsTable(
  props: Readonly<{
    direction: "outgoing" | "incoming";
    scope: string;
    myDelegations: ContractDelegation[];
    collection: DelegationCollection;
    delegationsLoaded: boolean;
    delegationsError: boolean;
    onRetry: () => void;
    activeConsolidations: ActiveConsolidation[];
    renderRow: (args: DelegationRowRenderArgs) => ReactNode;
    renderFooter?: ((delegationsCount: number) => ReactNode) | undefined;
  }>
) {
  const locale = useBrowserLocale();
  const { direction, scope, myDelegations, collection } = props;
  const { delegationsLoaded, activeConsolidations, renderRow } = props;

  const delegationsCount = getDelegationsCount(myDelegations);

  let body: ReactNode;
  if (delegationsCount > 0) {
    body = myDelegations.map((del, index: number) => {
      if (!del.wallets.length) return null;
      const isConsolidation =
        del.useCase.use_case === CONSOLIDATION_USE_CASE.use_case;
      return (
        <Fragment key={`${direction}-${del.useCase.use_case}-${index}`}>
          <tr>
            <td
              colSpan={4}
              className="tw-px-1 tw-pb-1 tw-pt-3 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400"
            >
              #{del.useCase.use_case} - {del.useCase.display}
            </td>
          </tr>
          {del.wallets.map((w, walletIndex) => {
            const consolidationStatusCode = activeConsolidations.find((i) =>
              areEqualAddresses(w.wallet, i.wallet)
            )?.status;
            const pending = consolidationStatusCode === "incomplete";
            const statusUnavailable = consolidationStatusCode === "unavailable";
            const consolidationStatus = consolidationStatusCode
              ? t(
                  locale,
                  `delegation.collection.row.status.${consolidationStatusCode}`
                )
              : undefined;
            return renderRow({
              delegationIndex: index,
              walletIndex,
              delegationsCount,
              del,
              walletDelegation: w,
              consolidationStatus,
              statusUnavailable,
              pending,
              isConsolidation,
            });
          })}
        </Fragment>
      );
    });
  } else if (props.delegationsError) {
    body = (
      <tr>
        <td colSpan={4} className="tw-rounded-lg tw-bg-iron-900 tw-p-4">
          <div
            role="alert"
            className="tw-flex tw-flex-wrap tw-items-center tw-gap-3"
          >
            <span className="tw-text-base tw-text-error">
              {t(locale, "delegation.collection.readError.message", {
                collection: collection.title,
              })}
            </span>
            <button
              type="button"
              className="tw-rounded-lg tw-border tw-border-solid tw-border-iron-500 tw-bg-iron-800 tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-white tw-transition-colors hover:tw-bg-iron-700 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
              onClick={props.onRetry}
            >
              {t(locale, "delegation.collection.readError.retry")}
            </button>
          </div>
        </td>
      </tr>
    );
  } else if (delegationsLoaded) {
    body = (
      <tr>
        <td
          colSpan={4}
          className="tw-rounded-lg tw-bg-iron-900 tw-p-4 tw-text-base tw-text-iron-300"
        >
          {t(locale, "delegation.collection.records.empty", {
            direction: t(
              locale,
              `delegation.collection.direction.${direction}`
            ),
            scope,
            collection: collection.title,
          })}
        </td>
      </tr>
    );
  } else {
    body = (
      <tr>
        <td
          colSpan={4}
          className="tw-rounded-lg tw-bg-iron-900 tw-p-4 tw-text-base tw-text-iron-300"
        >
          {t(locale, "delegation.collection.records.fetching", {
            direction: t(
              locale,
              `delegation.collection.direction.${direction}`
            ),
            scope,
            collection: collection.title,
          })}
        </td>
      </tr>
    );
  }

  return (
    <div className="tw-w-full">
      <div className="tw-w-full tw-overflow-x-auto">
        <div className="tw-w-full tw-min-w-[34rem] sm:tw-min-w-0">
          <table className="tw-mb-0 tw-w-full tw-border-separate tw-border-spacing-0">
            <tbody>
              {body}
              {props.renderFooter?.(delegationsCount)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
