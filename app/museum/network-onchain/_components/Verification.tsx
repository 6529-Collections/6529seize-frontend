import Link from "next/link";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { ONCHAIN_MUSEUM_SOURCE } from "@/lib/museum/onchain/constants";
import { onchainMuseumRecordHref } from "@/lib/museum/onchain/fields";
import { type OnchainMuseumView } from "@/lib/museum/onchain/presentation";
import {
  CopyValue,
  FactList,
  formatCount,
  formatUtcDateTime,
  Mono,
  SectionHeading,
  TEXT_LINK,
} from "./OnchainParts";

const locale = DEFAULT_LOCALE;
const ETHERSCAN = "https://sepolia.etherscan.io";

function CheckRow({
  passed,
  label,
}: Readonly<{ passed: boolean; label: string }>) {
  return (
    <li
      data-check={passed ? "pass" : "fail"}
      className="tw-flex tw-items-start tw-gap-3 tw-text-sm tw-leading-6"
    >
      <span
        aria-hidden="true"
        className={`tw-mt-0.5 tw-inline-flex tw-size-5 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-text-xs tw-font-bold ${
          passed
            ? "tw-bg-emerald-400/20 tw-text-emerald-200"
            : "tw-bg-red-400/20 tw-text-red-200"
        }`}
      >
        {passed ? "✓" : "!"}
      </span>
      <span className="tw-text-iron-100">
        {label}
        <span className="tw-sr-only">
          {": "}
          {t(
            locale,
            passed ? "museum.onchain.check.pass" : "museum.onchain.check.fail"
          )}
        </span>
      </span>
    </li>
  );
}

/** An address in a CAIP-10 account ID, for an Etherscan link. */
function caip10Address(value: string): string | null {
  const address = value.split(":").at(-1) ?? "";
  return /^0x[0-9a-fA-F]{40}$/u.test(address) ? address : null;
}

function AccountValue({
  value,
  field,
}: Readonly<{ value: string; field: string }>) {
  const address = caip10Address(value);
  return (
    <CopyValue
      value={value}
      field={field}
      href={address === null ? undefined : `${ETHERSCAN}/address/${address}`}
    />
  );
}

