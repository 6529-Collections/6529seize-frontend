import { render, screen } from "@testing-library/react";

import { CurationPreviewShell } from "@/components/waves/drops/curation-preview/CurationPreviewShell";

describe("CurationPreviewShell", () => {
  it("uses rounded-xl styling for the hovercard variant", () => {
    render(
      <CurationPreviewShell variant="hovercard">
        <span>Preview content</span>
      </CurationPreviewShell>
    );

    expect(screen.getByText("Preview content").parentElement).toHaveClass(
      "tw-rounded-xl"
    );
  });

  it("lets the shared dialog size and scroll the expanded sheet", () => {
    render(
      <CurationPreviewShell variant="sheet">
        <span>Preview content</span>
      </CurationPreviewShell>
    );

    expect(screen.getByText("Preview content").parentElement).toHaveClass(
      "tw-flex-none"
    );
  });
});
