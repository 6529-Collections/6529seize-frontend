"use client";

import { faArrowCircleRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { Col, Row } from "react-bootstrap";
import { formatNameForUrl } from "@/components/nextGen/nextgen_helpers";
import styles from "@/components/nextGen/collections/NextGen.module.scss";

interface SlideshowHeaderProps {
  readonly collectionName: string;
}

export default function SlideshowHeader({
  collectionName,
}: SlideshowHeaderProps) {
  return (
    <Row>
      <Col className="d-flex align-items-center justify-content-end">
        <Link
          href={`/nextgen/collection/${formatNameForUrl(collectionName)}/art`}
          className={`d-flex align-items-center gap-2 decoration-none ${styles.viewAllTokens}`}
        >
          <h5 className="mb-0 font-color d-flex align-items-center gap-2">
            View All
            <FontAwesomeIcon
              icon={faArrowCircleRight}
              className={styles.viewAllIcon}
            />
          </h5>
        </Link>
      </Col>
    </Row>
  );
}
