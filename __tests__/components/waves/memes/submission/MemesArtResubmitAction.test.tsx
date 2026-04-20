import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemesArtResubmitAction } from "@/components/waves/memes/submission/MemesArtResubmitAction";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";
import { useWave } from "@/hooks/useWave";

jest.mock("@/hooks/drops/useDropInteractionRules");
jest.mock("@/hooks/useWave");
jest.mock("react-tooltip", () => ({
  Tooltip: ({ children }: any) => children,
}));
jest.mock("@/components/waves/memes/MemesArtSubmissionModal", () => ({
  __esModule: true,
  default: (props: any) =>
    props.isOpen ? (
      <div data-testid="resubmit-modal">
        <button type="button" onClick={props.onClose}>
          close
        </button>
        <button type="button" onClick={props.onSourceDropDeleted}>
          source deleted
        </button>
      </div>
    ) : null,
}));

const mockUseDropInteractionRules =
  useDropInteractionRules as jest.MockedFunction<
    typeof useDropInteractionRules
  >;
const mockUseWave = useWave as jest.MockedFunction<typeof useWave>;

const drop = {
  id: "drop-1",
  drop_type: ApiDropType.Participatory,
} as any;
const wave = { id: "wave-1" } as any;

const mockParticipation = (overrides: Record<string, boolean> = {}) => {
  mockUseWave.mockReturnValue({
    participation: {
      canSubmitNow: true,
      hasReachedLimit: false,
      isEligible: true,
      isWithinPeriod: true,
      ...overrides,
    },
  } as any);
};

describe("MemesArtResubmitAction", () => {
  beforeEach(() => {
    mockUseDropInteractionRules.mockReturnValue({
      canDelete: true,
      isAuthor: true,
      isWinner: false,
    } as any);
    mockParticipation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("delegates modal opening when an external opener is provided", async () => {
    const onOpenModal = jest.fn();

    render(
      <MemesArtResubmitAction
        drop={drop}
        wave={wave}
        variant="menu"
        onOpenModal={onOpenModal}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /resubmit/i }));

    expect(onOpenModal).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("resubmit-modal")).not.toBeInTheDocument();
  });

  it("does not delegate modal opening when resubmit is disabled", async () => {
    const onOpenModal = jest.fn();
    mockParticipation({ canSubmitNow: false, hasReachedLimit: true });

    render(
      <MemesArtResubmitAction
        drop={drop}
        wave={wave}
        variant="menu"
        onOpenModal={onOpenModal}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /resubmit/i }));

    expect(onOpenModal).not.toHaveBeenCalled();
  });

  it("keeps the internal modal path and forwards source-delete callbacks", async () => {
    const onSourceDropDeleted = jest.fn();

    render(
      <MemesArtResubmitAction
        drop={drop}
        wave={wave}
        variant="button"
        onSourceDropDeleted={onSourceDropDeleted}
      />
    );

    await userEvent.click(
      screen.getByRole("button", { name: /resubmit drop/i })
    );
    await userEvent.click(
      screen.getByRole("button", { name: /source deleted/i })
    );

    expect(screen.getByTestId("resubmit-modal")).toBeInTheDocument();
    expect(onSourceDropDeleted).toHaveBeenCalledTimes(1);
  });
});
