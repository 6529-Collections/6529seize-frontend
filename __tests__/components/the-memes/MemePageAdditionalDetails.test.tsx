import { AdditionalDetailsSection } from "@/components/the-memes/MemePageAdditionalDetails";
import { render, screen } from "@testing-library/react";

const TestIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg data-testid="section-icon" {...props} />
);

describe("AdditionalDetailsSection", () => {
  it("optically aligns the section icon with its heading", () => {
    render(
      <AdditionalDetailsSection title="Properties" icon={TestIcon}>
        Details
      </AdditionalDetailsSection>
    );

    expect(screen.getByTestId("section-icon")).toHaveClass(
      "tw-relative",
      "tw-top-px"
    );
    expect(screen.getByRole("heading", { name: "Properties" })).toBeVisible();
  });
});
