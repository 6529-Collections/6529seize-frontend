"use client";

import Link from "next/link";
import { Col } from "react-bootstrap";
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
      className="tw-py-2 d-flex align-items-center justify-content-between">
      <span className="d-flex flex-wrap align-items-center gap-3">
        <h1 className="tw-mb-0">NFT Activity</h1>
        {showViewAll ? (
          <Link href="/nft-activity">
            <span className="tw-whitespace-nowrap tw-text-sm tw-font-semibold hover:tw-text-[#bbb] max-[800px]:tw-text-[12px]">
              View All
            </span>
          </Link>
        ) : (
          fetching && <DotLoader />
        )}
      </span>
    </Col>
  );
}
