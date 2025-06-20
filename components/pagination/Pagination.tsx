"use client";

import { faCaretLeft, faCaretRight } from "@fortawesome/free-solid-svg-icons";
import styles from "./Pagination.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";

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

  function enterValue(event: any) {
    if (event.key === "Enter") {
      const newValue = parseInt(inputPage);
      if (!isNaN(newValue) && newValue >= 1 && newValue <= getLastPage()) {
        setPage(newValue);
      } else {
        setInputPage(props.page.toString());
      }
    }
  }

  function setValue(event: any) {
    const newValue = event.target.value;
    setInputPage(newValue);
  }

  return (
    <>
      {props.totalResults > props.pageSize && (
        <span>
          <FontAwesomeIcon
            icon={faCaretLeft}
            onClick={pagePrevious}
            className={
              props.page > 1
                ? `${styles.iconEnabled}`
                : `${styles.iconDisabled}`
            }
            role="button"
            aria-label="Previous page"
            tabIndex={0}
          />{" "}
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
          <span
            onClick={goToLast}
            className={isLastPage() ? styles.goToLast : ""}
            role="button"
            aria-label="Go to last page"
            tabIndex={0}>
            {Math.ceil(props.totalResults / props.pageSize).toLocaleString()}
          </span>{" "}
          <FontAwesomeIcon
            icon={faCaretRight}
            onClick={pageNext}
            className={
              isLastPage() ? `${styles.iconDisabled}` : `${styles.iconEnabled}`
            }
            role="button"
            aria-label="Next page"
            tabIndex={0}
          />
        </span>
      )}
    </>
  );
}
