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
        className="tw-block tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-100"
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
          className="tw-form-input tw-block tw-min-h-11 tw-w-full tw-appearance-none tw-rounded-lg tw-border-0 tw-bg-white/[0.025] tw-py-2.5 tw-pl-11 tw-pr-3 tw-text-base tw-font-normal tw-text-iron-50 tw-caret-primary-400 tw-shadow-none tw-ring-1 tw-ring-inset tw-ring-white/[0.08] tw-transition-colors tw-duration-150 placeholder:tw-text-iron-500 hover:tw-ring-white/15 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-inset focus:tw-ring-primary-400 motion-reduce:tw-transition-none sm:tw-text-sm [@media(any-pointer:coarse)]:tw-text-base"
        />
      </div>
    </>
  );
}
