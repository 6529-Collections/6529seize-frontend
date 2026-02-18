import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiXTdhGrantStatus } from "@/generated/models/ApiXTdhGrantStatus";
import GroupCreateXtdhGrantModal from "@/components/groups/page/create/config/xtdh-grant/GroupCreateXtdhGrantModal";

jest.mock("react-dom", () => ({
  ...jest.requireActual("react-dom"),
  createPortal: (node: any) => node,
}));

const mockUseXtdhGrantsSearchQuery = jest.fn();
jest.mock("@/hooks/useXtdhGrantsSearchQuery", () => ({
  useXtdhGrantsSearchQuery: (...args: unknown[]) =>
    mockUseXtdhGrantsSearchQuery(...args),
}));

const identitySearchMock = jest.fn(
  (props: { setIdentity: (value: string) => void }) => (
    <button
      type="button"
      data-testid="grantor-select"
      onClick={() => props.setIdentity("0xAbC123")}
    >
      Select Grantor
    </button>
  )
);

jest.mock("@/components/utils/input/identity/IdentitySearch", () => ({
  __esModule: true,
  IdentitySearchSize: {
    SM: "SM",
    MD: "MD",
  },
  default: (props: { setIdentity: (value: string) => void }) =>
    identitySearchMock(props),
}));

const queryState = () => ({
  grants: [],
  totalCount: 0,
  isLoading: false,
  isError: false,
  errorMessage: undefined,
  refetch: jest.fn().mockResolvedValue(undefined),
  hasNextPage: false,
  fetchNextPage: jest.fn(),
  isFetchingNextPage: false,
});

const renderModal = () =>
  render(
    <GroupCreateXtdhGrantModal
      isOpen={true}
      selectedGrantId={null}
      onClose={jest.fn()}
      onGrantSelect={jest.fn()}
    />
  );

describe("GroupCreateXtdhGrantModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseXtdhGrantsSearchQuery.mockReturnValue(queryState());
  });

  it("does not send grantor filter until an identity is selected", () => {
    renderModal();

    expect(mockUseXtdhGrantsSearchQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        grantor: null,
        targetCollectionName: null,
        statuses: [ApiXTdhGrantStatus.Granted],
        enabled: true,
        pageSize: 20,
      })
    );
  });

  it("uses the selected identity wallet as grantor filter", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByTestId("grantor-select"));

    expect(mockUseXtdhGrantsSearchQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({
        grantor: "0xabc123",
      })
    );
  });

  it("clears selected grantor when filters are reset", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByTestId("grantor-select"));
    expect(mockUseXtdhGrantsSearchQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({
        grantor: "0xabc123",
      })
    );

    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(mockUseXtdhGrantsSearchQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({
        grantor: null,
      })
    );
  });

  it("keeps collection input accessible by name without visible label", () => {
    renderModal();

    expect(
      screen.getByRole("textbox", { name: "Collection name" })
    ).toBeInTheDocument();
  });
});
