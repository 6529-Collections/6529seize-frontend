import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { ApiRateMatter } from "@/generated/models/ApiRateMatter";
import RepCategorySearch, {
  RepCategorySearchSize,
} from "@/components/utils/input/rep-category/RepCategorySearch";
import type { CreditDirection } from "../GroupCard";
import type { GroupCardRateMatter } from "../GroupCard";
import GroupCardActionNumberInput from "../utils/GroupCardActionNumberInput";

import { useRef, type JSX } from "react";
import useKeyboardFocusScroll from "@/components/waves/create-wave/hooks/useKeyboardFocusScroll";

// Match the Network filter dialog, including its 16px inputs on every viewport.
const COMPACT_INPUT_PRESENTATION_CLASSES = [
  "[&_input]:tw-text-base/6 [&_input~label]:tw-text-base/6",
  "[&_input]:tw-font-normal [&_input~label]:tw-font-normal",
  "[@media(min-width:1024px)_and_(pointer:fine)_and_(hover:hover)]:[&_input~label]:tw-text-sm/6",
  "[&_input.tw-form-input]:tw-bg-iron-900 [&_input.tw-form-input:focus]:tw-bg-iron-900",
  "desktop-hover:[&_input.tw-form-input:enabled:hover]:tw-bg-iron-800/80",
  "[&_input.tw-form-input:not([aria-invalid=true]):not(:focus)]:tw-ring-iron-700",
  "desktop-hover:[&_input.tw-form-input:not([aria-invalid=true]):not(:focus):enabled:hover]:tw-ring-iron-650",
  "[&_input.tw-form-input:not([aria-invalid=true]):focus]:tw-ring-1 [&_input.tw-form-input:not([aria-invalid=true]):focus]:tw-ring-primary-400",
  "[&_input.tw-form-input::placeholder]:tw-text-iron-500 [&_input:not(:focus)~label]:tw-text-iron-500",
  "[&_input:not([aria-invalid=true]):focus~label]:tw-text-primary-400",
  "[&_input:placeholder-shown:not(:focus)~label]:tw-bg-transparent",
  "[&_input+svg]:tw-size-4 [&_input+svg]:tw-top-1/2 [&_input+svg]:-tw-translate-y-1/2 [&_input+svg]:tw-text-iron-400",
].join(" ");

export default function GroupCardVoteAllInputs({
  matter,
  group,
  amountToAdd,
  category,
  creditDirection,
  setCategory,
  setAmountToAdd,
  setCreditDirection,
  compact = false,
}: {
  readonly matter: GroupCardRateMatter;
  readonly group: ApiGroupFull;
  readonly amountToAdd: number | null;
  readonly category: string | null;
  readonly creditDirection: CreditDirection;
  readonly setCategory: (category: string | null) => void;
  readonly setAmountToAdd: (amountToGive: number | null) => void;
  readonly setCreditDirection: (creditDirection: CreditDirection) => void;
  readonly compact?: boolean | undefined;
}) {
  const keyboardAwareRef = useRef<HTMLDivElement>(null);
  useKeyboardFocusScroll(keyboardAwareRef);
  const components: Record<GroupCardRateMatter, JSX.Element> = {
    [ApiRateMatter.Cic]: (
      <div
        ref={compact ? keyboardAwareRef : undefined}
        className={
          compact
            ? `tw-w-full sm:tw-max-w-64 ${COMPACT_INPUT_PRESENTATION_CLASSES}`
            : "tw-w-full xl:tw-max-w-[17.156rem]"
        }
      >
        <GroupCardActionNumberInput
          compact={compact}
          label="NIC"
          componentId={`${group.id}_nic`}
          amount={amountToAdd}
          creditDirection={creditDirection}
          setCreditDirection={setCreditDirection}
          setAmount={setAmountToAdd}
        />
      </div>
    ),
    [ApiRateMatter.Rep]: (
      <div
        ref={compact ? keyboardAwareRef : undefined}
        className={
          compact
            ? `tw-grid tw-w-full tw-min-w-0 tw-grid-cols-1 tw-gap-3 md:tw-grid-cols-[16rem_minmax(0,1fr)] ${COMPACT_INPUT_PRESENTATION_CLASSES}`
            : "tw-flex tw-w-full tw-flex-wrap tw-gap-x-4 tw-gap-y-4 sm:tw-flex-nowrap"
        }
      >
        <div className={compact ? "tw-min-w-0" : "tw-w-full md:tw-w-[58%]"}>
          <GroupCardActionNumberInput
            compact={compact}
            label="Rep"
            componentId={`${group.id}_rep`}
            amount={amountToAdd}
            creditDirection={creditDirection}
            setCreditDirection={setCreditDirection}
            setAmount={setAmountToAdd}
          />
        </div>
        <div
          className={
            compact
              ? "tw-min-w-0 md:tw-max-w-80 [&_button[aria-label]]:tw-right-0 [&_button[aria-label]]:tw-w-11 [&_button]:tw-min-h-11"
              : "tw-w-full md:tw-w-[42%]"
          }
        >
          <RepCategorySearch
            category={category}
            setCategory={setCategory}
            size={RepCategorySearchSize.SM}
            inputClassName={compact ? "tw-pr-11" : undefined}
          />
        </div>
      </div>
    ),
  };

  return components[matter];
}
