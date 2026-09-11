import { render, screen } from "@testing-library/react";
import AboutTermsOfService from "@/components/about/AboutTermsOfService";

describe("AboutTermsOfService", () => {
  it("renders the extracted definitions without changing the legal content", () => {
    render(<AboutTermsOfService />);

    expect(
      screen.getByText("Abbreviations Make Documents More Readable")
    ).toBeInTheDocument();
    expect(screen.getByText(/Terms of Service/)).toBeInTheDocument();
    expect(
      screen.getByText(/publicly accessible secondary functions/)
    ).toBeInTheDocument();
  });
});
