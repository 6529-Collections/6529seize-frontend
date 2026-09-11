import { render, screen } from "@testing-library/react";
import WaveConfigurationAdminSettings from "@/components/waves/groups/WaveConfigurationAdminSettings";
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
jest.mock("@/components/waves/specs/WaveProposalCardSettings", () => ({
  __esModule: true,
  default: ({ display }: { readonly display?: string }) => (
    <div data-testid="proposal-cards" data-display={display} />
  ),
}));
jest.mock("@/components/waves/specs/WaveApproveTabLabels", () => ({
  __esModule: true,
  default: ({ display }: { readonly display?: string }) => (
    <div data-testid="approval-tabs" data-display={display} />
  ),
}));
jest.mock("@/components/waves/groups/WaveConfigurationCurations", () => ({
  __esModule: true,
  default: () => <div data-testid="curations" />,
}));

const mockCanEditWave = canEditWave as jest.MockedFunction<typeof canEditWave>;
const makeWave = (type: ApiWaveType): any => ({
  id: "wave-id",
  wave: { type },
});

describe("WaveConfigurationAdminSettings", () => {
  beforeEach(() => {
    mockCanEditWave.mockReset();
  });

  it("hides every shared configuration control from non-administrators", () => {
    mockCanEditWave.mockReturnValue(false);

    render(
      <WaveConfigurationAdminSettings wave={makeWave(ApiWaveType.Approve)} />
    );

    expect(screen.queryByTestId("proposal-cards")).not.toBeInTheDocument();
    expect(screen.queryByTestId("approval-tabs")).not.toBeInTheDocument();
    expect(screen.queryByTestId("curations")).not.toBeInTheDocument();
  });

  it("shows the shared controls with configuration variants to administrators", () => {
    const wave = makeWave(ApiWaveType.Approve);
    mockCanEditWave.mockReturnValue(true);

    render(<WaveConfigurationAdminSettings wave={wave} />);

    expect(screen.getByTestId("proposal-cards")).toHaveAttribute(
      "data-display",
      "configuration"
    );
    expect(screen.getByTestId("approval-tabs")).toHaveAttribute(
      "data-display",
      "configuration"
    );
    expect(screen.getByTestId("curations")).toBeInTheDocument();
    expect(mockCanEditWave).toHaveBeenCalledWith({
      connectedProfile,
      activeProfileProxy,
      wave,
    });
  });

  it("keeps approval tab labels exclusive to Approve waves", () => {
    mockCanEditWave.mockReturnValue(true);

    render(
      <WaveConfigurationAdminSettings wave={makeWave(ApiWaveType.Rank)} />
    );

    expect(screen.getByTestId("proposal-cards")).toBeInTheDocument();
    expect(screen.queryByTestId("approval-tabs")).not.toBeInTheDocument();
    expect(screen.getByTestId("curations")).toBeInTheDocument();
  });
});
