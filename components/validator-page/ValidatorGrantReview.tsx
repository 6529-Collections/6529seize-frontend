"use client";

import "@/i18n/namespaces/validator-sign";
import { hashTypedData } from "viem";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatNumber } from "@/i18n/format";
import { t } from "@/i18n/messages";
import type { ValidatorGrant } from "@/lib/validator-page/grant";

export default function ValidatorGrantReview({
  grant,
}: {
  readonly grant: ValidatorGrant;
}) {
  const locale = useBrowserLocale();
  const { message } = grant;
  const total = message.keys.reduce((sum, key) => sum + key.share, 0);
  return (
    <div className="tw-space-y-5">
      <div>
        <p className="tw-mb-2 tw-text-sm tw-text-iron-400">
          {t(locale, "validator.sign.account")}
        </p>
        <p
          className="tw-m-0 tw-break-all tw-font-mono tw-text-sm tw-text-iron-50"
          data-testid="grant-account"
        >
          {message.account}
        </p>
      </div>
      <p className="tw-m-0 tw-text-sm">{t(locale, "validator.sign.mainnet")}</p>
      <p className="tw-m-0 tw-text-sm tw-leading-6">
        {t(locale, "validator.sign.permission")}
      </p>
      {message.keys.length === 0 ? (
        <p
          role="alert"
          className="tw-rounded-lg tw-border tw-border-solid tw-border-error/50 tw-bg-error/10 tw-p-4 tw-text-iron-50"
        >
          {t(locale, "validator.sign.revoke")}
        </p>
      ) : (
        <>
          <h3 className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-100">
            {t(locale, "validator.sign.keys")}
          </h3>
          <ul className="tw-m-0 tw-list-none tw-space-y-3 tw-p-0">
            {message.keys.map((key) => (
              <li
                key={key.pubkey}
                className="tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-p-4"
              >
                <p className="tw-mb-1 tw-font-mono tw-font-semibold tw-text-iron-50">
                  {t(locale, "validator.sign.key", {
                    code: key.pubkey.slice(-8),
                  })}
                </p>
                <p className="tw-mb-0 tw-text-sm">
                  {t(locale, "validator.sign.share", {
                    share: formatNumber(locale, key.share / total, {
                      style: "percent",
                      maximumFractionDigits: 4,
                    }),
                  })}
                </p>
                <details className="tw-mt-3 tw-text-sm">
                  <summary className="tw-cursor-pointer tw-text-primary-300 focus-visible:tw-outline-primary-400">
                    {t(locale, "validator.sign.pubkey")}
                  </summary>
                  <p className="tw-mb-0 tw-mt-2 tw-break-all tw-font-mono tw-text-xs">
                    {key.pubkey}
                  </p>
                </details>
              </li>
            ))}
          </ul>
          <p className="tw-m-0 tw-text-sm tw-leading-6">
            {t(locale, "validator.sign.replace")}
          </p>
        </>
      )}
      <details className="tw-text-sm">
        <summary className="tw-cursor-pointer tw-text-primary-300 focus-visible:tw-outline-primary-400">
          {t(locale, "validator.sign.details")}
        </summary>
        <dl className="tw-mb-0 tw-mt-3 tw-space-y-2">
          <div>
            <dt>{t(locale, "validator.sign.version")}</dt>
            <dd className="tw-m-0 tw-font-mono">
              {message.authVersion.toString()}
            </dd>
          </div>
          <div>
            <dt>{t(locale, "validator.sign.block")}</dt>
            <dd className="tw-m-0 tw-font-mono">
              {message.refBlockNumber.toString()}
            </dd>
          </div>
          <div>
            <dt>{t(locale, "validator.sign.hash")}</dt>
            <dd className="tw-m-0 tw-break-all tw-font-mono tw-text-xs">
              {hashTypedData(grant)}
            </dd>
          </div>
        </dl>
      </details>
    </div>
  );
}
