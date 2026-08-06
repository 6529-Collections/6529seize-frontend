import { render, screen } from "@testing-library/react";

import { PublicReviewStatusBanner } from "@/components/public-review/PublicReviewStatusBanner";
import type { PublicReviewDefinition } from "@/lib/public-review/publicReviewTypes";
import { STREAM_REVIEW_DEFINITION } from "@/lib/public-review/streamReviewDefinition";

const CASES = [
  {
    status: "REVIEW_CLOSED",
    deploymentStatus: "NOT_DEPLOYED",
    auditStatus: "PRE_AUDIT",
    labels: ["Review closed", "Preparing for launch", "Audit planned"],
    explanation: "The public feedback window is closed.",
  },
  {
    status: "AUDIT",
    deploymentStatus: "NOT_DEPLOYED",
    auditStatus: "AUDIT_IN_PROGRESS",
    labels: ["Audit", "Preparing for launch", "Audit in progress"],
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
  it("keeps status details wrapped through medium content widths", () => {
    const { container } = render(
      <PublicReviewStatusBanner
        review={STREAM_REVIEW_DEFINITION}
        displayedVersion={STREAM_REVIEW_DEFINITION.activeVersion}
        versionHref={`/reviews/6529-stream/versions/${STREAM_REVIEW_DEFINITION.activeVersion}`}
      />
    );

    expect(container.querySelector("section > div")).toHaveClass(
      "@[860px]:tw-flex-row"
    );
    expect(container.querySelector("section > div")).not.toHaveClass(
      "@[720px]:tw-flex-row"
    );
    expect(
      screen.getByRole("link", {
        name: `Review version ${STREAM_REVIEW_DEFINITION.activeVersion}`,
      })
    ).toHaveAttribute(
      "href",
      `/reviews/6529-stream/versions/${STREAM_REVIEW_DEFINITION.activeVersion}`
    );
  });

  it.each(CASES)(
    "renders $status status from reusable review state",
    ({ auditStatus, deploymentStatus, explanation, labels, status }) => {
      render(
        <PublicReviewStatusBanner
          displayedVersion={STREAM_REVIEW_DEFINITION.activeVersion}
          review={{
            ...STREAM_REVIEW_DEFINITION,
            auditStatus,
            deploymentStatus,
            status,
            versions: STREAM_REVIEW_DEFINITION.versions.map((version) => ({
              ...version,
              status,
              auditStatus,
              deploymentStatus,
            })),
          }}
        />
      );

      for (const label of labels) {
        expect(screen.getByText(label)).toBeInTheDocument();
      }
      expect(screen.getByText(new RegExp(explanation))).toBeInTheDocument();
    }
  );

  it("marks a superseded version closed and links to the current review", () => {
    const activeVersion = STREAM_REVIEW_DEFINITION.versions[0];
    if (!activeVersion) {
      throw new Error("Expected an active review version.");
    }
    const currentVersion = {
      ...activeVersion,
      auditStatus: "AUDIT_COMPLETE" as const,
      deploymentStatus: "DEPLOYED" as const,
    };

    render(
      <PublicReviewStatusBanner
        displayedVersion="review-v1"
        review={{
          ...STREAM_REVIEW_DEFINITION,
          auditStatus: "AUDIT_COMPLETE",
          deploymentStatus: "DEPLOYED",
          versions: [
            {
              ...activeVersion,
              version: "review-v1",
              status: "REVIEW_CLOSED",
            },
            currentVersion,
          ],
        }}
      />
    );

    expect(screen.getByText("Review closed")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View current review" })
    ).toHaveAttribute("href", "/reviews/6529-stream");
    expect(
      screen.queryByRole("link", { name: "Review version review-v1" })
    ).not.toBeInTheDocument();
    expect(screen.getByText("Review version review-v1")).toBeInTheDocument();
    expect(screen.getByText("Preparing for launch")).toBeInTheDocument();
    expect(screen.getByText("Audit planned")).toBeInTheDocument();
    expect(screen.queryByText("Deployed")).not.toBeInTheDocument();
    expect(screen.queryByText("Audit complete")).not.toBeInTheDocument();
  });
});
