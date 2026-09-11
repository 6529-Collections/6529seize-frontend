"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { faCaretLeft, faCaretRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import {
  type ChangeEvent,
  type KeyboardEvent,
  useEffect,
  useState,
} from "react";

interface Props {
  page: number;
  pageSize: number;
  totalResults: number;
  setPage(page: number): void;
  variant?: "default" | "compact" | undefined;
}

export interface Paginated<T> {
  count: number;
  page: number;
  next: unknown;
  data: T[];
}

const ICON_BUTTON_CLASS =
  "tw-inline-flex tw-w-[14px] tw-items-center tw-justify-center tw-border-0 tw-bg-transparent tw-p-0 tw-text-inherit tw-[font:inherit] focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-[#528bff] disabled:tw-cursor-default";
const ICON_ENABLED_CLASS = "tw-cursor-pointer";
const ICON_DISABLED_CLASS = "tw-cursor-default tw-opacity-60";
const GO_TO_LAST_CLASS =
  "tw-cursor-pointer tw-border-0 tw-bg-transparent tw-p-0 tw-text-base tw-text-inherit tw-[font:inherit] hover:tw-text-[rgb(179,179,179)] hover:tw-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-[#528bff] disabled:tw-cursor-default disabled:tw-text-inherit disabled:tw-no-underline";
const PAGE_INPUT_CLASS =
  "tw-w-[60px] tw-border-0 tw-border-b tw-border-solid tw-border-white tw-bg-transparent tw-text-center tw-text-base tw-[font:inherit]";
const COMPACT_ROOT_CLASS =
  "tw-inline-flex tw-items-center tw-gap-0.5 tw-tabular-nums tw-text-sm tw-text-iron-300";
const COMPACT_ICON_BUTTON_CLASS =
  "tw-inline-flex tw-size-7 tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-500 tw-transition-colors hover:tw-bg-white/5 hover:tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-1 focus-visible:tw-outline-primary-400 disabled:tw-cursor-default disabled:tw-opacity-30";
const COMPACT_PAGE_INPUT_CLASS =
  "tw-h-7 tw-w-8 tw-cursor-text tw-border-0 tw-border-b tw-border-solid tw-border-iron-600 tw-bg-transparent tw-px-0.5 tw-text-center tw-text-sm tw-font-medium tw-text-iron-100 tw-transition-colors hover:tw-border-iron-400 focus-visible:tw-rounded-sm focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-1 focus-visible:tw-outline-primary-400";
const COMPACT_GO_TO_LAST_CLASS =
  "tw-inline-flex tw-h-7 tw-min-w-7 tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-sm tw-border-0 tw-bg-transparent tw-px-1 tw-text-sm tw-font-medium tw-text-iron-300 tw-transition-colors hover:tw-bg-white/5 hover:tw-text-iron-50 hover:tw-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-1 focus-visible:tw-outline-primary-400 disabled:tw-cursor-default disabled:tw-text-iron-500 disabled:tw-no-underline disabled:hover:tw-bg-transparent";
const CURRENT_PAGE_TOKEN = "__CURRENT_PAGE__";
const TOTAL_PAGE_TOKEN = "__TOTAL_PAGE__";
const PAGE_TOKEN_PATTERN = /(__CURRENT_PAGE__|__TOTAL_PAGE__)/;

function getPageLabelParts(locale: ReturnType<typeof useBrowserLocale>) {
  const localizedLabel = t(locale, "common.pagination.currentOfTotal", {
    current: CURRENT_PAGE_TOKEN,
    total: TOTAL_PAGE_TOKEN,
  });
  const hasBothPageTokens =
    localizedLabel.includes(CURRENT_PAGE_TOKEN) &&
    localizedLabel.includes(TOTAL_PAGE_TOKEN);

  return (
    hasBothPageTokens
      ? localizedLabel
      : `${CURRENT_PAGE_TOKEN} / ${TOTAL_PAGE_TOKEN}`
  ).split(PAGE_TOKEN_PATTERN);
}

