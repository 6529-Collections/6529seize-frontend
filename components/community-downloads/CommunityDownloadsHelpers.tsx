"use client";

import type { ReactNode } from "react";
import { Fragment } from "react";
import { Container, Row, Col, Table } from "react-bootstrap";
import NothingHereYetSummer from "@/components/nothingHereYet/NothingHereYetSummer";
import styles from "./CommunityDownloads.module.scss";
import { getRandomObjectId } from "@/helpers/AllowlistToolHelpers";

export function formatDate(dateString: string): string {
  const isYYYYMMDDFormat = (str: string): boolean => /^\d{8}$/.test(str);
  if (isYYYYMMDDFormat(dateString)) {
    const year = Number(dateString.substring(0, 4));
    const month = Number(dateString.substring(4, 6)) - 1;
    const day = Number(dateString.substring(6, 8));
    const d = new Date(year, month, day);
    return d.toDateString();
  } else {
    const d = new Date(dateString);
    return d.toDateString();
  }
}

export function DownloadsLayout({
  title,
  children,
}: {
  readonly title: string;
  readonly children: ReactNode;
}) {
  return (
    <Container fluid>
      <Row>
        <Col>
          <Container className="pt-4">
            <Row>
              <Col>
                <h1>
                  {title} Downloads
                </h1>
              </Col>
            </Row>
            {children}
          </Container>
        </Col>
      </Row>
    </Container>
  );
}

export function DownloadsTable<T>({
  data,
  columns,
  renderRow,
}: {
  readonly data: T[] | undefined;
  readonly columns: string[];
  readonly renderRow: (item: T, index: number) => ReactNode;
}) {
  if (data === undefined) {
    return null;
  }

  if (data.length === 0) {
    return <NothingHereYetSummer />;
  }

  return (
    <Row className={`pt-3 ${styles["downloadsScrollContainer"]}`}>
      <Col>
        <Table bordered={false} className={styles["downloadsTable"]}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => (
              <Fragment key={getRandomObjectId()}>
                {renderRow(item, idx)}
              </Fragment>
            ))}
          </tbody>
        </Table>
      </Col>
    </Row>
  );
}
