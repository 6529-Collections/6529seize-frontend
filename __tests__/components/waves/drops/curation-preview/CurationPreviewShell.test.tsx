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
});