export default function Pagination(props: Readonly<Props>) {
  const locale = useBrowserLocale();
  const [inputPage, setInputPage] = useState<string>(props.page.toString());
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setInputPage(props.page.toString());
  }, [props.page]);

  function pageNext() {
    if (!isLastPage()) {
      setPage(parseInt(inputPage) + 1);
    }
  }
  function pagePrevious() {
    if (props.page > 1) {
      setPage(parseInt(inputPage) - 1);
    }
  }
  function goToLast() {
    setPage(getLastPage());
  }

  function setPage(page: number) {
    props.setPage(page);
    setInputPage(page.toString());
  }

  function getLastPage() {
    return Math.ceil(props.totalResults / props.pageSize);
  }

  function isLastPage() {
    return props.page >= getLastPage();
  }

  function enterValue(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      const newValue = parseInt(inputPage);
      if (!isNaN(newValue) && newValue >= 1 && newValue <= getLastPage()) {
        setPage(newValue);
      } else {
        setInputPage(props.page.toString());
      }
    }
  }

  function setValue(event: ChangeEvent<HTMLInputElement>) {
    const newValue = event.target.value;
    setInputPage(newValue);
  }

  const isCompact = props.variant === "compact";
  const lastPage = getLastPage();
  const isOnLastPage = isLastPage();
  let previousButtonClassName = COMPACT_ICON_BUTTON_CLASS;
  let nextButtonClassName = COMPACT_ICON_BUTTON_CLASS;
  if (!isCompact) {
    const previousButtonStateClass =
      props.page > 1 ? ICON_ENABLED_CLASS : ICON_DISABLED_CLASS;
    const nextButtonStateClass = isOnLastPage
      ? ICON_DISABLED_CLASS
      : ICON_ENABLED_CLASS;
    previousButtonClassName = `${ICON_BUTTON_CLASS} ${previousButtonStateClass}`;
    nextButtonClassName = `${ICON_BUTTON_CLASS} ${nextButtonStateClass}`;
  }
  const pageLabelParts = getPageLabelParts(locale);

  return (
    <>
      {props.totalResults > props.pageSize && (
        <span
          className={
            isCompact
              ? COMPACT_ROOT_CLASS
              : "tw-inline-flex tw-items-center tw-gap-2 tw-text-base"
          }
        >
          <button
            type="button"
            onClick={pagePrevious}
            className={previousButtonClassName}
            aria-label={t(locale, "common.pagination.previousPage")}
            disabled={props.page <= 1}
          >
            {isCompact ? (
              <ChevronLeftIcon aria-hidden="true" className="tw-size-4" />
            ) : (
              <FontAwesomeIcon icon={faCaretLeft} />
            )}
          </button>
          {pageLabelParts.map((part, index) => {
            if (part === CURRENT_PAGE_TOKEN) {
              return (
                <input
                  key={part}
                  id="page-number"
                  type="text"
                  inputMode="numeric"
                  className={
                    isCompact ? COMPACT_PAGE_INPUT_CLASS : PAGE_INPUT_CLASS
                  }
                  onFocus={() => {
                    setInputPage(props.page.toString());
                    setIsEditing(true);
                  }}
                  onBlur={() => {
                    setInputPage(props.page.toString());
                    setIsEditing(false);
                  }}
                  onKeyDown={enterValue}
                  onChange={setValue}
                  value={
                    isEditing ? inputPage : formatInteger(locale, props.page)
                  }
                  aria-label={t(locale, "common.pagination.pageNumber")}
                />
              );
            }

            if (part === TOTAL_PAGE_TOKEN) {
              return (
                <button
                  key={part}
                  type="button"
                  onClick={goToLast}
                  className={
                    isCompact ? COMPACT_GO_TO_LAST_CLASS : GO_TO_LAST_CLASS
                  }
                  aria-label={t(locale, "common.pagination.goToLastPage")}
                  disabled={isOnLastPage}
                >
                  {formatInteger(locale, lastPage)}
                </button>
              );
            }

            return (
              <span
                key={`${part}-${index}`}
                className={
                  isCompact
                    ? "tw-px-0.5 tw-text-xs tw-font-normal tw-text-iron-500"
                    : "tw-text-base"
                }
              >
                {part}
              </span>
            );
          })}
          <button
            type="button"
            onClick={pageNext}
            className={nextButtonClassName}
            aria-label={t(locale, "common.pagination.nextPage")}
            disabled={isOnLastPage}
          >
            {isCompact ? (
              <ChevronRightIcon aria-hidden="true" className="tw-size-4" />
            ) : (
              <FontAwesomeIcon icon={faCaretRight} />
            )}
          </button>
        </span>
      )}
    </>
  );
}
