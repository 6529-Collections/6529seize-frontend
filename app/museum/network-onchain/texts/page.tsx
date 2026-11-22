import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { compareLocalized } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  buildOnchainMuseumIndex,
  groupOnchainTexts,
  ONCHAIN_MUSEUM_BASE_PATH,
} from "@/lib/museum/onchain/presentation";
import { getOnchainMuseum } from "@/lib/museum/onchain/runtime.server";
import { onchainMuseumMetadata } from "../_components/metadata";
import {
  formatCount,
  PageHeading,
  RecordList,
  TEXT_LINK,
} from "../_components/OnchainParts";
import { OnchainUnavailable } from "../_components/OnchainUnavailable";

const locale = DEFAULT_LOCALE;

export const metadata: Metadata = onchainMuseumMetadata(
  t(locale, "museum.onchain.texts.title"),
  t(locale, "museum.onchain.texts.description")
);

export default async function OnchainMuseumTextsPage() {
  await connection();
  const state = await getOnchainMuseum();
  if (state.status !== "ready") return <OnchainUnavailable />;
  const index = buildOnchainMuseumIndex(state.snapshot, (left, right) =>
    compareLocalized(locale, left, right)
  );
  const groups = groupOnchainTexts(index.texts);

  return (
    <>
      <p className="tw-m-0 tw-mb-6 tw-text-sm">
        <Link href={ONCHAIN_MUSEUM_BASE_PATH} className={TEXT_LINK}>
          {t(locale, "museum.onchain.record.backToIndex")}
        </Link>
      </p>
      <PageHeading
        eyebrow={t(locale, "museum.onchain.eyebrow")}
        title={t(locale, "museum.onchain.texts.heading")}
        intro={t(locale, "museum.onchain.texts.summary", {
          count: formatCount(index.texts.length),
        })}
      />
      {groups.map((group) => {
        const id = `onchain-texts-${group.key === "" ? "root" : group.key}`;
        return (
          <section key={group.key} aria-labelledby={id} className="tw-mb-10">
            <h2
              id={id}
              className="tw-m-0 tw-mb-2 tw-break-words tw-font-mono tw-text-lg tw-font-semibold tw-text-iron-50"
            >
              {group.key === ""
                ? t(locale, "museum.onchain.texts.root")
                : `${group.key}/`}{" "}
              <span className="tw-font-sans tw-text-sm tw-font-normal tw-text-iron-400">
                ({formatCount(group.records.length)})
              </span>
            </h2>
            <RecordList records={group.records} labelledBy={id} showPath />
          </section>
        );
      })}
    </>
  );
}
