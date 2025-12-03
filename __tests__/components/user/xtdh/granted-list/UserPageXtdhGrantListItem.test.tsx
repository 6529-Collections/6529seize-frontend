import { render, screen } from "@testing-library/react";

import { UserPageXtdhGrantListItem } from "@/components/user/xtdh/granted-list/subcomponents/UserPageXtdhGrantListItem";
import type { ApiXTdhGrantsPage } from "@/generated/models/ApiXTdhGrantsPage";
import { ApiXTdhGrantStatus } from "@/generated/models/ApiXTdhGrantStatus";
import { ApiXTdhGrantTargetChain } from "@/generated/models/ApiXTdhGrantTargetChain";
import { useContractOverviewQuery } from "@/hooks/useAlchemyNftQueries";
import type { ContractOverview } from "@/types/nft";

jest.mock("@/hooks/useAlchemyNftQueries", () => ({
  useContractOverviewQuery: jest.fn(),
}));

jest.mock("@/components/auth/Auth", () => ({
  useAuth: jest.fn().mockReturnValue({ setToast: jest.fn() }),
}));

jest.mock("@/components/react-query-wrapper/ReactQueryWrapper", () => ({
  ReactQueryWrapperContext: {
    Consumer: (props: any) => props.children({ invalidateIdentityTdhStats: jest.fn() }),
  },
  useReactQueryWrapper: () => ({ invalidateIdentityTdhStats: jest.fn() }),
}));

type Grant = ApiXTdhGrantsPage["data"][number];

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

    render(<UserPageXtdhGrantListItem grant={grant} isSelf={true} />);

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

    render(<UserPageXtdhGrantListItem grant={grant} isSelf={true} />);

    expect(screen.queryByText("Error details")).not.toBeInTheDocument();
  });

  it("shows validity window labels for grants that start immediately and never expire", () => {
    const grant = createGrant({
      valid_from: null,
      valid_to: null,
    });

    render(<UserPageXtdhGrantListItem grant={grant} isSelf={true} />);

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
    target_chain: ApiXTdhGrantTargetChain.EthereumMainnet,
    target_contract: "0x1234567890abcdef1234567890abcdef12345678",
    target_tokens_count: 0,
    target_collection_name: null,
    created_at: Date.now(),
    updated_at: Date.now(),
    valid_from: null,
    valid_to: null,
    rate: 123,
    error_details: null,
    status: ApiXTdhGrantStatus.Failed,
    is_irrevocable: false,
    total_granted: 1000,
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
    xtdh: 0,
    xtdh_rate: 0,
  };
}
