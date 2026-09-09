"use client";

import { useEffect, useRef } from "react";
import type { STATEMENT_TYPE } from "@/helpers/Types";
import { STATEMENT_META } from "@/helpers/Types";
import SocialStatementIcon from "@/components/user/utils/icons/SocialStatementIcon";
import { collapseProtocolPrefix } from "./statement-input.utils";

export default function UserPageIdentityAddStatementsContactInput({
  activeType,
  value,
  onChange,
  requireHttps = false,
}: {
  readonly activeType: STATEMENT_TYPE;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly requireHttps?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeType]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value: raw } = event.target;
    const nativeEvent = event.nativeEvent as {
      isComposing?: boolean | undefined;
    };
    const isComposing = Boolean(nativeEvent?.isComposing);
    onChange(isComposing ? raw : collapseProtocolPrefix(raw));
  };
  const inputId = `statement-${activeType}`;
  return (
    <>
      <label
        htmlFor={inputId}
        className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-iron-200"
      >
        {STATEMENT_META[activeType].title}
      </label>
      <div className="tw-relative tw-mt-1.5">
        <div className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-left-0 tw-flex tw-items-center tw-pl-3">
          <div className="tw-flex tw-h-5 tw-w-5 tw-flex-shrink-0 tw-items-center">
            <SocialStatementIcon statementType={activeType} />
          </div>
        </div>
        <input
          id={inputId}
          ref={inputRef}
          type={STATEMENT_META[activeType].canOpenStatement ? "url" : "text"}
          inputMode={
            STATEMENT_META[activeType].canOpenStatement ? "url" : undefined
          }
          required
          pattern={requireHttps ? "https://.*" : undefined}
          autoComplete={
            STATEMENT_META[activeType].canOpenStatement ? "url" : "off"
          }
          maxLength={
            STATEMENT_META[activeType].canOpenStatement ? 2048 : undefined
          }
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={value}
          onChange={handleInputChange}
          placeholder={STATEMENT_META[activeType].inputPlaceholder}
          className="tw-form-input tw-block tw-w-full tw-appearance-none tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900 tw-py-3 tw-pl-11 tw-pr-3 tw-text-base tw-font-normal tw-text-iron-100 tw-caret-primary-400 tw-shadow-sm tw-transition tw-duration-300 tw-ease-out placeholder:tw-text-iron-400 hover:tw-ring-iron-700 focus:tw-bg-iron-950 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-iron-700 sm:tw-leading-6"
        />
      </div>
    </>
  );
}
