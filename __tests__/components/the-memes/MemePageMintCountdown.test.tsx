import { render, screen } from "@testing-library/react";
import MemePageMintCountdown from "../../../components/the-memes/MemePageMintCountdown";
import useManifoldClaim, {
  ManifoldClaim,
  ManifoldClaimStatus,
  ManifoldPhase,
} from "../../../hooks/useManifoldClaim";
import useCapacitor from "../../../hooks/useCapacitor";

jest.mock("../../../hooks/useManifoldClaim");
jest.mock("../../../hooks/useCapacitor");

const mockUseManifoldClaim = useManifoldClaim as jest.MockedFunction<typeof useManifoldClaim>;
const mockUseCapacitor = useCapacitor as jest.MockedFunction<typeof useCapacitor>;

const baseClaim: ManifoldClaim = {
  instanceId: 1,
  total: 0,
  totalMax: 10,
  remaining: 10,
  cost: 0,
  startDate: 0,
  endDate: 0,
  status: ManifoldClaimStatus.UPCOMING,
  phase: ManifoldPhase.PUBLIC,
  memePhase: undefined,
  isFetching: false,
  isFinalized: false,
};

beforeEach(() => {
  jest.useFakeTimers().setSystemTime(new Date(0));
});

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});

describe("MemePageMintCountdown", () => {
  it("shows start countdown when upcoming", () => {
    mockUseCapacitor.mockReturnValue({ isIos: false } as any);
    mockUseManifoldClaim.mockReturnValue({
      ...baseClaim,
      startDate: 90,
      endDate: 200,
      status: ManifoldClaimStatus.UPCOMING,
    });
    render(<MemePageMintCountdown nft_id={1} />);
    expect(screen.getByText(/Public Phase Starts In/)).toBeInTheDocument();
    expect(screen.getByText("1 minute and 30 seconds")).toBeInTheDocument();
  });

  it("shows end countdown when active", () => {
    mockUseCapacitor.mockReturnValue({ isIos: false } as any);
    mockUseManifoldClaim.mockReturnValue({
      ...baseClaim,
      startDate: 90,
      endDate: 200,
      status: ManifoldClaimStatus.ACTIVE,
    });
    render(<MemePageMintCountdown nft_id={1} />);
    expect(screen.getByText(/Public Phase Ends In/)).toBeInTheDocument();
    expect(screen.getByText("3 minutes and 20 seconds")).toBeInTheDocument();
  });

  it("hides Mint button on iOS", () => {
    mockUseCapacitor.mockReturnValue({ isIos: true } as any);
    mockUseManifoldClaim.mockReturnValue({
      ...baseClaim,
      startDate: 90,
      endDate: 200,
      status: ManifoldClaimStatus.UPCOMING,
    });
    render(<MemePageMintCountdown nft_id={1} />);
    expect(screen.queryByRole("button", { name: /mint/i })).not.toBeInTheDocument();
  });

  it("shows Mint button on other platforms", () => {
    mockUseCapacitor.mockReturnValue({ isIos: false } as any);
    mockUseManifoldClaim.mockReturnValue({
      ...baseClaim,
      startDate: 90,
      endDate: 200,
      status: ManifoldClaimStatus.UPCOMING,
    });
    render(<MemePageMintCountdown nft_id={1} />);
    expect(screen.getByRole("button", { name: /mint/i })).toBeInTheDocument();
  });
});
