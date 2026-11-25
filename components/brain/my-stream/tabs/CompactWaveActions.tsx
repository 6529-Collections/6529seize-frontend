"use client";

import IconButton from "@/components/utils/button/IconButton";
import { PHONE_WAVES_LAYOUT_QUERY } from "@/constants/waves-layout";

import type { CompactMenuItem } from "@/components/compact-menu";
import CommonDropdownItemsMobileWrapper from "@/components/utils/select/dropdown/CommonDropdownItemsMobileWrapper";
import { CheckIcon, EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import {
  createContext,
  Fragment,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type Ref,
  type RefObject,
  type SetStateAction,
} from "react";
import { createPortal } from "react-dom";

export const COMPACT_WAVE_ACTION_CLASSES =
  "tw-flex tw-min-h-12 tw-w-full tw-select-none tw-items-center tw-gap-x-4 tw-rounded-xl tw-border-0 tw-bg-iron-950 tw-p-4 tw-text-left tw-text-base tw-font-semibold tw-transition-colors tw-duration-200 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 active:tw-bg-iron-800 disabled:tw-cursor-not-allowed disabled:tw-opacity-60";

const PRIMARY_ACTIONS = ["wave-details", "search-messages", "wave-link"];
const ADMIN_ACTIONS = ["create-subwave"];
const HELP_ACTIONS = ["submission-help", "submit-work", "display-time-zone"];

function getPhoneActionGroups(items: readonly CompactMenuItem[]) {
  const ordered = (ids: readonly string[]) =>
    ids.flatMap((id) => items.filter((item) => item.id === id));
  const knownIds = new Set([
    ...PRIMARY_ACTIONS,
    ...HELP_ACTIONS,
    ...ADMIN_ACTIONS,
  ]);
  return [
    { id: "primary", items: ordered(PRIMARY_ACTIONS) },
    {
      id: "help",
      items: [
        ...ordered(HELP_ACTIONS),
        ...items.filter((item) => !knownIds.has(item.id)),
      ],
    },
    { id: "admin", items: ordered(ADMIN_ACTIONS) },
  ];
}

interface WaveActionMenu {
  readonly items: readonly CompactMenuItem[];
  readonly phone?: boolean | undefined;
  readonly renderAdditionalControls?:
    | ((select: (action: () => void) => void) => ReactNode)
    | undefined;
}
interface CompactWaveActionsProps extends WaveActionMenu {
  readonly triggerRef?: Ref<HTMLButtonElement> | undefined;
  readonly compactTrigger?: boolean | undefined;
}

function useActionSheetState() {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  return useMemo(
    () => ({ isOpen, setIsOpen, pendingAction, setPendingAction }),
    [isOpen, pendingAction]
  );
}
type ActionSheetState = ReturnType<typeof useActionSheetState>;
type RegisterMenu = Dispatch<SetStateAction<WaveActionMenu | null>>;
const WaveActionSheetContext = createContext<
  (ActionSheetState & { readonly setMenu: RegisterMenu }) | null
>(null);

/** Keep a phone sheet alive while its generic header becomes Main Stage. */
export function CompactWaveActionsProvider({
  children,
  returnFocusRef,
}: {
  readonly children: ReactNode;
  readonly returnFocusRef?: RefObject<HTMLButtonElement | null> | undefined;
}) {
  const state = useActionSheetState();
  const [menu, setMenu] = useState<WaveActionMenu | null>(null);
  const { setIsOpen, setPendingAction } = state;
  useEffect(() => {
    const query = globalThis.matchMedia(PHONE_WAVES_LAYOUT_QUERY);
    const onChange = (event: MediaQueryListEvent) => {
      if (!event.matches) {
        setIsOpen(false);
        setPendingAction(null);
        setMenu(null);
      }
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [setIsOpen, setPendingAction]);
  const value = useMemo(() => ({ ...state, setMenu }), [state]);
  return (
    <WaveActionSheetContext.Provider value={value}>
      {children}
      {menu && (
        <CompactWaveActionSheet state={state} returnFocusRef={returnFocusRef}>
          <CompactWaveActionItems {...menu} state={state} />
        </CompactWaveActionSheet>
      )}
    </WaveActionSheetContext.Provider>
  );
}

function CompactWaveActionSheet({
  state,
  children,
  returnFocusRef,
}: {
  readonly state: ActionSheetState;
  readonly children: ReactNode;
  readonly returnFocusRef?: RefObject<HTMLButtonElement | null> | undefined;
}) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <CommonDropdownItemsMobileWrapper
      isOpen={state.isOpen}
      setOpen={state.setIsOpen}
      label="More wave actions"
      hideOnDesktopHover={false}
      onAfterLeave={() => {
        state.setPendingAction(null);
        if (state.pendingAction) state.pendingAction();
        else if (returnFocusRef)
          requestAnimationFrame(() =>
            returnFocusRef.current?.focus({ preventScroll: true })
          );
      }}
    >
      {children}
    </CommonDropdownItemsMobileWrapper>,
    document.body
  );
}

function CompactWaveActionItems({
  items,
  phone = false,
  renderAdditionalControls,
  state,
}: WaveActionMenu & {
  readonly state: ActionSheetState;
}) {
  const { setIsOpen, setPendingAction } = state;
  const selectAfterClose = (action: () => void) => {
    setPendingAction(() => action);
    setIsOpen(false);
  };
  const additionalControls = renderAdditionalControls?.(selectAfterClose);

  const groups = (
    phone ? getPhoneActionGroups(items) : [{ id: "help", items }]
  ).filter(
    (group) =>
      group.items.length > 0 ||
      (group.id === "help" && Boolean(additionalControls))
  );

  const handleAction = (
    item: Exclude<CompactMenuItem, { readonly kind: "section" }>
  ) => {
    if (item.disabled) {
      return;
    }

    setIsOpen(false);
    if (item.deferUntilClosed) {
      setPendingAction(() => item.onSelect ?? null);
    } else {
      item.onSelect?.();
    }
  };

  return (
    <>
      {groups.map((group, index) => (
        <Fragment key={group.id}>
          {index > 0 && (
            <li
              role="separator"
              className="tw-mx-4 tw-my-1 tw-list-none tw-border-0 tw-border-t tw-border-solid tw-border-iron-800"
            />
          )}
          {group.id === "help" && Boolean(additionalControls) && (
            <li className="empty:tw-hidden">{additionalControls}</li>
          )}
          {group.items.map((item) => {
            if (item.kind === "section") {
              return (
                <li
                  key={item.id}
                  className={`tw-list-none tw-px-4 tw-pb-1 tw-pt-2 tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-wider tw-text-iron-500 ${item.className ?? ""}`}
                >
                  {item.label}
                </li>
              );
            }

            const stateClasses = item.active
              ? "tw-text-primary-300"
              : "tw-text-iron-300";
            const contents = (
              <>
                {item.icon !== undefined &&
                  item.icon !== null &&
                  item.icon !== false && (
                    <span className="tw-flex tw-size-5 tw-shrink-0 tw-items-center tw-justify-center">
                      {item.icon}
                    </span>
                  )}
                <span className="tw-flex-1">{item.label}</span>
                {item.checked && (
                  <CheckIcon
                    aria-hidden="true"
                    className="tw-size-5 tw-shrink-0 tw-text-primary-300"
                  />
                )}
              </>
            );
            const className = `${COMPACT_WAVE_ACTION_CLASSES} ${stateClasses} ${item.className ?? ""}`;

            return (
              <li key={item.id} className="tw-list-none">
                {item.href !== undefined && !item.disabled ? (
                  <Link
                    href={item.href}
                    role={item.role}
                    aria-selected={item.ariaSelected}
                    aria-label={item.ariaLabel}
                    data-compact-menu-item="true"
                    data-menu-item-id={item.id}
                    data-active={item.active ? "true" : "false"}
                    data-disabled="false"
                    data-testid={item["data-testid"]}
                    onClick={() => handleAction(item)}
                    className={className}
                  >
                    {contents}
                  </Link>
                ) : (
                  <button
                    type="button"
                    role={item.role}
                    aria-selected={item.ariaSelected}
                    aria-label={item.ariaLabel}
                    aria-pressed={item.checked}
                    disabled={item.disabled}
                    data-compact-menu-item="true"
                    data-menu-item-id={item.id}
                    data-active={item.active ? "true" : "false"}
                    data-disabled={item.disabled ? "true" : "false"}
                    data-testid={item["data-testid"]}
                    onClick={() => handleAction(item)}
                    className={className}
                  >
                    {contents}
                  </button>
                )}
              </li>
            );
          })}
        </Fragment>
      ))}
    </>
  );
}

function CompactWaveActionControl({
  items,
  phone = false,
  renderAdditionalControls,
  triggerRef,
  compactTrigger = false,
  state,
  registerMenu,
}: CompactWaveActionsProps & {
  readonly state: ActionSheetState;
  readonly registerMenu?: RegisterMenu | undefined;
}) {
  // Retain the previous menu during a header replacement. The wave-keyed owner
  // unmounts the sheet on navigation; the new header supplies current actions.
  useLayoutEffect(() => {
    registerMenu?.({ items, phone, renderAdditionalControls });
  }, [items, phone, renderAdditionalControls, registerMenu]);
  const toolbarLayout = compactTrigger ? "toolbar-compact" : "toolbar";
  return (
    <>
      <IconButton
        type="button"
        ref={triggerRef}
        aria-label="More wave actions"
        aria-haspopup="dialog"
        aria-expanded={state.isOpen}
        data-compact-wave-actions-trigger="true"
        onClick={() => state.setIsOpen(true)}
        size={phone ? 44 : undefined}
        layout={phone ? undefined : toolbarLayout}
      >
        <EllipsisVerticalIcon className="tw-size-5 tw-flex-shrink-0" />
      </IconButton>
      {!registerMenu && (
        <CompactWaveActionSheet state={state}>
          <CompactWaveActionItems
            items={items}
            phone={phone}
            renderAdditionalControls={renderAdditionalControls}
            state={state}
          />
        </CompactWaveActionSheet>
      )}
    </>
  );
}

function StandaloneWaveActions(props: CompactWaveActionsProps) {
  const state = useActionSheetState();
  return <CompactWaveActionControl {...props} state={state} />;
}

export default function CompactWaveActions(props: CompactWaveActionsProps) {
  const owner = useContext(WaveActionSheetContext);
  return props.phone && owner ? (
    <CompactWaveActionControl
      {...props}
      state={owner}
      registerMenu={owner.setMenu}
    />
  ) : (
    <StandaloneWaveActions {...props} />
  );
}
