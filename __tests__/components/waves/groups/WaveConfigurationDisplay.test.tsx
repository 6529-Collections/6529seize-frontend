import { render, screen } from "@testing-library/react";
import WaveConfigurationDisplay from "@/components/waves/groups/WaveConfigurationDisplay";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { canEditWave } from "@/helpers/waves/waves.helpers";

const connectedProfile = { handle: "admin" };
const activeProfileProxy = null;

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ connectedProfile, activeProfileProxy }),
}));
jest.mock("@/helpers/waves/waves.helpers", () => ({
  canEditWave: jest.fn(),
}));
jest.mock("@/components/waves/specs/WaveSubmissionButtonLabel", () => ({
  __esModule: true,
  default: ({ display }: { readonly display?: string }) => (
    <div data-testid="submission-button" data-display={display} />
  ),
}));
jest.mock("@/components/waves/specs/WaveOutcomesVisibility", () => ({
  __esModule: true,
  default: ({ display }: { readonly display?: string }) => (
    <div data-testid="outcomes" data-display={display} />
  ),
}));

const mockCanEditWave = canEditWave as jest.MockedFunction<typeof canEditWave>;
const makeWave = (type: ApiWaveType): any => ({
  id: "wave-id",
  wave: { type },
});

describe("WaveConfigurationDisplay", () => {
  beforeEach(() => {
    mockCanEditWave.mockReset();
  });

  it("shows both Display controls with configuration gears to administrators", () => {
    const wave = makeWave(ApiWaveType.Approve);
    mockCanEditWave.mockReturnValue(true);

    render(<WaveConfigurationDisplay wave={wave} />);

    expect(
      screen.getByRole("heading", { name: "Display" })
    ).toBeInTheDocument();
    expect(screen.getByTestId("submission-button")).toHaveAttribute(
      "data-display",
      "configuration"
    );
    expect(screen.getByTestId("outcomes")).toHaveAttribute(
      "data-display",
      "configuration"
    );
    expect(mockCanEditWave).toHaveBeenCalledWith({
      connectedProfile,
      activeProfileProxy,
      wave,
    });
  });

  it("hides the entire Display section from non-administrators", () => {
    mockCanEditWave.mockReturnValue(false);

    render(<WaveConfigurationDisplay wave={makeWave(ApiWaveType.Rank)} />);

    expect(
      screen.queryByRole("heading", { name: "Display" })
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("submission-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("outcomes")).not.toBeInTheDocument();
  });

  it("does not show Display for unsupported wave types", () => {
    mockCanEditWave.mockReturnValue(true);

    render(<WaveConfigurationDisplay wave={makeWave(ApiWaveType.Chat)} />);

    expect(
      screen.queryByRole("heading", { name: "Display" })
    ).not.toBeInTheDocument();
  });
});
