import { useId } from "react";

import {
  FIELD_ERROR,
  FIELD_INPUT,
} from "@/components/stream/federated/formStyles";
import {
  CUSTOM_LICENSE,
  editionNameOf,
  editionSymbolOf,
  FORMS,
  LICENSE_CHOICES,
  type LaunchDetails,
  type LaunchErrors,
  type LaunchField,
} from "@/components/stream/federated/launchForm";
import { STREAM_HELP, STREAM_LABEL } from "@/components/stream/ui/styles";
import type { SupportedLocale } from "@/i18n/locales";
import { type MessageKey, t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";
import type { FederatedForm } from "@/lib/stream/types";

/** The launch wizard's inputs: step 1 (the form) and step 3 (name, symbol, license). */

function TextField({
  field,
  label,
  value,
  placeholder,
  help,
  error,
  uppercase = false,
  onChange,
  locale,
}: {
  readonly field: LaunchField;
  readonly label: string;
  readonly value: string;
  readonly placeholder?: string | undefined;
  readonly help?: string;
  readonly error: MessageKey | undefined;
  readonly uppercase?: boolean;
  readonly onChange: (value: string) => void;
  readonly locale: SupportedLocale;
}) {
  const id = useId();
  const inputId = `${id}-${field}`;
  const describedBy = [
    help === undefined ? null : `${id}-help`,
    error === undefined ? null : `${id}-error`,
  ]
    .filter((part) => part !== null)
    .join(" ");
  return (
    <div>
      <label htmlFor={inputId} className={STREAM_LABEL}>
        {label}
      </label>
      <input
        id={inputId}
        name={field}
        type="text"
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        onChange={(event) =>
          onChange(
            uppercase ? event.target.value.toUpperCase() : event.target.value
          )
        }
        aria-invalid={error !== undefined}
        aria-describedby={describedBy === "" ? undefined : describedBy}
        className={FIELD_INPUT}
      />
      {help === undefined ? null : (
        <p id={`${id}-help`} className={`${STREAM_HELP} tw-mt-1`}>
          {help}
        </p>
      )}
      {error === undefined ? null : (
        <p id={`${id}-error`} className={FIELD_ERROR}>
          {t(locale, error)}
        </p>
      )}
    </div>
  );
}

/** Step 1: 721, 1155 or a linked pair, one plain line each. */
export function FormChoice({
  form,
  onChange,
  showError,
  locale,
}: {
  readonly form: FederatedForm | null;
  readonly onChange: (form: FederatedForm) => void;
  readonly showError: boolean;
  readonly locale: SupportedLocale;
}) {
  const id = useId();
  return (
    <fieldset
      className="tw-m-0 tw-border-0 tw-p-0"
      aria-describedby={showError ? `${id}-error` : undefined}
    >
      <legend className="tw-sr-only">
        {t(locale, "stream.launch.step.form.title")}
      </legend>
      <div className="tw-flex tw-flex-col tw-gap-2">
        {FORMS.map((option) => (
          <label
            key={option}
            className={`tw-flex tw-cursor-pointer tw-items-start tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-p-3 ${form === option ? "tw-border-primary-400 tw-bg-primary-500/10" : "tw-border-iron-800 hover:tw-border-iron-600"}`}
          >
            <input
              type="radio"
              name={`${id}-form`}
              value={option}
              checked={form === option}
              onChange={() => onChange(option)}
              className="tw-mt-1 tw-size-4 tw-flex-none tw-accent-primary-500"
            />
            <span className="tw-min-w-0">
              <span className="tw-block tw-text-sm tw-font-semibold tw-text-iron-50">
                {t(locale, `stream.federated.form.${option}`)}
              </span>
              <span className="tw-block tw-text-sm tw-text-iron-300">
                {t(locale, `stream.launch.form.${option}`)}
              </span>
            </span>
          </label>
        ))}
      </div>
      {showError ? (
        <p id={`${id}-error`} className={`${FIELD_ERROR} tw-mt-2`}>
          {t(locale, "stream.launch.form.error")}
        </p>
      ) : null}
    </fieldset>
  );
}

function LicenseSelect({
  value,
  onChange,
  locale,
}: {
  readonly value: string;
  readonly onChange: (license: string) => void;
  readonly locale: SupportedLocale;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={`${id}-license`} className={STREAM_LABEL}>
        {t(locale, "stream.launch.details.license")}
      </label>
      <select
        id={`${id}-license`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={FIELD_INPUT}
      >
        {LICENSE_CHOICES.map((license) => (
          <option key={license} value={license}>
            {t(locale, `stream.launch.license.${license}`)}
          </option>
        ))}
        <option value={CUSTOM_LICENSE}>
          {t(locale, "stream.launch.license.custom")}
        </option>
      </select>
    </div>
  );
}

/** The editions half of a pair: blank fields take the derived defaults shown as placeholders. */
function EditionFields({
  details,
  errors,
  onChange,
  locale,
}: {
  readonly details: LaunchDetails;
  readonly errors: LaunchErrors;
  readonly onChange: (patch: Partial<LaunchDetails>) => void;
  readonly locale: SupportedLocale;
}) {
  const namePlaceholder =
    details.name.trim() === "" ? undefined : editionNameOf(details, locale);
  const symbolPlaceholder =
    details.symbol.trim() === "" ? undefined : editionSymbolOf(details);
  return (
    <>
      <TextField
        field="editionName"
        label={t(locale, "stream.launch.details.editionName")}
        value={details.editionName}
        placeholder={namePlaceholder}
        error={errors.editionName}
        onChange={(editionName) => onChange({ editionName })}
        locale={locale}
      />
      <TextField
        field="editionSymbol"
        label={t(locale, "stream.launch.details.editionSymbol")}
        value={details.editionSymbol}
        placeholder={symbolPlaceholder}
        error={errors.editionSymbol}
        uppercase
        onChange={(editionSymbol) => onChange({ editionSymbol })}
        locale={locale}
      />
    </>
  );
}

/** Step 3: name, symbol and license (and a pair's editions name and symbol). */
export function DetailsFields({
  form,
  details,
  errors,
  onChange,
  locale,
}: {
  readonly form: FederatedForm;
  readonly details: LaunchDetails;
  readonly errors: LaunchErrors;
  readonly onChange: (patch: Partial<LaunchDetails>) => void;
  readonly locale: SupportedLocale;
}) {
  return (
    <div className="tw-grid tw-gap-4 sm:tw-grid-cols-2">
      <TextField
        field="name"
        label={t(locale, "stream.launch.details.name")}
        value={details.name}
        error={errors.name}
        onChange={(name) => onChange({ name })}
        locale={locale}
      />
      <TextField
        field="symbol"
        label={t(locale, "stream.launch.details.symbol")}
        value={details.symbol}
        help={t(locale, "stream.launch.details.symbolHelp")}
        error={errors.symbol}
        uppercase
        onChange={(symbol) => onChange({ symbol })}
        locale={locale}
      />
      {form === "PAIR" ? (
        <EditionFields
          details={details}
          errors={errors}
          onChange={onChange}
          locale={locale}
        />
      ) : null}
      <LicenseSelect
        value={details.license}
        onChange={(license) => onChange({ license })}
        locale={locale}
      />
      {details.license === CUSTOM_LICENSE ? (
        <TextField
          field="customLicense"
          label={t(locale, "stream.launch.details.licenseId")}
          value={details.customLicense}
          placeholder={t(locale, "stream.launch.details.licenseIdPlaceholder")}
          help={t(locale, "stream.launch.details.licenseIdHelp")}
          error={errors.customLicense}
          onChange={(customLicense) => onChange({ customLicense })}
          locale={locale}
        />
      ) : null}
    </div>
  );
}
