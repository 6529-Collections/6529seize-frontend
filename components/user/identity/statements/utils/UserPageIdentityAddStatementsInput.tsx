import { useEffect, useRef } from "react";
import {
  STATEMENT_INPUT_PLACEHOLDER,
  STATEMENT_TITLE,
  STATEMENT_TYPE,
} from "../../../../../helpers/Types";
import SocialStatementIcon from "../../../utils/icons/SocialStatementIcon";

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
    const newValue = event.target.value;
    onChange(newValue);
  };
  return (
    <>
      <label className="tw-block tw-text-sm tw-font-normal tw-leading-5 tw-text-[#B0B0B0]">
        {STATEMENT_TITLE[activeType]}
      </label>
      <div className="tw-relative tw-mt-2">
        <div className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-left-0 tw-flex tw-items-center tw-pl-3">
          <div className="tw-h-5 tw-w-5 tw-flex tw-items-center tw-flex-shrink-0">
            <SocialStatementIcon statementType={activeType} />
          </div>
        </div>
        <input
          ref={inputRef}
          type="text"
          required
          autoComplete="off"
          value={value}
          onChange={handleInputChange}
          placeholder={STATEMENT_INPUT_PLACEHOLDER[activeType]}
          className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-pl-10 tw-pr-3 tw-bg-white/5 tw-text-white tw-font-medium tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-white/10 placeholder:tw-text-neutral-500 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset hover:tw-ring-neutral-700 focus:tw-ring-primary-300 tw-text-base sm:tw-leading-6 tw-transition tw-duration-300 tw-ease-out"
        />
      </div>
    </>
  );
}
