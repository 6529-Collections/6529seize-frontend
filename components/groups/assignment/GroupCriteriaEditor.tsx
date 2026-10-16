"use client";

import { useId, useLayoutEffect, useRef, type ReactNode } from "react";
import clsx from "clsx";
import { CheckIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import type { ApiCreateGroup } from "@/generated/models/ApiCreateGroup";
import Button from "@/components/utils/button/Button";
import useKeyboardFocusScroll from "@/components/waves/create-wave/hooks/useKeyboardFocusScroll";
import {
  CREATE_WAVE_INLINE_GROUP_QUICK_RULES,
  CREATE_WAVE_INLINE_GROUP_MORE_RULES,
  CreateWaveInlineGroupRuleType,
  getInlineGroupConfiguredRules,
} from "@/components/waves/create-wave/groups/createWaveInlineGroupBuilder";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t, type MessageKey } from "@/i18n/messages";

const RULE_LABELS: Record<CreateWaveInlineGroupRuleType, MessageKey> = {
  [CreateWaveInlineGroupRuleType.LEVEL]: "network.groupFilter.level",
  [CreateWaveInlineGroupRuleType.TDH]: "network.groupFilter.tdh",
  [CreateWaveInlineGroupRuleType.CIC]: "network.groupFilter.nic",
  [CreateWaveInlineGroupRuleType.REP]: "network.groupFilter.rep",
  [CreateWaveInlineGroupRuleType.NFTS]: "network.groupFilter.nfts",
  [CreateWaveInlineGroupRuleType.COLLECTIONS]:
    "network.groupFilter.collections",
  [CreateWaveInlineGroupRuleType.XTDH_GRANT]: "network.groupFilter.xtdhGrant",
};

export type GroupCriteriaView = CreateWaveInlineGroupRuleType | "identities";
const FILTER_VIEWS: readonly GroupCriteriaView[] = [
  "identities",
  ...CREATE_WAVE_INLINE_GROUP_QUICK_RULES,
  ...CREATE_WAVE_INLINE_GROUP_MORE_RULES,
];

// Keep shared controls intact and retain the dialog's 16px touch-input sizing.
const FILTER_INPUT_PRESENTATION_CLASS_NAME = [
  "[&_input]:tw-text-base/6 [&_textarea]:tw-text-base/6 [&_select]:tw-text-base/6 [&_input~label]:tw-text-base/6",
  "[&_input]:tw-font-normal [&_textarea]:tw-font-normal [&_select]:tw-font-normal [&_input~label]:tw-font-normal",
  "[@media(min-width:1024px)_and_(pointer:fine)_and_(hover:hover)]:[&_input]:tw-text-sm/6",
  "[@media(min-width:1024px)_and_(pointer:fine)_and_(hover:hover)]:[&_textarea]:tw-text-sm/6",
  "[@media(min-width:1024px)_and_(pointer:fine)_and_(hover:hover)]:[&_select]:tw-text-sm/6",
  "[@media(min-width:1024px)_and_(pointer:fine)_and_(hover:hover)]:[&_input~label]:tw-text-sm/6",
  "[&_input.tw-form-input]:tw-bg-iron-950 [&_input.tw-form-input:focus]:tw-bg-iron-950",
  "desktop-hover:[&_input.tw-form-input:enabled:hover]:tw-bg-iron-950",
  "[&_input.tw-form-input~label]:tw-bg-iron-950 [&_input.tw-form-input:focus~label]:tw-bg-iron-950",
  // Keep invalid outlines and disabled controls owned by the shared input.
  "[&_input.tw-form-input:not([aria-invalid=true]):not(:focus)]:tw-ring-white/5",
  "desktop-hover:[&_input.tw-form-input:not([aria-invalid=true]):not(:focus):enabled:hover]:!tw-ring-white/10",
  "[&_input.tw-form-input:not([aria-invalid=true]):focus]:tw-ring-1 [&_input.tw-form-input:not([aria-invalid=true]):focus]:tw-ring-primary-400",
  "[&_input.tw-form-input::placeholder]:tw-text-iron-500 [&_input:not(:focus)~label]:tw-text-iron-500",
  "[&_input:not([aria-invalid=true]):focus~label]:tw-text-primary-400",
  "[&_input:placeholder-shown:not(:focus)~label]:tw-bg-transparent",
  // Each editor places its decorative search icon immediately after the input.
  "[&_input+svg]:tw-size-4 [&_input+svg]:tw-top-1/2 [&_input+svg]:-tw-translate-y-1/2 [&_input+svg]:tw-text-iron-400",
].join(" ");

