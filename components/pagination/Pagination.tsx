"use client";

import { faCaretLeft, faCaretRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  type ChangeEvent,
  type KeyboardEvent,
  useEffect,
  useState,
} from "react";
import styles from "./Pagination.module.scss";

interface Props {
  page: number;
  pageSize: number;
  totalResults: number;
  setPage(page: number): any;
}

export interface Paginated<T> {
  count: number;
  page: number;
  next: any;
  data: T[];
}

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
            className={`${styles.iconButton} ${
              props.page > 1 ? styles.iconEnabled : styles.iconDisabled
            }`}
            aria-label="Previous page"
            disabled={props.page <= 1}>
            <FontAwesomeIcon icon={faCaretLeft} />
          </button>
          <input
            id="page-number"
            type="text"
            className={styles.pageInput}
            onKeyDown={enterValue}
            onChange={setValue}
            value={inputPage}
            aria-label="Page number"
          />
          {" of "}
          <button
            type="button"
            onClick={goToLast}
            className={styles.goToLast}
            aria-label="Go to last page"
            disabled={isLastPage()}>
            {Math.ceil(props.totalResults / props.pageSize).toLocaleString()}
          </button>
          <button
            type="button"
            onClick={pageNext}
            className={`${styles.iconButton} ${
              isLastPage() ? styles.iconDisabled : styles.iconEnabled
            }`}
            aria-label="Next page"
            disabled={isLastPage()}>
            <FontAwesomeIcon icon={faCaretRight} />
          </button>
        </span>
      )}
    </>
  );
}
