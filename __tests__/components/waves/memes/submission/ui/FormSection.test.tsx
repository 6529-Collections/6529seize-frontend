import { render, screen } from "@testing-library/react";
import FormSection from "@/components/waves/memes/submission/ui/FormSection";

describe("FormSection", () => {
  it("renders title and children", () => {
    render(
      <FormSection title="Section Title">
        <div>Child Content</div>
      </FormSection>
    );
    expect(screen.getByText("Section Title")).toBeInTheDocument();
    expect(screen.getByText("Child Content")).toBeInTheDocument();
  });

  it("renders headerRight content when provided", () => {
    render(
      <FormSection title="Title" headerRight={<button>Right Button</button>}>
        <div>Content</div>
      </FormSection>
    );
    expect(screen.getByText("Right Button")).toBeInTheDocument();
  });

  it("applies custom class names", () => {
    const { container } = render(
      <FormSection
        title="Title"
        titleClassName="custom-title-class"
        contentClassName="custom-content-class"
      >
        <div>Content</div>
      </FormSection>
    );
    
    expect(screen.getByText("Title")).toHaveClass("custom-title-class");
    expect(container.querySelector(".custom-content-class")).toBeInTheDocument();
  });
});
