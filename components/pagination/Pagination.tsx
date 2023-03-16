import styles from "./Pagination.module.scss";
import { Container, Row, Col, Nav, Navbar, NavDropdown } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";

interface Props {
  page: number;
  pageSize: number;
  totalResults: number;
  setPage(page: number): any;
}

export default function Pagination(props: Props) {
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
        <Col>
          <FontAwesomeIcon
            icon="caret-left"
            onClick={pagePrevious}
            className={
              props.page > 1
                ? `${styles.iconEnabled}`
                : `${styles.iconDisabled}`
            }
          />{" "}
          <input
            id="page-number"
            type="text"
            className={styles.pageInput}
            onKeyDown={enterValue}
            onChange={setValue}
            value={inputPage}
          />
          {" of "}
          <span
            onClick={goToLast}
            className={isLastPage() ? styles.goToLast : ""}>
            {Math.ceil(props.totalResults / props.pageSize)}
          </span>{" "}
          <FontAwesomeIcon
            icon="caret-right"
            onClick={pageNext}
            className={
              isLastPage() ? `${styles.iconDisabled}` : `${styles.iconEnabled}`
            }
          />
        </Col>
      )}
    </>
  );
}