export default function GroupCriteriaEditor({
  draft,
  view,
  onViewChange,
  disabled = false,
  scrollWithin = false,
  mobileNavigation = false,
  label,
  onClose,
  children,
}: {
  readonly draft: ApiCreateGroup;
  readonly view: GroupCriteriaView | null;
  readonly onViewChange: (view: GroupCriteriaView) => void;
  readonly disabled?: boolean;
  readonly scrollWithin?: boolean;
  readonly mobileNavigation?: boolean;
  readonly label?: string;
  readonly onClose?: (() => void) | undefined;
  readonly children: ReactNode;
}) {
  const locale = useBrowserLocale();
  const editorId = useId();
  const editorRef = useRef<HTMLElement>(null);
  const navigationRef = useRef<HTMLFieldSetElement>(null);
  const lastView = useRef<GroupCriteriaView | null>(null);
  useLayoutEffect(() => {
    if (!mobileNavigation) return;
    if (view !== null) {
      editorRef.current?.focus({ preventScroll: true });
      return;
    }
    if (lastView.current === null) return;
    const choice = navigationRef.current?.querySelector<HTMLButtonElement>(
      `[data-criterion="${lastView.current}"]`
    );
    choice?.focus({ preventScroll: true });
    choice?.scrollIntoView({ block: "nearest" });
  }, [mobileNavigation, view]);
  useKeyboardFocusScroll(editorRef, scrollWithin ? "nearest" : "center");
  const configuredRules = new Set(getInlineGroupConfiguredRules(draft));
  const identitiesConfigured =
    (draft.group.identity_addresses?.length ?? 0) > 0 ||
    (draft.group.excluded_identity_addresses?.length ?? 0) > 0;
  const changeView = (next: GroupCriteriaView, focusEditor: boolean) => {
    lastView.current = next;
    onViewChange(next);
    if (editorRef.current) {
      editorRef.current.scrollTop = 0;
    }
    if (focusEditor && !mobileNavigation) {
      globalThis.requestAnimationFrame(() => editorRef.current?.focus());
    }
  };

  const configuredMark = (
    <>
      <CheckIcon
        className="tw-size-3 tw-shrink-0 tw-text-success"
        aria-hidden="true"
      />
      <span className="tw-sr-only">
        {t(locale, "waves.create.groups.rules.configured")}
      </span>
    </>
  );

  return (
    <div className="tw-flex tw-min-h-0 tw-min-w-0 tw-flex-1 tw-flex-col">
      {onClose && view !== null && (
        <div className="tw-flex tw-justify-end">
          <Button variant="secondary" size="xs" onClick={onClose}>
            {t(locale, "common.close")}
          </Button>
        </div>
      )}
      <fieldset
        disabled={disabled}
        className={`tw-m-0 tw-flex tw-min-h-0 tw-min-w-0 tw-flex-1 tw-flex-col tw-border-0 tw-p-0 ${mobileNavigation ? "" : "lg:tw-flex-row"} ${FILTER_INPUT_PRESENTATION_CLASS_NAME}`}
      >
        <fieldset
          ref={navigationRef}
          hidden={mobileNavigation && view !== null}
          aria-label={label ?? t(locale, "waves.create.groups.criteriaLabel")}
          className={clsx(
            mobileNavigation &&
              "tw-m-0 tw-min-h-0 tw-flex-1 tw-flex-col tw-overflow-y-auto tw-overscroll-contain tw-border-0 tw-p-0 tw-scrollbar-thin tw-scrollbar-track-transparent tw-scrollbar-thumb-iron-700/60",
            mobileNavigation && (view === null ? "tw-flex" : "tw-hidden"),
            !mobileNavigation &&
              "tw-m-0 tw-flex tw-min-h-0 tw-min-w-0 tw-shrink-0 tw-flex-nowrap tw-gap-1 tw-overflow-x-auto tw-overscroll-x-contain tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/5 tw-py-1 tw-scrollbar-thin tw-scrollbar-track-transparent tw-scrollbar-thumb-iron-700/60 lg:tw-flex-col lg:tw-overflow-y-auto lg:tw-overflow-x-hidden lg:tw-border-b-0",
            !mobileNavigation &&
              (scrollWithin
                ? "tw-px-4 sm:tw-px-6 lg:tw-w-52 lg:tw-py-5"
                : "tw-px-0 lg:tw-w-44 lg:tw-self-start lg:tw-py-0 lg:tw-pr-4")
          )}
        >
          {FILTER_VIEWS.map((rule) => (
            <button
              key={rule}
              data-criterion={rule}
              id={`${editorId}-${rule}`}
              type="button"
              aria-current={view === rule ? "true" : undefined}
              aria-controls={editorId}
              data-configured={
                (rule === "identities"
                  ? identitiesConfigured
                  : configuredRules.has(rule)) || undefined
              }
              onClick={(event) => changeView(rule, event.detail === 0)}
              className={clsx(
                "tw-flex tw-shrink-0 tw-items-center tw-text-left focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:-tw-outline-offset-2 focus-visible:tw-outline-primary-400",
                mobileNavigation &&
                  "tw-min-h-14 tw-justify-between tw-gap-3 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/5 tw-bg-transparent tw-px-4 tw-py-3 tw-text-base tw-font-medium tw-text-iron-100 active:tw-bg-white/5 sm:tw-px-6",
                !mobileNavigation &&
                  "tw-min-h-8 tw-whitespace-nowrap tw-rounded-md tw-border-0 tw-px-2.5 tw-py-1 tw-text-sm tw-transition-colors",
                !mobileNavigation &&
                  (view === rule
                    ? "tw-bg-white/5 tw-font-medium tw-text-iron-50"
                    : "tw-bg-transparent tw-font-normal tw-text-iron-400 desktop-hover:hover:tw-bg-white/[0.03] desktop-hover:hover:tw-text-iron-100")
              )}
            >
              <span className="tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-2">
                <span id={`${editorId}-${rule}-label`}>
                  {t(
                    locale,
                    rule === "identities"
                      ? "waves.create.groups.identities"
                      : RULE_LABELS[rule]
                  )}
                </span>
                {(rule === "identities"
                  ? identitiesConfigured
                  : configuredRules.has(rule)) && configuredMark}
              </span>
              {mobileNavigation && (
                <ChevronRightIcon
                  aria-hidden="true"
                  className="tw-size-5 tw-shrink-0 tw-text-iron-500"
                />
              )}
            </button>
          ))}
        </fieldset>
        <section
          id={editorId}
          ref={editorRef}
          aria-labelledby={
            view === null ? undefined : `${editorId}-${view}-label`
          }
          hidden={view === null}
          tabIndex={-1}
          className={`tw-min-h-0 tw-min-w-0 tw-py-4 ${mobileNavigation ? "" : "lg:tw-flex-1 lg:tw-border-y-0 lg:tw-border-l lg:tw-border-r-0 lg:tw-border-solid lg:tw-border-white/5"} ${scrollWithin ? "tw-flex-1 tw-overflow-y-auto tw-overscroll-contain tw-px-4 sm:tw-px-6 lg:tw-py-5" : "lg:tw-py-0 lg:tw-pl-6"}`}
        >
          {children}
        </section>
      </fieldset>
    </div>
  );
}
