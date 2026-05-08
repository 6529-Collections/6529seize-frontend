import type { ChangeEvent } from "react";
import { CREATE_WAVE_VALIDATION_ERROR } from "@/helpers/waves/create-wave.validation";
import VotingSettingBox, {
  getVotingSettingInputClasses,
} from "./VotingSettingBox";

export default function MaxVotesPerIdentityInput({
  value,
  errors,
  onChange,
}: {
  readonly value: number | null;
  readonly errors: CREATE_WAVE_VALIDATION_ERROR[];
  readonly onChange: (value: number | null) => void;
}) {
  const hasError = errors.includes(
    CREATE_WAVE_VALIDATION_ERROR.MAX_VOTES_PER_IDENTITY_PER_DROP_INVALID
  );
  const hasValue = value !== null && Number.isFinite(value);
  const inputId = "max-votes-per-identity-per-drop";
  const errorId = "max-votes-per-identity-per-drop-error";
  const helpId = "max-votes-per-identity-per-drop-help";

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.trim();
    if (!rawValue) {
      onChange(null);
      return;
    }

    onChange(Number(rawValue));
  };

  return (
    <VotingSettingBox
      errorId={errorId}
      errorMessage="Enter a whole number greater than 0."
      hasError={hasError}
      helpId={helpId}
      helpText={
        <>
          Optional. Leave blank to use each identity&apos;s full voting power.
          Set 1 for one identity = one vote.
        </>
      }
      inputId={inputId}
      label="Vote cap per identity"
    >
      <input
        type="number"
        min={1}
        step={1}
        value={hasValue ? value.toString() : ""}
        onChange={onInputChange}
        id={inputId}
        autoComplete="off"
        className={getVotingSettingInputClasses({ hasError, hasValue })}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${errorId} ${helpId}` : helpId}
      />
    </VotingSettingBox>
  );
}
