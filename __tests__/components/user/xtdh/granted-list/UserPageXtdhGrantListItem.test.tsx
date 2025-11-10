import { render, screen } from "@testing-library/react";

import { UserPageXtdhGrantListItem } from "@/components/user/xtdh/granted-list/UserPageXtdhGrantListItem";
import type { ApiTdhGrantsPage } from "@/generated/models/ApiTdhGrantsPage";
import { ApiTdhGrantStatus } from "@/generated/models/ApiTdhGrantStatus";
import { ApiTdhGrantTargetChain } from "@/generated/models/ApiTdhGrantTargetChain";
import type { ContractOverview } from "@/types/nft";
import { useContractOverviewQuery } from "@/hooks/useAlchemyNftQueries";

jest.mock("@/hooks/useAlchemyNftQueries", () => ({
  useContractOverviewQuery: jest.fn(),
}));

type Grant = ApiTdhGrantsPage["data"][number];

const mockContract: ContractOverview = {
  address: "0x1234567890abcdef1234567890abcdef12345678",
  name: "CRYPTOPUNKS",
  imageUrl: null,
};

const mockedUseContractOverviewQuery =
  useContractOverviewQuery as jest.MockedFunction<
    typeof useContractOverviewQuery
  >;

describe("UserPageXtdhGrantListItem", () => {
  beforeEach(() => {
    mockedUseContractOverviewQuery.mockReturnValue({
      data: mockContract,
      isError: false,
      isLoading: false,
    } as unknown as ReturnType<typeof useContractOverviewQuery>);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders error details when provided", () => {
    const grant = createGrant({
      error_details: "Token grant failed because the snapshot already expired.",
    });

    render(<UserPageXtdhGrantListItem grant={grant} />);

    expect(screen.getByText("Error details")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Token grant failed because the snapshot already expired."
      )
    ).toBeInTheDocument();
  });

  it("omits the error details panel when the API returns only whitespace", () => {
    const grant = createGrant({
      error_details: "   ",
    });

    render(<UserPageXtdhGrantListItem grant={grant} />);

    expect(screen.queryByText("Error details")).not.toBeInTheDocument();
  });

  it("shows validity window labels for grants that start immediately and never expire", () => {
    const grant = createGrant({
      valid_from: null,
      valid_to: null,
    });

    render(<UserPageXtdhGrantListItem grant={grant} />);

    expect(screen.getByText("Valid from")).toBeInTheDocument();
    expect(screen.getByText("Immediately")).toBeInTheDocument();
    expect(screen.getByText("Expires")).toBeInTheDocument();
    expect(screen.getByText("No expiry")).toBeInTheDocument();
  });
});

function createGrant(overrides: Partial<Grant> = {}): Grant {
  return {
    id: "grant-1",
    grantor: createGrantor(),
    target_chain: ApiTdhGrantTargetChain.EthereumMainnet,
    target_contract: "0x1234567890abcdef1234567890abcdef12345678",
    target_tokens: [],
    created_at: Date.now(),
    valid_from: null,
    valid_to: null,
    tdh_rate: 123,
    error_details: null,
    status: ApiTdhGrantStatus.Failed,
    is_irrevocable: false,
    ...overrides,
  };
}

function createGrantor(): Grant["grantor"] {
  return {
    id: "profile-1",
    handle: "0x6529",
    pfp: null,
    banner1_color: null,
    banner2_color: null,
    cic: 0,
    rep: 0,
    tdh: 0,
    tdh_rate: 0,
    level: 0,
    primary_address: "0x1234567890abcdef1234567890abcdef12345678",
    subscribed_actions: [],
    archived: false,
    active_main_stage_submission_ids: [],
    winner_main_stage_drop_ids: [],
  };
}
