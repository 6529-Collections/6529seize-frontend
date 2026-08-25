import { AdditionalDetailsSection } from "@/components/the-memes/MemePageAdditionalDetails";
import { render, screen } from "@testing-library/react";

const TestIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg data-testid="section-icon" {...props} />
);

describe("AdditionalDetailsSection", () => {
  it("centers the section icon with its heading", () => {
    render(
      <AdditionalDetailsSection title="Properties" icon={TestIcon}>
        Details
      </AdditionalDetailsSection>
    );

    const heading = screen.getByRole("heading", { name: "Properties" });

    expect(heading.parentElement).toHaveClass("tw-flex", "tw-items-center");
    expect(screen.getByTestId("section-icon")).not.toHaveClass(
      "tw-relative",
      "tw-top-px"
    );
    expect(heading).toBeVisible();
  });
});
