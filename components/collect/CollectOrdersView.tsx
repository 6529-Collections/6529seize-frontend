"use client";

import Button from "@/components/utils/button/Button";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { CollectOrderView } from "./collect.types";

interface CollectOrdersViewProps {
  readonly orders: readonly CollectOrderView[];
  readonly loading: boolean;
  readonly authenticated: boolean;
  readonly error?: string | undefined;
  readonly onConnect: () => void;
  readonly onRetry: () => void;
  readonly onInspect: (orderId: string) => void;
  readonly onCancel: (orderId: string) => void;
  readonly hasMore?: boolean;
  readonly loadingMore?: boolean;
  readonly onLoadMore?: () => void;
}

export default function CollectOrdersView(props: CollectOrdersViewProps) {
  const locale = useBrowserLocale();
  return (
    <div className="tailwind-scope tw-mx-auto tw-w-full tw-max-w-[1100px] tw-px-4 tw-py-6 tw-text-iron-100 md:tw-px-6 lg:tw-px-8">
      <header className="tw-mb-6">
        <h1 className="tw-m-0 tw-text-3xl tw-font-semibold tw-tracking-tight">
          {t(locale, "collect.orders")}
        </h1>
        <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-400">
          {t(locale, "collect.orders.description")}
        </p>
      </header>
      {!props.authenticated ? (
        <div className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-p-6">
          <p className="tw-text-sm tw-text-iron-300">
            {t(locale, "collect.orders.private")}
          </p>
          <Button variant="action" onClick={props.onConnect}>
            {t(locale, "collect.connect")}
          </Button>
        </div>
      ) : (
        <>
          {props.error && (
            <div
              role="alert"
              className="tw-mb-4 tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-p-4"
            >
              <p className="tw-text-sm tw-text-iron-300">{props.error}</p>
              <Button variant="secondary" onClick={props.onRetry}>
                {t(locale, "collect.retry")}
              </Button>
            </div>
          )}
          {props.loading && (
            <p role="status" className="tw-text-sm tw-text-iron-400">
              {t(locale, "collect.orders.loading")}
            </p>
          )}
          {!props.loading && !props.error && props.orders.length === 0 && (
            <div className="tw-rounded-xl tw-border tw-border-dashed tw-border-iron-700 tw-px-6 tw-py-16 tw-text-center">
              <h2 className="tw-text-xl tw-font-semibold">
                {t(locale, "collect.orders.empty")}
              </h2>
              <p className="tw-mb-0 tw-text-sm tw-leading-6 tw-text-iron-400">
                {t(locale, "collect.orders.emptyDescription")}
              </p>
            </div>
          )}
          <ul className="tw-m-0 tw-list-none tw-space-y-3 tw-p-0">
            {props.orders.map((order) => (
              <li
                key={order.id}
                className="tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-p-4 sm:tw-p-5"
              >
                <div className="tw-flex tw-items-start tw-gap-4">
                  {order.media !== undefined && order.media !== null && (
                    <div className="tw-flex tw-size-16 tw-shrink-0 tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-lg tw-bg-iron-900 [&_img]:tw-max-h-full [&_img]:tw-object-contain">
                      {order.media}
                    </div>
                  )}
                  <div className="tw-min-w-0 tw-flex-1">
                    <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-2">
                      <p className="tw-m-0 tw-text-xs tw-text-iron-400">
                        {t(locale, `collect.action.${order.action}`)} ·{" "}
                        {order.tokenLabel}
                      </p>
                      <span className="tw-rounded-md tw-bg-iron-800 tw-px-2 tw-py-1 tw-text-xs tw-font-medium tw-text-iron-200">
                        {order.statusLabel}
                      </span>
                    </div>
                    <h2 className="tw-mb-0 tw-mt-2 tw-break-words tw-text-base tw-font-semibold tw-leading-6">
                      {order.title}
                    </h2>
                    <p className="tw-mb-0 tw-mt-1 tw-text-sm tw-tabular-nums">
                      {order.amountLabel}
                    </p>
                    <p className="tw-mb-0 tw-mt-2 tw-text-xs tw-leading-5 tw-text-iron-400">
                      {order.detail}
                    </p>
                    <p className="tw-mb-0 tw-mt-1 tw-break-all tw-text-xs tw-leading-5 tw-text-iron-400">
                      {t(locale, "collect.orders.maker", {
                        wallet: order.makerLabel,
                      })}
                    </p>
                    <p className="tw-mb-0 tw-mt-1 tw-text-xs tw-text-iron-400">
                      {t(locale, "collect.orders.updated", {
                        time: order.updatedLabel,
                      })}
                    </p>
                  </div>
                </div>
                <div className="tw-mt-4 tw-flex tw-flex-wrap tw-items-center tw-gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => props.onInspect(order.id)}
                    className="tw-min-h-11"
                  >
                    {t(locale, "collect.orders.inspect")}
                  </Button>
                  {order.cancellable && (
                    <Button
                      variant="tertiary"
                      size="sm"
                      disabled={Boolean(order.cancelDisabledReason)}
                      onClick={() => props.onCancel(order.id)}
                      className="tw-min-h-11"
                    >
                      {t(locale, "collect.action.cancel")}
                    </Button>
                  )}
                  {order.cancelDisabledReason && (
                    <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
                      {order.cancelDisabledReason}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {props.hasMore && (
            <div className="tw-mt-6 tw-flex tw-justify-center">
              <Button
                variant="secondary"
                loading={props.loadingMore === true}
                onClick={props.onLoadMore}
              >
                {t(locale, "collect.loadMore")}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
