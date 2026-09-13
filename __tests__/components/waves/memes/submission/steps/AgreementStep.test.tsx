import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import AgreementStep from "@/components/waves/memes/submission/steps/AgreementStep";

jest.mock("@/components/utils/button/PrimaryButton", () => (props: any) => (
  <button
    onClick={props.onClicked}
    disabled={props.disabled}
    data-testid="primary"
    data-size={props.size ?? "default"}
  >
    {props.children}
  </button>
));

type Wave = { participation: { terms: string } };
jest.mock(
  "@/components/waves/memes/submission/steps/AgreementStepAgreement",
  () => (p: any) => <div data-testid="agreement">{p.text}</div>
);

const wave: Wave = { participation: { terms: "terms" } } as any;

describe("AgreementStep", () => {
  it("focuses renewed review once and preserves keyboard focus on rerender and acceptance", () => {
    const props = {
      wave: wave as React.ComponentProps<typeof AgreementStep>["wave"],
      agreements: false,
      reviewRequired: true,
      setAgreements: jest.fn(),
      onContinue: jest.fn(),
    };
    const { rerender } = render(<AgreementStep {...props} />);
    expect(screen.getByRole("status")).toHaveFocus();

    const agreementToggle = screen.getByRole("button", {
      name: "Check terms agreement",
    });
    agreementToggle.focus();
    rerender(<AgreementStep {...props} />);
    expect(agreementToggle).toHaveFocus();

    rerender(<AgreementStep {...props} agreements reviewRequired={false} />);
    expect(agreementToggle).toHaveFocus();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    rerender(<AgreementStep {...props} />);
    expect(screen.getByRole("status")).toHaveFocus();
  });

  it("explains that changed terms need review and the draft is retained", () => {
    render(
      <AgreementStep
        wave={wave as React.ComponentProps<typeof AgreementStep>["wave"]}
        agreements={false}
        reviewRequired
        setAgreements={jest.fn()}
        onContinue={jest.fn()}
      />
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "The submission destination or terms changed. Review and agree again to continue. Your artwork draft has been kept."
    );
    expect(screen.getByTestId("agreement")).toHaveTextContent("terms");
    expect(screen.getByTestId("primary")).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Check terms agreement" })
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("toggles agreement and calls continue", async () => {
    const setAgreements = jest.fn();
    const onContinue = jest.fn();
    const user = userEvent.setup();
    render(
      <AgreementStep
        wave={wave as any}
        agreements={false}
        setAgreements={setAgreements}
        onContinue={onContinue}
      />
    );
    await user.click(
      screen.getByRole("button", { name: /Check terms agreement/i })
    );
    expect(setAgreements).toHaveBeenCalledWith(true);
  });

  it("enables continue when agreed", async () => {
    const setAgreements = jest.fn();
    const onContinue = jest.fn();
    const user = userEvent.setup();
    render(
      <AgreementStep
        wave={wave as any}
        agreements={true}
        setAgreements={setAgreements}
        onContinue={onContinue}
      />
    );
    const btn = screen.getByTestId("primary");
    expect(
      screen.getByRole("button", { name: "Uncheck terms agreement" })
    ).toHaveAttribute("aria-pressed", "true");
    expect(btn).not.toBeDisabled();
    expect(btn).toHaveAttribute("data-size", "default");
    await user.click(btn);
    expect(onContinue).toHaveBeenCalled();
  });
});
