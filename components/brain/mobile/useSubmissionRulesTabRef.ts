import { useCallback } from "react";
import { useOptionalHeaderContext } from "@/contexts/HeaderContext";

interface SubmissionRulesTabRefOptions {
  readonly active: boolean;
  readonly isApp?: boolean | undefined;
  readonly waveId?: string | undefined;
  readonly onButtonRef?:
    | ((element: HTMLButtonElement | null) => void)
    | undefined;
  readonly scrollIntoView: (element: HTMLButtonElement | null) => void;
}

/** Register the shell's rules action and focus it after requested navigation. */
export function useSubmissionRulesTabRef({
  active,
  isApp,
  waveId,
  onButtonRef,
  scrollIntoView,
}: SubmissionRulesTabRefOptions) {
  const consumeSubmissionRulesFocus =
    useOptionalHeaderContext()?.consumeSubmissionRulesFocus;

  return useCallback(
    (element: HTMLButtonElement | null) => {
      onButtonRef?.(element);
      if (active) {
        scrollIntoView(element);
        if (
          isApp &&
          element &&
          waveId &&
          consumeSubmissionRulesFocus?.(waveId)
        ) {
          element.focus();
        }
      }
    },
    [
      onButtonRef,
      active,
      scrollIntoView,
      consumeSubmissionRulesFocus,
      isApp,
      waveId,
    ]
  );
}
