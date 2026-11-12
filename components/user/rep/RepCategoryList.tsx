"use client";

import { AuthContext } from "@/components/auth/Auth";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiRepCategory } from "@/generated/models/ApiRepCategory";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
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
import { canManageGivenRatings } from "./ratingsManagement";
import { getCanEditRep, type RepDirection } from "./UserPageRep.helpers";

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
  const [open, setOpen] = useState<{ name: string; focus: number } | null>(
    null
  );
  const [busy, setBusy] = useState(false);
  const [rowEnd, setRowEnd] = useState(-1);
  const listRef = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const category = categories.find((item) => item.category === open?.name);
  const canEdit =
    direction === "given"
      ? canManageGivenRatings(profile, connectedProfile, activeProfileProxy)
      : getCanEditRep({
          myProfile: connectedProfile,
          targetProfile: profile,
          activeProfileProxy,
        });
  const visible = categories.slice(0, visibleCount);
  const hidden = Math.max(categories.length - visibleCount, 0);
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
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list || mobile || !open || !active) return;
    const measure = () => {
      const tags = Array.from(
        list.querySelectorAll<HTMLElement>("[data-rep-tag]")
      );
      const selected = tags.find((tag) => tag.dataset["repTag"] === open.name);
      if (!selected) return;
      const last = tags.findLastIndex(
        (tag) => tag.offsetTop === selected.offsetTop
      );
      setRowEnd(last);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [open, mobile, active, visibleCount, categories]);
  const show = (name: string, edit: boolean) => {
    if (busy) return;
    trigger.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    if (!edit && open?.name === name) close();
    else
      setOpen((previous) => ({
        name,
        focus: edit ? (previous?.focus ?? 0) + 1 : 0,
      }));
  };
  const details =
    category && open ? (
      <RepCategoryDetails
        key={`${category.category}:${connectedProfile?.id ?? "visitor"}:${activeProfileProxy?.id ?? "self"}`}
        profile={profile}
        category={category}
        direction={direction}
        focusInput={open.focus}
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
  const panel =
    !mobile && category ? (
      <section
        key="category-panel"
        id={panelId}
        aria-label={t(locale, "rep.categories.panel.panel", {
          category: category.category,
        })}
        className="tw-w-full tw-min-w-0 tw-basis-full tw-rounded-xl tw-bg-iron-900/70"
      >
        {details}
      </section>
    ) : null;
  return (
    <>
      <div
        ref={listRef}
        className="tw-relative tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-2"
      >
        {visible.flatMap((item, index) => [
          <div
            key={`tag:${item.category}`}
            data-rep-tag={item.category}
            className="tw-min-w-0 tw-max-w-full"
          >
            <RepCategoryPill
              category={item}
              direction={direction}
              canEdit={canEdit}
              onEdit={(name) => show(name, true)}
              onOpenContributors={(selected) => show(selected.category, false)}
              compact={mobile}
              isOpen={open?.name === item.category}
              panelId={panelId}
              disabled={busy}
            />
          </div>,
          index === rowEnd ? panel : null,
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
            <span className="tw-shrink-0 tw-text-sm tw-tabular-nums tw-text-iron-400">
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
          focusTitleOnOpen={(open?.focus ?? 0) === 0}
        >
          <div className="tw-px-3 tw-pb-4">{details}</div>
        </MobileWrapperDialog>
      )}
    </>
  );
}
