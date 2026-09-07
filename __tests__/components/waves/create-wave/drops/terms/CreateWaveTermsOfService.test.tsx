import { render, screen, fireEvent } from "@testing-library/react";
import CreateWaveTermsOfService from "@/components/waves/create-wave/drops/terms/CreateWaveTermsOfService";

describe("CreateWaveTermsOfService", () => {
  it("shows saved terms and forwards edits without a toggle", () => {
    const setTerms = jest.fn();
    render(<CreateWaveTermsOfService terms="abc" setTerms={setTerms} />);
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Rules that require acceptance" })
    ).toHaveValue("abc");
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "xyz" } });
    expect(setTerms).toHaveBeenCalledWith("xyz");
  });

  it("shows the empty textbox and explains that rules are optional", () => {
    render(<CreateWaveTermsOfService terms={null} setTerms={() => {}} />);
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Rules that require acceptance" })
    ).toBeVisible();
    expect(screen.getByRole("textbox")).toHaveValue("");
    expect(
      screen.getByText("Leave empty if no rules require signing.")
    ).toBeVisible();
  });
});
