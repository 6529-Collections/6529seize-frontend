import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type {
  SolidityOtherDeclaration,
  SolidityParameter,
} from "@/lib/public-review/solidityReferenceTypes";

function DeclarationProperties({
  declaration,
}: {
  readonly declaration: SolidityOtherDeclaration;
}) {
  const properties = [
    declaration.type
      ? `${t(DEFAULT_LOCALE, "publicReview.reference.type")}: ${declaration.type}`
      : undefined,
    declaration.underlyingType
      ? `${t(DEFAULT_LOCALE, "publicReview.reference.underlyingType")}: ${
          declaration.underlyingType
        }`
      : undefined,
    declaration.visibility
      ? `${t(DEFAULT_LOCALE, "publicReview.reference.visibility")}: ${
          declaration.visibility
        }`
      : undefined,
    declaration.constant
      ? t(DEFAULT_LOCALE, "publicReview.reference.constant")
      : undefined,
    declaration.immutable
      ? t(DEFAULT_LOCALE, "publicReview.reference.immutable")
      : undefined,
  ].filter((value): value is string => Boolean(value));
  if (properties.length === 0) {
    return null;
  }
  return (
    <ul className="tw-mb-0 tw-mt-3 tw-flex tw-list-none tw-flex-wrap tw-gap-2 tw-p-0">
      {properties.map((property) => (
        <li
          key={property}
          className="tw-rounded-full tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-2.5 tw-py-1 tw-font-mono tw-text-xs tw-text-iron-200"
        >
          {property}
        </li>
      ))}
    </ul>
  );
}

function DeclarationMembers({
  declarationName,
  members,
}: {
  readonly declarationName: string;
  readonly members:
    | readonly SolidityParameter[]
    | readonly string[]
    | undefined;
}) {
  if (!members || members.length === 0) {
    return null;
  }
  return (
    <div
      aria-label={t(
        DEFAULT_LOCALE,
        "publicReview.reference.declarationMembersTable",
        { declaration: declarationName }
      )}
      className="tw-mt-3 tw-overflow-x-auto focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white"
      role="region"
      tabIndex={0}
    >
      <table className="tw-w-full tw-border-collapse tw-text-left tw-text-sm">
        <thead>
          <tr className="tw-border-b tw-border-solid tw-border-iron-700 tw-text-xs tw-uppercase tw-tracking-wide tw-text-iron-500">
            <th className="tw-p-2">
              {t(DEFAULT_LOCALE, "publicReview.reference.name")}
            </th>
            <th className="tw-p-2">
              {t(DEFAULT_LOCALE, "publicReview.reference.type")}
            </th>
          </tr>
        </thead>
        <tbody>
          {members.map((member, index) => {
            const parameter = typeof member === "string" ? undefined : member;
            const name = typeof member === "string" ? member : member.name;
            return (
              <tr
                key={`${name}:${parameter?.index ?? index}`}
                className="tw-border-b tw-border-solid tw-border-iron-800"
              >
                <td className="tw-p-2 tw-font-mono tw-text-iron-100">
                  {name || "—"}
                </td>
                <td className="tw-p-2 tw-font-mono tw-text-iron-300">
                  {parameter?.type ?? "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function OtherDeclaration({
  declaration,
}: {
  readonly declaration: SolidityOtherDeclaration;
}) {
  return (
    <li className="tw-rounded-lg tw-bg-iron-900 tw-p-4">
      <div className="tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row sm:tw-items-start sm:tw-justify-between">
        <code className="tw-break-all tw-text-sm tw-text-iron-100">
          {declaration.name || "—"}
        </code>
        <a
          className="tw-text-xs tw-text-sky-300 tw-no-underline hover:tw-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white"
          href={declaration.range.githubUrl}
          rel="noreferrer"
          target="_blank"
        >
          {t(DEFAULT_LOCALE, "publicReview.reference.lines", {
            start: declaration.range.lineStart,
            end: declaration.range.lineEnd,
          })}
        </a>
      </div>
      <DeclarationProperties declaration={declaration} />
      {declaration.selector ? (
        <p className="tw-mb-0 tw-mt-3 tw-break-all tw-font-mono tw-text-xs tw-text-sky-200">
          {t(DEFAULT_LOCALE, "publicReview.reference.selector")}:{" "}
          {declaration.selector}
        </p>
      ) : null}
      <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-300">
        {declaration.natspec ||
          t(DEFAULT_LOCALE, "publicReview.reference.noNatspec")}
      </p>
      <DeclarationMembers
        declarationName={declaration.name || "—"}
        members={declaration.members}
      />
    </li>
  );
}

export function SolidityOtherDeclarationGroup({
  declarations,
  label,
}: {
  readonly declarations: readonly SolidityOtherDeclaration[];
  readonly label: string;
}) {
  if (declarations.length === 0) {
    return null;
  }
  return (
    <details className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-4">
      <summary className="tw-min-h-11 tw-cursor-pointer tw-py-2 tw-font-semibold tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white">
        {label} ({formatInteger(DEFAULT_LOCALE, declarations.length)})
      </summary>
      <ul className="tw-mb-0 tw-mt-4 tw-list-none tw-space-y-3 tw-p-0">
        {declarations.map((declaration) => (
          <OtherDeclaration
            key={`${declaration.name}:${declaration.range.byteStart}`}
            declaration={declaration}
          />
        ))}
      </ul>
    </details>
  );
}
