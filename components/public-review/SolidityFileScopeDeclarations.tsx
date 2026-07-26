import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { SoliditySemanticIdentity } from "@/components/public-review/SoliditySemanticIdentity";
import type {
  SolidityParameter,
  SolidityTopLevelDeclaration,
} from "@/lib/public-review/solidityReferenceTypes";

interface DeclarationProperty {
  readonly label: string;
  readonly value: string;
}

function booleanLabel(value: boolean): string {
  return t(
    DEFAULT_LOCALE,
    value ? "publicReview.reference.yes" : "publicReview.reference.no"
  );
}

function indexedLabel(indexed: boolean | undefined): string | undefined {
  if (indexed === undefined) {
    return undefined;
  }
  return `${t(DEFAULT_LOCALE, "publicReview.reference.indexed")}: ${booleanLabel(
    indexed
  )}`;
}

function getParameterQualifier(parameter: SolidityParameter): string {
  return [parameter.storageLocation, indexedLabel(parameter.indexed)]
    .filter((value): value is string => value !== undefined)
    .join(" · ");
}

function ParameterList({
  label,
  parameters,
}: {
  readonly label: string;
  readonly parameters: readonly SolidityParameter[];
}) {
  if (parameters.length === 0) {
    return null;
  }
  return (
    <div className="tw-mt-4">
      <h4 className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-200">
        {label}
      </h4>
      <ul className="tw-mb-0 tw-mt-2 tw-list-none tw-space-y-1.5 tw-p-0">
        {parameters.map((parameter) => (
          <li
            key={`${parameter.index}:${parameter.name}:${parameter.type}`}
            className="tw-grid tw-gap-1 tw-rounded-lg tw-bg-black/30 tw-p-2.5 sm:tw-grid-cols-[minmax(8rem,1fr)_minmax(8rem,1fr)_auto]"
          >
            <code className="tw-break-all tw-text-xs tw-text-iron-100">
              {parameter.name || "—"}
            </code>
            <code className="tw-break-all tw-text-xs tw-text-sky-200">
              {parameter.type}
            </code>
            <span className="tw-text-xs tw-text-iron-400">
              {getParameterQualifier(parameter)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EnumMembers({ members }: { readonly members: readonly string[] }) {
  return (
    <div className="tw-mt-4">
      <h4 className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-200">
        {t(DEFAULT_LOCALE, "publicReview.reference.members")}
      </h4>
      <ol className="tw-mb-0 tw-mt-2 tw-flex tw-list-decimal tw-flex-wrap tw-gap-x-8 tw-gap-y-2 tw-pl-5">
        {members.map((member) => (
          <li key={member} className="tw-pl-1 tw-font-mono tw-text-sm">
            {member}
          </li>
        ))}
      </ol>
    </div>
  );
}

function Property({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div className="tw-min-w-0">
      <dt className="tw-text-[0.7rem] tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-500">
        {label}
      </dt>
      <dd className="tw-m-0 tw-mt-1 tw-break-all tw-font-mono tw-text-xs tw-text-iron-200">
        {value}
      </dd>
    </div>
  );
}

function getDeclarationTitle(
  declaration: SolidityTopLevelDeclaration
): string {
  if (
    declaration.kind === "function" ||
    declaration.kind === "event" ||
    declaration.kind === "error"
  ) {
    return declaration.canonicalSignature ?? declaration.displaySignature;
  }
  return declaration.name;
}

function getCommonProperties(
  declaration: SolidityTopLevelDeclaration
): DeclarationProperty[] {
  const properties: DeclarationProperty[] = [];
  if ("canonicalName" in declaration) {
    properties.push({
      label: t(DEFAULT_LOCALE, "publicReview.reference.canonicalName"),
      value: declaration.canonicalName,
    });
  }
  if ("selector" in declaration && declaration.selector) {
    properties.push({
      label: t(DEFAULT_LOCALE, "publicReview.reference.selector"),
      value: declaration.selector,
    });
  }
  if ("topic0" in declaration && declaration.topic0) {
    properties.push({
      label: t(DEFAULT_LOCALE, "publicReview.reference.topic"),
      value: declaration.topic0,
    });
  }
  if ("visibility" in declaration && declaration.visibility) {
    properties.push({
      label: t(DEFAULT_LOCALE, "publicReview.reference.visibility"),
      value: declaration.visibility,
    });
  }
  if ("stateMutability" in declaration) {
    properties.push({
      label: t(DEFAULT_LOCALE, "publicReview.reference.mutability"),
      value: declaration.stateMutability,
    });
  }
  return properties;
}

function getFunctionProperties(
  declaration: Extract<SolidityTopLevelDeclaration, { kind: "function" }>
): DeclarationProperty[] {
  const properties: DeclarationProperty[] = [
    {
      label: t(DEFAULT_LOCALE, "publicReview.reference.functionKind"),
      value: declaration.functionKind,
    },
  ];
  if (declaration.modifiers.length > 0) {
    properties.push({
        label: t(DEFAULT_LOCALE, "publicReview.reference.modifiers"),
        value: declaration.modifiers.join(", "),
    });
  }
  return properties;
}

function getVariableProperties(
  declaration: Extract<SolidityTopLevelDeclaration, { kind: "variable" }>
): DeclarationProperty[] {
  const properties: DeclarationProperty[] = [
    {
      label: t(DEFAULT_LOCALE, "publicReview.reference.type"),
      value: declaration.type,
    },
    {
      label: t(DEFAULT_LOCALE, "publicReview.reference.constant"),
      value: booleanLabel(declaration.constant),
    },
    {
      label: t(DEFAULT_LOCALE, "publicReview.reference.immutable"),
      value: booleanLabel(declaration.immutable),
    },
  ];
  if (declaration.typeString && declaration.typeString !== declaration.type) {
    properties.push({
      label: t(DEFAULT_LOCALE, "publicReview.reference.internalType"),
      value: declaration.typeString,
    });
  }
  if (declaration.storageLocation) {
    properties.push({
      label: t(DEFAULT_LOCALE, "publicReview.reference.storageLocation"),
      value: declaration.storageLocation,
    });
  }
  return properties;
}

function getSpecificProperties(
  declaration: SolidityTopLevelDeclaration
): DeclarationProperty[] {
  switch (declaration.kind) {
    case "function":
      return getFunctionProperties(declaration);
    case "event":
      return [
        {
      label: t(DEFAULT_LOCALE, "publicReview.reference.anonymous"),
          value: booleanLabel(declaration.anonymous),
        },
      ];
    case "userDefinedValueType":
      return [
      {
          label: t(DEFAULT_LOCALE, "publicReview.reference.underlyingType"),
          value: declaration.underlyingType,
      },
      ];
    case "variable":
      return getVariableProperties(declaration);
    case "error":
    case "struct":
    case "enum":
      return [];
  }
}

function DeclarationProperties({
  declaration,
}: {
  readonly declaration: SolidityTopLevelDeclaration;
}) {
  const properties = [
    ...getCommonProperties(declaration),
    ...getSpecificProperties(declaration),
  ];
  if (properties.length === 0) {
    return null;
  }
  return (
    <dl className="tw-mb-0 tw-mt-4 tw-grid tw-gap-3 sm:tw-grid-cols-2 xl:tw-grid-cols-3">
      {properties.map((property) => (
        <Property
          key={`${property.label}:${property.value}`}
          label={property.label}
          value={property.value}
        />
      ))}
    </dl>
  );
}

function DeclarationDetails({
  declaration,
}: {
  readonly declaration: SolidityTopLevelDeclaration;
}) {
  if (declaration.kind === "struct") {
    return (
      <ParameterList
        label={t(DEFAULT_LOCALE, "publicReview.reference.members")}
        parameters={declaration.members}
      />
    );
  }
  if (declaration.kind === "enum") {
    return <EnumMembers members={declaration.members} />;
  }
  if (
    declaration.kind === "function" ||
    declaration.kind === "event" ||
    declaration.kind === "error"
  ) {
    return (
      <>
        <ParameterList
          label={t(DEFAULT_LOCALE, "publicReview.reference.parameters")}
          parameters={declaration.inputs}
        />
        {declaration.kind === "function" ? (
          <ParameterList
            label={t(DEFAULT_LOCALE, "publicReview.reference.outputs")}
            parameters={declaration.outputs}
          />
        ) : null}
      </>
    );
  }
  if (declaration.kind === "variable" && declaration.valueSource) {
    return (
      <div className="tw-mt-4">
        <h4 className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-200">
          {t(DEFAULT_LOCALE, "publicReview.reference.initializer")}
        </h4>
        <code className="tw-mt-2 tw-block tw-whitespace-pre-wrap tw-break-words tw-rounded-lg tw-bg-black/40 tw-p-3 tw-text-xs tw-leading-5 tw-text-sky-100">
          {declaration.valueSource}
        </code>
      </div>
    );
  }
  return null;
}

function FileScopeDeclaration({
  declaration,
}: {
  readonly declaration: SolidityTopLevelDeclaration;
}) {
  return (
    <li className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/70 tw-p-4">
      <div className="tw-flex tw-flex-col tw-gap-3 lg:tw-flex-row lg:tw-items-start lg:tw-justify-between">
        <div className="tw-min-w-0">
          <span className="tw-inline-flex tw-rounded-full tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-2.5 tw-py-1 tw-text-[0.7rem] tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-300">
            {declaration.kind}
          </span>
          <h3 className="tw-m-0 tw-mt-3 tw-break-all tw-font-mono tw-text-base tw-font-semibold tw-text-white">
            {getDeclarationTitle(declaration)}
          </h3>
        </div>
        <a
          className="tw-shrink-0 tw-text-sm tw-text-sky-300 tw-no-underline hover:tw-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white"
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
      <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-300">
        {declaration.natspec ||
          t(DEFAULT_LOCALE, "publicReview.reference.noNatspec")}
      </p>
      <DeclarationProperties declaration={declaration} />
      <DeclarationDetails declaration={declaration} />
      <SoliditySemanticIdentity
        routeKey={declaration.key}
        semanticId={declaration.id}
      />
    </li>
  );
}

export function SolidityFileScopeDeclarations({
  declarations,
}: {
  readonly declarations: readonly SolidityTopLevelDeclaration[];
}) {
  if (declarations.length === 0) {
    return null;
  }
  return (
    <section
      aria-labelledby="solidity-file-scope-declarations"
      className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-5"
    >
      <h2
        id="solidity-file-scope-declarations"
        className="tw-m-0 tw-text-xl tw-font-semibold tw-text-white"
      >
        {t(DEFAULT_LOCALE, "publicReview.reference.fileScopeDeclarations")} (
        {formatInteger(DEFAULT_LOCALE, declarations.length)})
      </h2>
      <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-300">
        {t(
          DEFAULT_LOCALE,
          "publicReview.reference.fileScopeDeclarationsDescription"
        )}
      </p>
      <ul className="tw-mb-0 tw-mt-5 tw-list-none tw-space-y-3 tw-p-0">
        {declarations.map((declaration) => (
          <FileScopeDeclaration
            key={declaration.key}
            declaration={declaration}
          />
        ))}
      </ul>
    </section>
  );
}
