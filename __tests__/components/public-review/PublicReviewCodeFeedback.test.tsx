import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { PublicReviewCodeFeedback } from "@/components/public-review/PublicReviewCodeFeedback";
import { usePublicReviewCodeSelection } from "@/components/public-review/SoliditySourceReview";
import type {
  PublicReviewDiscussionDestination,
  PublicReviewFeedbackConfig,
  PublicReviewPageContext,
} from "@/services/api/public-review/types";

jest.mock("@/components/public-review/SoliditySourceReview", () => ({
  usePublicReviewCodeSelection: jest.fn(),
}));

jest.mock("@/components/public-review/PublicReviewTechnicalFeedback", () => ({
  PublicReviewTechnicalFeedback: ({
    children,
  }: {
    readonly children: ReactNode;
  }) => <>{children}</>,
}));

jest.mock("@/components/public-review/PublicReviewFeedbackComposer", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  function MockFeedbackComposer({
    referenceIntegrityStatus,
  }: {
    readonly referenceIntegrityStatus: string;
  }) {
    const [draft, setDraft] = React.useState("");
    return (
      <div>
        <label>
          Mock draft
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
        </label>
        <output data-testid="reference-integrity">
          {referenceIntegrityStatus}
        </output>
      </div>
    );
  }
  return {
    __esModule: true,
    default: MockFeedbackComposer,
  };
});

const useCodeSelectionMock = jest.mocked(usePublicReviewCodeSelection);
const config = {} as PublicReviewFeedbackConfig;
const destination = {} as PublicReviewDiscussionDestination;
const page = {} as PublicReviewPageContext;
const pageReferenceSelection = {
  kind: "code",
  path: "src/Stream.sol",
  sourceSha256: `sha256:${"a".repeat(64)}`,
  lineStart: 1,
  lineEnd: 1,
} as const;

describe("PublicReviewCodeFeedback", () => {
  it("keeps the composer mounted while a changed range checksum settles", () => {
    useCodeSelectionMock.mockReturnValue({
      integrityStatus: "pending",
      selection: undefined,
    });
    const { rerender } = render(
      <PublicReviewCodeFeedback
        config={config}
        destination={destination}
        page={page}
        pageReferenceSelection={pageReferenceSelection}
      />
    );
    const draft = screen.getByLabelText("Mock draft");
    fireEvent.change(draft, { target: { value: "Preserve this draft." } });
    expect(screen.getByTestId("reference-integrity")).toHaveTextContent(
      "pending"
    );

    useCodeSelectionMock.mockReturnValue({
      integrityStatus: "ready",
      selection: {
        kind: "code",
        path: "src/Stream.sol",
        sourceSha256: `sha256:${"a".repeat(64)}`,
        lineStart: 1,
        lineEnd: 1,
        snippetSha256: `sha256:${"b".repeat(64)}`,
      },
    });
    rerender(
      <PublicReviewCodeFeedback
        config={config}
        destination={destination}
        page={page}
        pageReferenceSelection={pageReferenceSelection}
      />
    );

    expect(draft).toHaveValue("Preserve this draft.");
    expect(screen.getByTestId("reference-integrity")).toHaveTextContent(
      "ready"
    );
  });
});
