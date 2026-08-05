import Link from "next/link";

import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  getSolidityDefinitionHref,
  type SolidityReferenceHrefContext,
} from "@/lib/public-review/solidityReferenceRoutes";
import type {
  SolidityDefinitionShard,
  SolidityReferenceManifest,
} from "@/lib/public-review/solidityReferenceTypes";

const LINK_CLASSES =
  "tw-inline-flex tw-min-h-11 tw-items-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-2 tw-font-mono tw-text-sm tw-text-iron-100 tw-no-underline hover:tw-border-iron-500 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white";

function DefinitionLink({
  definitionId,
  hrefContext,
  manifest,
  name,
}: {
  readonly definitionId: string;
  readonly hrefContext: SolidityReferenceHrefContext;
  readonly manifest: SolidityReferenceManifest;
  readonly name: string;
}) {
  const definition = manifest.definitionIndex.find(
    (candidate) => candidate.id === definitionId
  );
  if (!definition) {
    return (
      <code className="tw-inline-flex tw-min-h-11 tw-items-center tw-rounded-lg tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-sm tw-text-iron-300">
        {name}
      </code>
    );
  }
  return (
    <Link
      className={LINK_CLASSES}
      href={getSolidityDefinitionHref({
        ...hrefContext,
        definitionKey: definition.key,
      })}
    >
      {name}
    </Link>
  );
}

export function SolidityInheritance({
  hrefContext,
  manifest,
  shard,
}: {
  readonly hrefContext: SolidityReferenceHrefContext;
  readonly manifest: SolidityReferenceManifest;
  readonly shard: SolidityDefinitionShard;
}) {
  return (
    <section
      aria-labelledby="definition-inheritance"
      className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-5"
    >
      <h2
        id="definition-inheritance"
        className="tw-m-0 tw-text-xl tw-font-semibold tw-text-white"
      >
        {t(DEFAULT_LOCALE, "publicReview.reference.inheritance")}
      </h2>
      <h3 className="tw-m-0 tw-mt-5 tw-text-base tw-font-semibold tw-text-iron-200">
        {t(DEFAULT_LOCALE, "publicReview.reference.directInheritance")}
      </h3>
      {shard.definition.inheritance.length === 0 ? (
        <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-text-iron-300">
          {t(DEFAULT_LOCALE, "publicReview.reference.noInheritance")}
        </p>
      ) : (
        <ul className="tw-mb-0 tw-mt-3 tw-flex tw-list-none tw-flex-wrap tw-gap-2 tw-p-0">
          {shard.definition.inheritance.map((parent) => (
            <li key={parent.definitionId}>
              <DefinitionLink
                definitionId={parent.definitionId}
                hrefContext={hrefContext}
                manifest={manifest}
                name={parent.name}
              />
            </li>
          ))}
        </ul>
      )}
      <details className="tw-mt-5 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-px-3">
        <summary className="tw-min-h-11 tw-cursor-pointer tw-py-3 tw-font-semibold tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white">
          {t(DEFAULT_LOCALE, "publicReview.reference.linearizedInheritance")}
        </summary>
        <p className="tw-mb-0 tw-mt-1 tw-text-sm tw-leading-6 tw-text-iron-400">
          {t(
            DEFAULT_LOCALE,
            "publicReview.reference.linearizedInheritanceDescription"
          )}
        </p>
        <ol className="tw-mb-3 tw-mt-3 tw-space-y-2 tw-pl-7">
          {shard.definition.linearizedDefinitionIds.map((definitionId) => {
            const definition = manifest.definitionIndex.find(
              (candidate) => candidate.id === definitionId
            );
            return (
              <li key={definitionId} className="tw-pl-1">
                <DefinitionLink
                  definitionId={definitionId}
                  hrefContext={hrefContext}
                  manifest={manifest}
                  name={definition?.name ?? definitionId}
                />
              </li>
            );
          })}
        </ol>
      </details>
    </section>
  );
}
