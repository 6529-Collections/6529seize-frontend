"use client";

import {
  ApiDropForgeSupplyEvidenceStatusEnum as Status,
  type ApiDropForgeSupplyEvidence,
} from "@/generated/models/ApiDropForgeSupplyEvidence";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export default function DropForgeSupplyEvidence({
  evidence,
  retryAt,
}: Readonly<{
  evidence: ApiDropForgeSupplyEvidence;
  retryAt?: number | null | undefined;
}>) {
  const locale = useBrowserLocale();
  const number = (value: number | undefined) =>
    value === undefined
      ? t(locale, "dropForge.supply.unknown")
      : new Intl.NumberFormat(locale).format(value);
  return (
    <div className="tw-my-2 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-p-3 tw-text-sm tw-text-iron-300">
      <p className="tw-mb-2 tw-mt-0 tw-font-medium">
        {t(
          locale,
          evidence.status === Status.Verified
            ? "dropForge.supply.verified"
            : "dropForge.supply.waiting"
        )}
      </p>
      <dl className="tw-m-0 tw-grid tw-grid-cols-2 tw-gap-x-4 tw-gap-y-1">
        <dt>{t(locale, "dropForge.supply.rpc")}</dt>
        <dd className="tw-m-0">{number(evidence.rpc_total)}</dd>
        <dt>{t(locale, "dropForge.supply.database")}</dt>
        <dd className="tw-m-0">{number(evidence.db_total)}</dd>
        <dt>{t(locale, "dropForge.supply.block")}</dt>
        <dd className="tw-m-0">{number(evidence.block_number)}</dd>
        <dt>{t(locale, "dropForge.supply.indexed")}</dt>
        <dd className="tw-m-0">{number(evidence.indexed_through)}</dd>
      </dl>
      {typeof retryAt === "number" && evidence.status === Status.Waiting && (
        <p className="tw-mb-0 tw-mt-2">
          {t(locale, "dropForge.supply.retry", {
            time: new Intl.DateTimeFormat(locale, {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "Europe/Athens",
            }).format(new Date(retryAt * 1000)),
          })}
        </p>
      )}
    </div>
  );
}