/** The registry's own declaration (PRV_REGISTRY): who runs it and how to read it. */
function Declaration({ view }: Readonly<{ view: OnchainMuseumView }>) {
  const { declaration } = view.snapshot;
  const record = view.declarationRecord;
  return (
    <div className="tw-mt-8">
      <h3
        id="declaration"
        className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-50"
      >
        {t(locale, "museum.onchain.declaration.heading")}
      </h3>
      <p className="tw-m-0 tw-mt-2 tw-max-w-3xl tw-text-sm tw-leading-6 tw-text-iron-300">
        {t(locale, "museum.onchain.declaration.intro")}
      </p>
      {declaration.state === "missing" ? (
        <p className="tw-m-0 tw-mt-3 tw-text-sm tw-text-yellow-100">
          {t(locale, "museum.onchain.declaration.missing")}
        </p>
      ) : (
        <div className="tw-mt-4">
          <FactList
            facts={[
              {
                label: t(locale, "museum.onchain.declaration.name"),
                value: declaration.name ?? "-",
              },
              {
                label: t(locale, "museum.onchain.declaration.registry"),
                value:
                  declaration.registry === null ? (
                    "-"
                  ) : (
                    <AccountValue
                      value={declaration.registry}
                      field={t(locale, "museum.onchain.declaration.registry")}
                    />
                  ),
              },
              {
                label: t(locale, "museum.onchain.declaration.namespace"),
                value: <Mono>{declaration.ns ?? "-"}</Mono>,
              },
              {
                label: t(locale, "museum.onchain.declaration.profile"),
                value: <Mono>{declaration.profileVersion ?? "-"}</Mono>,
              },
              {
                label: t(locale, "museum.onchain.declaration.subjectIds"),
                value: t(locale, "museum.onchain.declaration.subjectIdsValue", {
                  ns: declaration.ns ?? "",
                }),
              },
              ...(declaration.predecessor === null
                ? []
                : [
                    {
                      label: t(
                        locale,
                        "museum.onchain.declaration.predecessor"
                      ),
                      value: (
                        <AccountValue
                          value={declaration.predecessor}
                          field={t(
                            locale,
                            "museum.onchain.declaration.predecessor"
                          )}
                        />
                      ),
                    },
                  ]),
              ...(declaration.effectiveAt === null
                ? []
                : [
                    {
                      label: t(locale, "museum.onchain.field.effectiveAt"),
                      value: formatUtcDateTime(declaration.effectiveAt),
                    },
                  ]),
            ]}
          />
          {record === null ? null : (
            <p className="tw-m-0 tw-mt-4 tw-text-sm">
              <Link
                href={onchainMuseumRecordHref(record.subjectId)}
                className={TEXT_LINK}
              >
                {t(locale, "museum.onchain.declaration.open")}
              </Link>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

const LEAD_KEYS = [
  "museum.onchain.verification.lead",
  "museum.onchain.verification.subjects",
  "museum.onchain.verification.texts",
  "museum.onchain.verification.images",
] as const;

/** How the page checks what it shows, and the result of each check. */
export function Verification({ view }: Readonly<{ view: OnchainMuseumView }>) {
  const { snapshot } = view;
  const { checks, blockNumber, blockTimestamp, registry } = snapshot.registry;
  const total = snapshot.records.length;
  const failures = total - snapshot.counts.verified;
  const { index } = snapshot.media;
  return (
    <section
      aria-labelledby="verification"
      className="tw-mb-12 tw-rounded-2xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900/60 tw-p-5 sm:tw-p-6"
    >
      <SectionHeading id="verification">
        {t(locale, "museum.onchain.verification.heading")}
      </SectionHeading>
      <div className="tw-mt-3 tw-max-w-3xl tw-space-y-3 tw-text-base tw-leading-7 tw-text-iron-200">
        {LEAD_KEYS.map((key) => (
          <p key={key} className="tw-m-0">
            {t(locale, key)}
          </p>
        ))}
      </div>
      <p className="tw-m-0 tw-mt-5 tw-text-lg tw-font-medium tw-text-iron-50">
        {t(locale, "museum.onchain.verification.records", {
          verified: formatCount(snapshot.counts.verified),
          total: formatCount(total),
        })}
      </p>
      {snapshot.source === "fixture" ? (
        <p className="tw-m-0 tw-mt-1 tw-text-sm tw-text-yellow-100">
          {t(locale, "museum.onchain.verification.fixture")}
        </p>
      ) : (
        <p className="tw-m-0 tw-mt-1 tw-text-sm tw-text-iron-400">
          {t(locale, "museum.onchain.verification.block", {
            block: formatCount(blockNumber),
            date: formatUtcDateTime(blockTimestamp),
          })}{" "}
          <a
            href={`${ETHERSCAN}/block/${blockNumber}`}
            rel="noreferrer"
            className={TEXT_LINK}
          >
            {t(locale, "museum.onchain.verification.blockLink", {
              block: formatCount(blockNumber),
            })}
          </a>
        </p>
      )}
      <ul className="tw-m-0 tw-mt-5 tw-grid tw-list-none tw-gap-2 tw-p-0 md:tw-grid-cols-2">
        <CheckRow
          passed={checks.codeHashMatches}
          label={t(locale, "museum.onchain.check.codeHash", {
            tag: ONCHAIN_MUSEUM_SOURCE.build.tag,
          })}
        />
        <CheckRow
          passed={checks.supportsRegistryInterface && checks.erc165Conforms}
          label={t(locale, "museum.onchain.check.interface")}
        />
        <CheckRow
          passed={checks.ownerMatches}
          label={t(locale, "museum.onchain.check.owner")}
        />
        <CheckRow
          passed={snapshot.declaration.state === "verified"}
          label={t(locale, "museum.onchain.check.declaration")}
        />
        <CheckRow
          passed={snapshot.expected.matches}
          label={t(
            locale,
            snapshot.expected.releases === 1
              ? "museum.onchain.check.expectedOne"
              : "museum.onchain.check.expected",
            {
              records: formatCount(snapshot.expected.records),
              releases: formatCount(snapshot.expected.releases),
            }
          )}
        />
        {index.state === "absent" ? null : (
          <CheckRow
            passed={
              index.state === "verified" && index.cidMismatches.length === 0
            }
            label={t(locale, "museum.onchain.check.fileIndex", {
              count: formatCount(index.fileCount),
            })}
          />
        )}
      </ul>
      {checks.frozen ? (
        <p className="tw-m-0 tw-mt-3 tw-text-sm tw-text-iron-300">
          {t(locale, "museum.onchain.check.frozen")}
        </p>
      ) : null}
      {failures > 0 ? (
        <p className="tw-m-0 tw-mt-4 tw-text-sm tw-text-yellow-100">
          {t(locale, "museum.onchain.verification.failures", {
            count: formatCount(failures),
          })}
        </p>
      ) : null}
      <div className="tw-mt-5">
        <FactList
          facts={[
            {
              label: t(locale, "museum.onchain.verification.registry"),
              value: (
                <CopyValue
                  value={registry}
                  field={t(locale, "museum.onchain.verification.registry")}
                  href={`${ETHERSCAN}/address/${registry}`}
                />
              ),
            },
          ]}
        />
      </div>
      <Declaration view={view} />
    </section>
  );
}
