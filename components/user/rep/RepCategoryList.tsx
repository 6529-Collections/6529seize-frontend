"use client";

import { AuthContext } from "@/components/auth/Auth";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiRepCategory } from "@/generated/models/ApiRepCategory";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import clsx from "clsx";
import {
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import useIsTouchDevice from "@/hooks/useIsTouchDevice";
import RepCategoryDetails from "./RepCategoryDetails";
import RepCategoryPill from "./RepCategoryPill";
import {
  canShowPersonalRepContribution,
  type RepDirection,
} from "./UserPageRep.helpers";

type CategoryLayout = {
  readonly key: string;
  readonly end: number;
  readonly left: number;
  readonly width: number;
  readonly flushL: boolean;
  readonly flushR: boolean;
  readonly categories: readonly ApiRepCategory[];
  readonly visibleCount: number;
};

function JoinedCategoryPanel({
  joined,
  id,
  label,
  children,
}: {
  readonly joined: CategoryLayout | null;
  readonly id: string;
  readonly label: string;
  readonly children: ReactNode;
}) {
  return (
    <section
      hidden={!joined}
      id={id}
      aria-label={label}
      className={clsx(
        "tw-relative tw-min-w-0 tw-basis-full tw-rounded-xl tw-bg-[#17171B] tw-px-1.5 tw-pt-1.5",
        joined?.flushL && "tw-rounded-tl-none",
        joined?.flushR && "tw-rounded-tr-none"
      )}
    >
      <span
        aria-hidden="true"
        className="tw-pointer-events-none tw-absolute -tw-top-2 tw-h-2 tw-bg-[#17171B]"
        style={{ left: joined?.left, width: joined?.width }}
      >
        {joined && !joined.flushL && (
          <span className="tw-absolute tw-bottom-0 tw-right-full tw-size-2 tw-bg-[radial-gradient(circle_at_0_0,transparent_7.5px,#17171B_8px)]" />
        )}
        {joined && !joined.flushR && (
          <span className="tw-absolute tw-bottom-0 tw-left-full tw-size-2 tw-bg-[radial-gradient(circle_at_100%_0,transparent_7.5px,#17171B_8px)]" />
        )}
      </span>
      {children}
    </section>
  );
}

function getMoreLabel(
  locale: SupportedLocale,
  hidden: number,
  fetching: boolean
) {
  if (hidden > 0)
    return t(locale, "user.profile.rep.categories.more", {
      count: formatInteger(locale, hidden),
    });
  if (fetching) return t(locale, "user.profile.rep.categories.loadingMore");
  return t(locale, "user.profile.rep.categories.loadMore");
}

export default function RepCategoryList({
  profile,
  categories,
  direction,
  visibleCount,
  hasNextPage,
  isFetchingNextPage,
  onShowMore,
  onOpenGlobalCategory,
  mobile = false,
}: {
  readonly profile: ApiIdentity;
  readonly categories: readonly ApiRepCategory[];
  readonly direction: RepDirection;
  readonly visibleCount: number;
  readonly hasNextPage: boolean;
  readonly isFetchingNextPage: boolean;
  readonly onShowMore: () => void;
  readonly onOpenGlobalCategory: (category: string) => void;
  readonly mobile?: boolean;
}) {
  const locale = useBrowserLocale();
  const desktopViewport = useMediaQuery("(min-width: 1024px)");
  const isTouchDevice = useIsTouchDevice();
  const active = mobile ? !desktopViewport : desktopViewport;
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const panelId = useId();
  const [selection, setSelection] = useState<{
    category: string;
    order: readonly string[];
  } | null>(null);
  const open = selection?.category ?? null;
  const [busy, setBusy] = useState(false);
  const [layout, setLayout] = useState<CategoryLayout | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const category = categories.find((item) => item.category === open);
  // Refresh live amounts without moving the editor under a different tag.
  const orderedCategories = useMemo(() => {
    if (!selection || !category) return categories;
    const order = new Map(selection.order.map((name, index) => [name, index]));
    return categories.toSorted(
      (a, b) =>
        (order.get(a.category) ?? order.size) -
        (order.get(b.category) ?? order.size)
    );
  }, [categories, category, selection]);
  const visible = orderedCategories.slice(0, visibleCount);
  const hidden = Math.max(categories.length - visibleCount, 0);
  // Hide the panel from layout while measuring the natural tag rows.
  const joined =
    !mobile &&
    active &&
    layout?.key === open &&
    layout.categories === orderedCategories &&
    layout.visibleCount === visibleCount
      ? layout
      : null;
  useLayoutEffect(() => {
    if (!open || mobile || !active || joined) return;
    const list = listRef.current;
    if (!list || list.clientWidth === 0) return;
    const tags = Array.from(
      list.querySelectorAll<HTMLElement>("[data-rep-tag]")
    );
    const index = tags.findIndex((tag) => tag.dataset["repTag"] === open);
    const tag = tags[index];
    if (!tag) return;
    let end = index;
    while (tags[end + 1]?.offsetTop === tag.offsetTop) end++;
    setLayout({
      key: open,
      end,
      left: tag.offsetLeft,
      width: tag.offsetWidth,
      flushL: tag.offsetLeft < 1,
      flushR: Math.abs(tag.offsetLeft + tag.offsetWidth - list.clientWidth) < 1,
      categories: orderedCategories,
      visibleCount,
    });
  }, [open, mobile, active, joined, orderedCategories, visibleCount]);
  // This subscription invalidates measured geometry asynchronously on width changes.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    let width = list.clientWidth;
    const observer = new ResizeObserver(() => {
      if (list.clientWidth !== width) {
        width = list.clientWidth;
        setLayout(null);
      }
    });
    // eslint-disable-next-line react-you-might-not-need-an-effect/no-initialize-state -- Registering a ResizeObserver subscribes to later width changes; it does not initialize state.
    observer.observe(list);
    return () => observer.disconnect();
  }, []);
  const dismiss = () => {
    setSelection(null);
    trigger.current?.focus({ preventScroll: true });
  };
  const close = () => {
    if (!busy) dismiss();
  };
  const handleSaveSuccess = () => {
    if (mobile) dismiss();
  };
  useEffect(() => {
    if (!open || mobile || !active) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented && !busy) {
        event.preventDefault();
        setSelection(null);
        trigger.current?.focus({ preventScroll: true });
      }
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [open, mobile, active, busy]);
  const show = (name: string) => {
    if (busy) return;
    trigger.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    if (open === name) close();
    else
      setSelection({
        category: name,
        order:
          category && selection
            ? selection.order
            : categories.map((item) => item.category),
      });
  };
  const details =
    category && open ? (
      <RepCategoryDetails
        key={`${category.category}:${connectedProfile?.id ?? "visitor"}:${activeProfileProxy?.id ?? "self"}`}
        profile={profile}
        category={category}
        direction={direction}
        autoFocusOwnAmount={!mobile && active && joined !== null}
        busy={busy}
        onBusyChange={setBusy}
        onSuccess={handleSaveSuccess}
        onOpenGlobalCategory={(name) => {
          if (busy) return;
          if (mobile) close();
          onOpenGlobalCategory(name);
        }}
        renderContent={
          mobile
            ? (body, footer, resetOnEscape) => (
                <MobileWrapperDialog
                  id={panelId}
                  title={category.category}
                  titleActions={
                    <span className="tw-shrink-0 tw-text-sm tw-text-iron-400">
                      {formatInteger(locale, category.total_rep)}
                    </span>
                  }
                  isOpen={active}
                  keepMounted
                  onClose={close}
                  onEscape={() => {
                    if (!resetOnEscape()) close();
                  }}
                  busy={busy}
                  noPadding
                  showDragHandle
                  enableDragToClose
                  fitVisualViewport
                  surfaceClassName="tw-bg-[#17171B] [--mobile-wrapper-dialog-resting-height:88vh]"
                  headerClassName="tw-pb-2 tw-pt-2"
                  headerCloseButtonClassName="!tw-size-11"
                  focusTitleOnOpen
                  footer={<div className="tw-px-1.5">{footer}</div>}
                >
                  <div className="tw-px-1.5">{body}</div>
                </MobileWrapperDialog>
              )
            : undefined
        }
      />
    ) : null;
  const moreLabel = getMoreLabel(locale, hidden, isFetchingNextPage);
  const panelEnd = Math.min(
    joined?.end ?? layout?.end ?? visible.length - 1,
    visible.length - 1
  );
  const panel =
    !mobile && category ? (
      <JoinedCategoryPanel
        key="category-panel"
        joined={joined}
        id={panelId}
        label={t(locale, "rep.categories.panel.panel", {
          category: category.category,
        })}
      >
        {details}
      </JoinedCategoryPanel>
    ) : null;
  return (
    <>
      <div
        ref={mobile ? undefined : listRef}
        className={clsx(
          "tw-relative tw-flex tw-min-w-0 tw-flex-wrap tw-items-start",
          mobile ? "tw-w-full tw-gap-1.5" : "tw-gap-2"
        )}
      >
        {visible.flatMap((item, index) => [
          <RepCategoryPill
            key={`tag:${item.category}`}
            category={item}
            showPersonalContribution={canShowPersonalRepContribution(
              profile,
              activeProfileProxy?.created_by ?? connectedProfile
            )}
            direction={direction}
            linkAvatars={!isTouchDevice}
            onOpenContributors={(selected) => show(selected.category)}
            compact={mobile}
            isOpen={open === item.category}
            isJoined={joined?.key === item.category}
            panelId={panelId}
            disabled={busy}
          />,
          // One stable key preserves drafts when the panel moves on resize.
          index === panelEnd ? panel : null,
        ])}
        {(hidden > 0 || hasNextPage) && (
          <button
            type="button"
            onClick={onShowMore}
            disabled={isFetchingNextPage && hidden === 0}
            className="tw-min-h-11 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-2 tw-text-sm tw-text-iron-400 hover:tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 disabled:tw-opacity-50 lg:tw-min-h-9"
          >
            {moreLabel}
          </button>
        )}
      </div>
      {mobile && category && details}
    </>
  );
}
