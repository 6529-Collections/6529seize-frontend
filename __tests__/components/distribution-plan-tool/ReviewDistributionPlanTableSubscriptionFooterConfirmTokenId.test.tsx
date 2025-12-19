import { ConfirmTokenIdModal } from "@/components/distribution-plan-tool/review-distribution-plan/table/ReviewDistributionPlanTableSubscriptionFooterConfirmTokenId";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("react-bootstrap", () => ({
  __esModule: true,
  Modal: Object.assign(
    ({ show, children }: any) => (show ? <div>{children}</div> : null),
    {
      Header: ({ children }: any) => <div>{children}</div>,
      Title: ({ children }: any) => <div>{children}</div>,
      Body: ({ children }: any) => <div>{children}</div>,
      Footer: ({ children }: any) => <div>{children}</div>,
    }
  ),
  Button: (p: any) => <button {...p}>{p.children}</button>,
  Col: (p: any) => <div>{p.children}</div>,
  Container: (p: any) => <div>{p.children}</div>,
  Row: (p: any) => <div>{p.children}</div>,
}));

describe("ConfirmTokenIdModal", () => {
  const mockOnConfirm = jest.fn();
  const mockPlan = { id: "1", name: "Meme 123 drop" } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("prefills token id from plan name", () => {
    render(
      <ConfirmTokenIdModal
        plan={mockPlan}
        show={true}
        onConfirm={mockOnConfirm}
      />
    );
    const input = screen.getByRole("spinbutton") as HTMLInputElement;
    expect(input.value).toBe("123");
  });

  it("calls onConfirm when confirm button is clicked with valid token id", async () => {
    const user = userEvent.setup();
    render(
      <ConfirmTokenIdModal
        plan={mockPlan}
        show={true}
        onConfirm={mockOnConfirm}
      />
    );
    const confirmButton = screen.getByText("Confirm");
    await user.click(confirmButton);
    expect(mockOnConfirm).toHaveBeenCalledWith(expect.any(String), "123");
  });

  it("calls onConfirm when Enter key is pressed with valid token id", async () => {
    const user = userEvent.setup();
    render(
      <ConfirmTokenIdModal
        plan={mockPlan}
        show={true}
        onConfirm={mockOnConfirm}
      />
    );
    const input = screen.getByRole("spinbutton");
    input.focus();
    await user.keyboard("{Enter}");
    expect(mockOnConfirm).toHaveBeenCalledWith(expect.any(String), "123");
  });

  it("does not call onConfirm when Enter key is pressed with invalid token id", async () => {
    const user = userEvent.setup();
    render(
      <ConfirmTokenIdModal
        plan={mockPlan}
        show={true}
        onConfirm={mockOnConfirm}
      />
    );
    const input = screen.getByRole("spinbutton") as HTMLInputElement;
    await user.clear(input);
    await user.type(input, "abc");
    input.focus();
    await user.keyboard("{Enter}");
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it("disables confirm button when token id is invalid", () => {
    render(
      <ConfirmTokenIdModal
        plan={{ id: "1", name: "Meme drop" } as any}
        show={true}
        onConfirm={mockOnConfirm}
      />
    );
    const confirmButton = screen.getByText("Confirm");
    expect(confirmButton).toBeDisabled();
  });

  it("enables confirm button when token id is valid", () => {
    render(
      <ConfirmTokenIdModal
        plan={mockPlan}
        show={true}
        onConfirm={mockOnConfirm}
      />
    );
    const confirmButton = screen.getByText("Confirm");
    expect(confirmButton).not.toBeDisabled();
  });
});
