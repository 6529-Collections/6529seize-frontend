import CreateDropPollDialog from "@/components/waves/create-drop-content/CreateDropPollDialog";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("@/components/mobile-wrapper-dialog/MobileWrapperDialog", () => ({
  __esModule: true,
  default: (props: {
    readonly children: React.ReactNode;
    readonly dismissible: boolean;
    readonly isOpen: boolean;
    readonly onAfterLeave?: () => void;
    readonly onBack?: () => void;
    readonly onClose: () => void;
  }) => (
    <div
      data-testid="mobile-poll-dialog"
      data-open={props.isOpen ? "true" : "false"}
      data-dismissible={props.dismissible ? "true" : "false"}
    >
      <button type="button" onClick={props.onClose}>
        Dismiss poll
      </button>
      {props.onBack && (
        <button type="button" onClick={props.onBack}>
          Back from poll
        </button>
      )}
      <button type="button" onClick={props.onAfterLeave}>
        Complete poll exit
      </button>
      {props.children}
    </div>
  ),
}));

jest.mock("@/components/waves/CreateDropPoll", () => ({
  __esModule: true,
  default: ({ onRemove }: { readonly onRemove: () => void }) => (
    <button type="button" onClick={onRemove}>
      Remove poll content
    </button>
  ),
}));

jest.mock("@/components/utils/button/Button", () => ({
  __esModule: true,
  default: ({
    "aria-label": ariaLabel,
    children,
    disabled,
    loading,
    onClick,
  }: {
    readonly "aria-label"?: string;
    readonly children: React.ReactNode;
    readonly disabled?: boolean;
    readonly loading?: boolean;
    readonly onClick: () => void;
  }) => (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {children}
    </button>
  ),
}));

const draft = {
  options: ["", ""],
  multichoice: false,
  anonymous: false,
  onlyDroppersCanRespond: false,
  closingTime: "2026-09-03T12:00",
};

const defaultProps = {
  canSubmit: false,
  draft,
  locale: DEFAULT_LOCALE,
  onChange: jest.fn(),
  onRemove: jest.fn(),
  onSubmit: jest.fn(async () => undefined),
  submitting: false,
  validationError: null,
};

describe("CreateDropPollDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("clears poll state only after the dialog finishes closing", async () => {
    const user = userEvent.setup();
    render(<CreateDropPollDialog {...defaultProps} />);

    await user.click(screen.getByText("Dismiss poll"));

    expect(screen.getByTestId("mobile-poll-dialog")).toHaveAttribute(
      "data-open",
      "false"
    );
    expect(defaultProps.onRemove).not.toHaveBeenCalled();

    await user.click(screen.getByText("Complete poll exit"));

    expect(defaultProps.onRemove).toHaveBeenCalledTimes(1);
  });

  it("uses the same close lifecycle for the Poll content action", async () => {
    const user = userEvent.setup();
    render(<CreateDropPollDialog {...defaultProps} />);

    await user.click(screen.getByText("Remove poll content"));

    expect(screen.getByTestId("mobile-poll-dialog")).toHaveAttribute(
      "data-open",
      "false"
    );
    expect(defaultProps.onRemove).not.toHaveBeenCalled();
  });

  it("disables dismissal while a Poll is submitting", () => {
    render(
      <CreateDropPollDialog {...defaultProps} canSubmit submitting />
    );

    expect(screen.getByTestId("mobile-poll-dialog")).toHaveAttribute(
      "data-dismissible",
      "false"
    );
    expect(screen.queryByText("Back from poll")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Posting" })).toBeDisabled();
  });
});
