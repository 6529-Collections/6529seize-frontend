"use client";

import { useEffect, useRef } from "react";
import { STATEMENT_META, STATEMENT_TYPE } from "@/helpers/Types";
import SocialStatementIcon from "@/components/user/utils/icons/SocialStatementIcon";

export default function UserPageIdentityAddStatementsContactInput({
  activeType,
  value,
  onChange,
}: {
  readonly activeType: STATEMENT_TYPE;
  readonly value: string;
  readonly onChange: (value: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeType]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value: raw } = event.target;
    const nativeEvent = event.nativeEvent as { isComposing?: boolean };
    const isComposing = Boolean(nativeEvent?.isComposing);
    onChange(isComposing ? raw : collapseProtocolPrefix(raw));
  };
  const inputId = `statement-${activeType}`;
  return (
    <>
      <label
        htmlFor={inputId}
        className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-iron-200">
        {STATEMENT_META[activeType].title}
      </label>
      <div className="tw-relative tw-mt-1.5">
        <div className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-left-0 tw-flex tw-items-center tw-pl-3">
          <div className="tw-h-5 tw-w-5 tw-flex tw-items-center tw-flex-shrink-0">
            <SocialStatementIcon statementType={activeType} />
          </div>
        </div>
        <input
          id={inputId}
          ref={inputRef}
          type="text"
          required
          autoComplete="off"
          value={value}
          onChange={handleInputChange}
          placeholder={STATEMENT_META[activeType].inputPlaceholder}
          className="tw-form-input tw-appearance-none tw-block tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-py-3 tw-pl-11 tw-pr-3 tw-bg-iron-900 focus:tw-bg-iron-950 tw-text-iron-100 tw-font-normal tw-caret-primary-400 tw-shadow-sm hover:tw-ring-iron-700 placeholder:tw-text-iron-400 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-iron-700 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
        />
      </div>
    </>
  );
}

const COLLAPSE_PROTOCOL_PREFIX = /^(?:(https?):\/\/)+/i;

const collapseProtocolPrefix = (value: string): string =>
  value.replace(
    COLLAPSE_PROTOCOL_PREFIX,
    (_match, scheme: string) => `${scheme.toLowerCase()}://`
  );
