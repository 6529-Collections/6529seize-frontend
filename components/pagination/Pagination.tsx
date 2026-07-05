"use client";

import { faCaretLeft, faCaretRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
  "tw-cursor-pointer tw-border-0 tw-bg-transparent tw-p-0 tw-text-inherit tw-[font:inherit] hover:tw-text-[rgb(179,179,179)] hover:tw-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-[#528bff] disabled:tw-cursor-default disabled:tw-text-inherit disabled:tw-no-underline";
const PAGE_INPUT_CLASS =
  "tw-w-[35px] tw-border-0 tw-border-b tw-border-solid tw-border-white tw-bg-transparent tw-text-center";

export default function Pagination(props: Readonly<Props>) {
  const [inputPage, setInputPage] = useState<string>(props.page.toString());

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

  return (
    <>
      {props.totalResults > props.pageSize && (
        <span className="tw-inline-flex tw-items-center tw-gap-1">
          <button
            type="button"
            onClick={pagePrevious}
            className={`${ICON_BUTTON_CLASS} ${
              props.page > 1 ? ICON_ENABLED_CLASS : ICON_DISABLED_CLASS
            }`}
            aria-label="Previous page"
            disabled={props.page <= 1}
          >
            <FontAwesomeIcon icon={faCaretLeft} />
          </button>
          <input
            id="page-number"
            type="text"
            className={PAGE_INPUT_CLASS}
            onKeyDown={enterValue}
            onChange={setValue}
            value={inputPage}
            aria-label="Page number"
          />
          {" of "}
          <button
            type="button"
            onClick={goToLast}
            className={GO_TO_LAST_CLASS}
            aria-label="Go to last page"
            disabled={isLastPage()}
          >
            {Math.ceil(props.totalResults / props.pageSize).toLocaleString()}
          </button>
          <button
            type="button"
            onClick={pageNext}
            className={`${ICON_BUTTON_CLASS} ${
              isLastPage() ? ICON_DISABLED_CLASS : ICON_ENABLED_CLASS
            }`}
            aria-label="Next page"
            disabled={isLastPage()}
          >
            <FontAwesomeIcon icon={faCaretRight} />
          </button>
        </span>
      )}
    </>
  );
}
