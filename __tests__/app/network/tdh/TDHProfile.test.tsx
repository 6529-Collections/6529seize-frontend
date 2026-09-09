import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TDHProfile from "@/app/network/tdh/TDHProfile";
import {
  commonApiFetch,
  getStructuredApiErrorStatus,
} from "@/services/api/common-api";
import { renderWithQueryClient } from "../../../utils/reactQuery";

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
  getStructuredApiErrorStatus: jest.fn(),
}));

const fetchMock = commonApiFetch as jest.MockedFunction<typeof commonApiFetch>;
const statusMock = getStructuredApiErrorStatus as jest.MockedFunction<
  typeof getStructuredApiErrorStatus
>;

const WALLET = "0x1111111111111111111111111111111111111111";
const token = (id: number) => ({
  id,
  balance: 1,
  tdh: 101,
  tdh__raw: 101,
  hodl_rate: 1,
  days_held_per_edition: [101],
});

const profile = {
  block: 123456,
  date: "2026-09-09T00:05:53Z",
  wallets: [WALLET],
  consolidation_display: "Test profile",
  tdh: 202,
  tdh__raw: 202,
  boost: 1.5,
  // Deliberately differs from 152 + 152 = 304 to exercise reconciliation.
  boosted_tdh: 303,
  boosted_tdh_rate: 3,
  memes: [token(1), token(2)],
  gradients: [],
  nextgen: [],
  boost_breakdown: {},
} as const;

function renderProfile() {
  return renderWithQueryClient(<TDHProfile locale="en-US" />);
}

describe("TDHProfile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    statusMock.mockReturnValue(undefined);
  });

  it("loads a public profile and calls the encoded identity endpoint", async () => {
    fetchMock.mockResolvedValue(profile);
    const user = userEvent.setup();
    renderProfile();

    await user.type(screen.getByLabelText(/profile handle/i), "@Public Name");
    await user.click(screen.getByRole("button", { name: /explain tdh/i }));

    expect(
      await screen.findByRole("heading", {
        level: 3,
        name: "TDH for Public Name",
      })
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "tdh/consolidation/Public%20Name",
        includeWalletAuth: false,
      })
    );
    expect(screen.getByText(/does not reconcile/i)).toBeInTheDocument();
    expect(screen.getByText("303")).toBeInTheDocument();
  });

  it("uses the newly submitted casing for the cache and endpoint", async () => {
    fetchMock.mockResolvedValue(profile);
    const user = userEvent.setup();
    renderProfile();
    const input = screen.getByLabelText(/profile handle/i);

    await user.type(input, "PublicName");
    await user.click(screen.getByRole("button", { name: /explain tdh/i }));
    await screen.findByRole("heading", { name: "TDH for PublicName" });

    await user.clear(input);
    await user.type(input, "publicname");
    await user.click(screen.getByRole("button", { name: /explain tdh/i }));
    await screen.findByRole("heading", { name: "TDH for publicname" });
    expect(fetchMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ endpoint: "tdh/consolidation/publicname" })
    );
  });

  it("explains that a previous snapshot remains visible during a refresh", async () => {
    fetchMock.mockResolvedValueOnce(profile);
    const user = userEvent.setup();
    renderProfile();
    await user.type(screen.getByLabelText(/profile handle/i), "PublicName");
    await user.click(screen.getByRole("button", { name: /explain tdh/i }));
    await screen.findByRole("heading", { name: "TDH for PublicName" });

    fetchMock.mockImplementationOnce(() => new Promise(() => {}));
    await user.click(screen.getByRole("button", { name: /explain tdh/i }));
    expect(
      await screen.findByText(/previous snapshot stays visible/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "TDH for PublicName" })
    ).toBeInTheDocument();
  });

  it("shows not found for a public 404 and allows retry", async () => {
    const notFound = new Error("missing");
    fetchMock.mockRejectedValueOnce(notFound).mockResolvedValueOnce(profile);
    statusMock.mockReturnValue(404);
    const user = userEvent.setup();
    renderProfile();

    await user.type(
      screen.getByLabelText(/profile handle/i),
      "missing-profile"
    );
    await user.click(screen.getByRole("button", { name: /explain tdh/i }));
    expect(
      await screen.findByText(/no tdh snapshot was found/i)
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /try again/i }));
    expect(
      await screen.findByRole("heading", {
        level: 3,
        name: "TDH for missing-profile",
      })
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not render malformed payloads as zero and exposes a retryable error", async () => {
    fetchMock.mockResolvedValue({ boosted_tdh: 0 });
    const user = userEvent.setup();
    renderProfile();

    await user.type(screen.getByLabelText(/profile handle/i), "bad-payload");
    await user.click(screen.getByRole("button", { name: /explain tdh/i }));

    expect(await screen.findByText(/could not be loaded/i)).toBeInTheDocument();
    expect(screen.queryByText("0", { selector: "p" })).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
