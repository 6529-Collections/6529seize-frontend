import { render, screen } from "@testing-library/react";
import XtdhPage from "@/components/xtdh/XtdhPage";

describe("XtdhPage", () => {
  it("renders hello world", () => {
    render(<XtdhPage />);

    expect(screen.getByText(/hello world/i)).toBeInTheDocument();
  });
});
