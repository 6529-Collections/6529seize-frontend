"use client";

import LinkIcon from "@/components/user/utils/icons/LinkIcon";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { collapseProtocolPrefix } from "../../utils/statement-input.utils";

const INPUT_CLASS_NAME =
  "tw-form-input tw-block tw-w-full tw-appearance-none tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900 tw-py-3 tw-pl-11 tw-pr-3 tw-text-base tw-font-normal tw-text-iron-100 tw-caret-primary-400 tw-shadow-sm tw-transition tw-duration-300 tw-ease-out placeholder:tw-text-iron-400 hover:tw-ring-iron-700 focus:tw-bg-iron-950 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-iron-700 sm:tw-leading-6";

export default function UserPageIdentityAddStatementsCustomLinkFields({
  label,
  url,
  showLabelError,
  onLabelChange,
  onUrlChange,
}: {
  readonly label: string;
  readonly url: string;
  readonly showLabelError: boolean;
  readonly onLabelChange: (label: string) => void;
  readonly onUrlChange: (url: string) => void;
}) {
  const locale = useBrowserLocale();

  return (
    <div className="tw-space-y-4">
      <div>
        <label
          htmlFor="custom-art-link-label"
          className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-iron-200"
        >
          {t(locale, "user.profile.identity.statements.customLinkLabel")}
        </label>
        <div className="tw-relative tw-mt-1.5">
          <div className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-left-0 tw-flex tw-items-center tw-pl-3">
            <div className="tw-flex tw-h-5 tw-w-5 tw-flex-shrink-0 tw-items-center">
              <LinkIcon />
            </div>
          </div>
          <input
            id="custom-art-link-label"
            type="text"
            required
            maxLength={40}
            autoComplete="off"
            value={label}
            onChange={(event) => onLabelChange(event.target.value)}
            aria-invalid={showLabelError || undefined}
            aria-describedby={
              showLabelError ? "custom-art-link-label-error" : undefined
            }
            placeholder={t(
              locale,
              "user.profile.identity.statements.customLinkLabelPlaceholder"
            )}
            className={INPUT_CLASS_NAME}
          />
        </div>
        {showLabelError && (
          <p
            id="custom-art-link-label-error"
            role="alert"
            className="tw-text-red-400 tw-mb-0 tw-mt-2 tw-text-xs tw-leading-5"
          >
            {t(
              locale,
              "user.profile.identity.statements.customLinkLabelRequired"
            )}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="custom-art-link-url"
          className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-iron-200"
        >
          {t(locale, "user.profile.identity.statements.customLinkUrl")}
        </label>
        <div className="tw-relative tw-mt-1.5">
          <div className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-left-0 tw-flex tw-items-center tw-pl-3">
            <div className="tw-flex tw-h-5 tw-w-5 tw-flex-shrink-0 tw-items-center">
              <LinkIcon />
            </div>
          </div>
          <input
            id="custom-art-link-url"
            type="url"
            inputMode="url"
            required
            pattern="https://.*"
            maxLength={2048}
            autoComplete="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={url}
            onChange={(event) => {
              const nativeEvent = event.nativeEvent as {
                isComposing?: boolean | undefined;
              };
              onUrlChange(
                nativeEvent.isComposing
                  ? event.target.value
                  : collapseProtocolPrefix(event.target.value)
              );
            }}
            placeholder={t(
              locale,
              "user.profile.identity.statements.customLinkUrlPlaceholder"
            )}
            aria-describedby="custom-art-link-hint"
            className={INPUT_CLASS_NAME}
          />
        </div>
        <p
          id="custom-art-link-hint"
          className="tw-mb-0 tw-mt-2 tw-text-xs tw-leading-5 tw-text-iron-500"
        >
          {t(locale, "user.profile.identity.statements.customLinkHint")}
        </p>
      </div>
    </div>
  );
}
