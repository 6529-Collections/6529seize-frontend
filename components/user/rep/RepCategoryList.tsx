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
  useRef,
  useState,
} from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import RepCategoryDetails from "./RepCategoryDetails";
import RepCategoryPill from "./RepCategoryPill";
import type { RepDirection } from "./UserPageRep.helpers";

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
  const active = mobile ? !desktopViewport : desktopViewport;
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const panelId = useId();
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [layout, setLayout] = useState<CategoryLayout | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const category = categories.find((item) => item.category === open);
  const visible = categories.slice(0, visibleCount);
  const hidden = Math.max(categories.length - visibleCount, 0);
  // Hide the panel from layout while measuring the natural tag rows.
  const joined =
    !mobile &&
    active &&
    layout?.key === open &&
    layout.categories === categories &&
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
      categories,
      visibleCount,
    });
  }, [open, mobile, active, joined, categories, visibleCount]);
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
    // eslint-disable-next-line react-you-might-not-need-an-effect/no-initialize-state -- ResizeObserver invalidates measured geometry on later width changes, not during effect initialization.
    observer.observe(list);
    return () => observer.disconnect();
  }, []);
  const close = () => {
    if (busy) return;
    setOpen(null);
    trigger.current?.focus({ preventScroll: true });
  };
  useEffect(() => {
    if (!open || mobile || !active) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented && !busy) {
        event.preventDefault();
        setOpen(null);
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
    else setOpen(name);
  };
  const details =
    category && open ? (
      <RepCategoryDetails
        key={`${category.category}:${connectedProfile?.id ?? "visitor"}:${activeProfileProxy?.id ?? "self"}`}
        profile={profile}
        category={category}
        direction={direction}
        autoSelectOwnAmount={!mobile && active && joined !== null}
        busy={busy}
        onBusyChange={setBusy}
        onOpenGlobalCategory={(name) => {
          if (busy) return;
          if (mobile) close();
          onOpenGlobalCategory(name);
        }}
      />
    ) : null;
  let moreLabel = t(locale, "user.profile.rep.categories.loadMore");
  if (hidden > 0)
    moreLabel = t(locale, "user.profile.rep.categories.more", {
      count: formatInteger(locale, hidden),
    });
  else if (isFetchingNextPage)
    moreLabel = t(locale, "user.profile.rep.categories.loadingMore");
  const panelEnd = Math.min(
    joined?.end ?? layout?.end ?? visible.length - 1,
    visible.length - 1
  );
  const panel =
    !mobile && category ? (
      <section
        key="category-panel"
        hidden={!joined}
        id={panelId}
        aria-label={t(locale, "rep.categories.panel.panel", {
          category: category.category,
        })}
        className={clsx(
          "tw-relative tw-min-w-0 tw-basis-full tw-rounded-xl tw-bg-gradient-to-b tw-from-iron-900 tw-to-[#151518] tw-p-2.5 tw-shadow-[0_18px_40px_-18px_rgba(0,0,0,0.8)]",
          joined?.flushL && "tw-rounded-tl-none",
          joined?.flushR && "tw-rounded-tr-none"
        )}
      >
        <span
          aria-hidden="true"
          className="tw-pointer-events-none tw-absolute -tw-top-2 tw-h-2 tw-bg-iron-900"
          style={{ left: joined?.left, width: joined?.width }}
        >
          {joined && !joined.flushL && (
            <span className="tw-absolute tw-bottom-0 tw-right-full tw-size-2 tw-bg-[radial-gradient(circle_at_0_0,transparent_7.5px,#1c1c21_8px)]" />
          )}
          {joined && !joined.flushR && (
            <span className="tw-absolute tw-bottom-0 tw-left-full tw-size-2 tw-bg-[radial-gradient(circle_at_100%_0,transparent_7.5px,#1c1c21_8px)]" />
          )}
        </span>
        {details}
      </section>
    ) : null;
  return (
    <>
      <div
        ref={mobile ? undefined : listRef}
        className="tw-relative tw-flex tw-min-w-0 tw-flex-wrap tw-items-start tw-gap-2"
      >
        {visible.flatMap((item, index) => [
          <RepCategoryPill
            key={`tag:${item.category}`}
            category={item}
            direction={direction}
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
            className="tw-min-h-9 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-2 tw-text-sm tw-text-iron-400 hover:tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 disabled:tw-opacity-50"
          >
            {moreLabel}
          </button>
        )}
      </div>
      {mobile && category && (
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
          dismissible={!busy}
          noPadding
          showDragHandle
          enableDragToClose
          fitVisualViewport
          surfaceClassName="tw-bg-iron-950"
          headerClassName="tw-pb-0 tw-pt-2"
          focusTitleOnOpen
        >
          <div className="tw-px-3 tw-pb-4">{details}</div>
        </MobileWrapperDialog>
      )}
    </>
  );
}
