import { render, screen } from "@testing-library/react";

import { PublicReviewStatusBanner } from "@/components/public-review/PublicReviewStatusBanner";
import type { PublicReviewDefinition } from "@/lib/public-review/publicReviewTypes";
import { STREAM_REVIEW_DEFINITION } from "@/lib/public-review/streamReviewDefinition";

const CASES = [
  {
    status: "REVIEW_CLOSED",
    deploymentStatus: "NOT_DEPLOYED",
    auditStatus: "PRE_AUDIT",
    labels: ["Review closed", "Not deployed", "Pre-audit"],
    explanation: "The public feedback window is closed.",
  },
  {
    status: "AUDIT",
    deploymentStatus: "NOT_DEPLOYED",
    auditStatus: "AUDIT_IN_PROGRESS",
    labels: ["Audit", "Not deployed", "Audit in progress"],
    explanation: "The contract is in formal audit.",
  },
  {
    status: "DEPLOYED",
    deploymentStatus: "DEPLOYED",
    auditStatus: "AUDIT_COMPLETE",
    labels: ["Deployed", "Contract deployed", "Audit complete"],
    explanation: "Security reports now follow the configured post-deployment",
  },
] as const satisfies readonly {
  readonly status: PublicReviewDefinition["status"];
  readonly deploymentStatus: PublicReviewDefinition["deploymentStatus"];
  readonly auditStatus: PublicReviewDefinition["auditStatus"];
  readonly labels: readonly string[];
  readonly explanation: string;
}[];

describe("PublicReviewStatusBanner", () => {
  it.each(CASES)(
    "renders $status status from reusable review state",
    ({ auditStatus, deploymentStatus, explanation, labels, status }) => {
      render(
        <PublicReviewStatusBanner
          displayedVersion="review-v2"
          review={{
            ...STREAM_REVIEW_DEFINITION,
            auditStatus,
            deploymentStatus,
            status,
          }}
        />
      );

      for (const label of labels) {
        expect(screen.getByText(label)).toBeInTheDocument();
      }
      expect(screen.getByText(new RegExp(explanation))).toBeInTheDocument();
    }
  );
});
