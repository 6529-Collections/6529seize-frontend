"use client";

import { Col } from "react-bootstrap";
import homeStyles from "@/styles/Home.module.scss";
import DotLoader from "../dotLoader/DotLoader";

interface ActivityHeaderProps {
  readonly showViewAll: boolean;
  readonly fetching: boolean;
}

export default function ActivityHeader({
  showViewAll,
  fetching,
}: ActivityHeaderProps) {
  return (
    <Col
      sm={12}
      md={6}
      className="d-flex align-items-center justify-content-between"
    >
      <span className="d-flex flex-wrap align-items-center gap-3">
        <h1>
          <span className="font-lightest">NFT</span> Activity{" "}
        </h1>
        {showViewAll ? (
          <a href="/nft-activity" className={homeStyles.viewAllLink}>
            <span>View All</span>
          </a>
        ) : (
          fetching && <DotLoader />
        )}
      </span>
    </Col>
  );
}
