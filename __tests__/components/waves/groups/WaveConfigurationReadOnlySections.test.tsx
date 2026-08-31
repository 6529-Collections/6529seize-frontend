import { render, screen } from "@testing-library/react";
import WaveConfigurationReadOnlySections from "@/components/waves/groups/WaveConfigurationReadOnlySections";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { buildWaveRules } from "@/helpers/waves/wave-rules.helpers";
import { useWaveMetadata } from "@/hooks/waves/useWaveMetadata";

jest.mock("@/helpers/waves/wave-rules.helpers", () => ({
  buildWaveRules: jest.fn(),
}));
jest.mock("@/hooks/waves/useWaveMetadata", () => ({
  useWaveMetadata: jest.fn(),
}));
jest.mock("@/components/waves/groups/WaveConfigurationApproval", () => ({
  __esModule: true,
  default: ({ section }: { readonly section: { readonly title: string } }) => (
    <section>
      <h2>{section.title}</h2>
    </section>
  ),
}));

const mockBuildWaveRules = buildWaveRules as jest.MockedFunction<
  typeof buildWaveRules
>;
const mockUseWaveMetadata = useWaveMetadata as jest.MockedFunction<
  typeof useWaveMetadata
>;
const makeWave = (type: ApiWaveType): any => ({
  id: "wave-id",
  wave: { type },
});
const sections = [
  { id: "overview", title: "Wave", rows: [] },
  { id: "access", title: "Access", rows: [] },
  {
    id: "timing",
    title: "Schedule",
    rows: [
      { id: "submission-window", label: "Submission window", value: "Open" },
    ],
  },
  {
    id: "submissions",
    title: "Submissions",
    rows: [
      {
        id: "submission-type",
        label: "Submission type",
        value: "Standard drops",
      },
    ],
  },
  {
    id: "voting",
    title: "Voting",
    rows: [{ id: "credit-type", label: "Credit type", value: "TDH" }],
  },
  {
    id: "approval",
    title: "Approval",
    rows: [
      { id: "approval-threshold", label: "Approval threshold", value: "1 TDH" },
    ],
  },
  {
    id: "outcomes",
    title: "Outcomes",
    rows: [
      { id: "outcomes-visible", label: "Outcomes visibility", value: "Shown" },
    ],
  },
];

describe("WaveConfigurationReadOnlySections", () => {
  beforeEach(() => {
    mockBuildWaveRules.mockReset();
    mockUseWaveMetadata.mockReset();
    mockUseWaveMetadata.mockReturnValue({ data: [] } as any);
    mockBuildWaveRules.mockReturnValue({
      automatic: sections,
      custom: { binding: null, display: null, signatureRequired: false },
    });
  });

  it("shows only the requested read-only rule sections", () => {
    const wave = makeWave(ApiWaveType.Rank);

    render(<WaveConfigurationReadOnlySections wave={wave} />);

    expect(
      screen.getByRole("heading", { name: "Schedule" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Submissions" })
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Voting" })).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Outcomes" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Wave" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Access" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Approval" })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(mockUseWaveMetadata).toHaveBeenCalledWith("wave-id", {
      enabled: true,
    });
    expect(mockBuildWaveRules).toHaveBeenCalledWith({ wave, metadata: [] });
  });

  it("renders nothing for chat waves and skips metadata loading", () => {
    mockBuildWaveRules.mockReturnValue({
      automatic: sections.slice(0, 2),
      custom: { binding: null, display: null, signatureRequired: false },
    });

    render(
      <WaveConfigurationReadOnlySections wave={makeWave(ApiWaveType.Chat)} />
    );

    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(mockUseWaveMetadata).toHaveBeenCalledWith("wave-id", {
      enabled: false,
    });
  });

  it("places approval immediately after schedule for approve waves", () => {
    const wave = makeWave(ApiWaveType.Approve);

    render(<WaveConfigurationReadOnlySections wave={wave} />);

    const schedule = screen.getByRole("heading", { name: "Schedule" });
    const approval = screen.getByRole("heading", { name: "Approval" });
    const submissions = screen.getByRole("heading", { name: "Submissions" });

    expect(
      schedule.compareDocumentPosition(approval) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      approval.compareDocumentPosition(submissions) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });
});
