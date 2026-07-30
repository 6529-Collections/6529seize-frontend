import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateWaveInlineGroupXtdhGrant from "@/components/waves/create-wave/groups/CreateWaveInlineGroupXtdhGrant";
import { ApiGroupBeneficiaryGrantMatchMode } from "@/generated/models/ApiGroupBeneficiaryGrantMatchMode";
import type { ApiXTdhGrant } from "@/generated/models/ApiXTdhGrant";
import { ApiXTdhGrantStatus } from "@/generated/models/ApiXTdhGrantStatus";
import { ApiXTdhGrantTargetTokenMode } from "@/generated/models/ApiXTdhGrantTargetTokenMode";
import { useXtdhGrantQuery } from "@/hooks/useXtdhGrantQuery";
import { useXtdhGrantsSearchQuery } from "@/hooks/useXtdhGrantsSearchQuery";

// Collapse the debounce to a plain effect: the 250ms window belongs to react-use,
// not to this component's logic, and running it as an effect (rather than during
// render) keeps the two debounced state syncs from looping.
jest.mock("react-use", () => {
  const { useEffect } = jest.requireActual<typeof import("react")>("react");
  return {
    useDebounce: (fn: () => void, _ms: number, deps: readonly unknown[]) => {
      useEffect(fn, deps);
    },
  };
});

jest.mock("@/hooks/useXtdhGrantQuery", () => ({
  useXtdhGrantQuery: jest.fn(),
}));

jest.mock("@/hooks/useXtdhGrantsSearchQuery", () => ({
  useXtdhGrantsSearchQuery: jest.fn(),
}));

jest.mock("@/components/utils/input/identity/IdentitySearch", () => ({
  __esModule: true,
  IdentitySearchSize: { SM: "SM", MD: "MD" },
  default: function MockIdentitySearch(props: {
    readonly label: string;
    readonly identity: string | null;
    readonly setIdentity: (identity: string | null) => void;
  }) {
    return (
      <div data-testid="identity-search" data-identity={props.identity ?? ""}>
        <button type="button" onClick={() => props.setIdentity("SomeGrantor")}>
          pick-grantor
        </button>
        <button type="button" onClick={() => props.setIdentity(null)}>
          clear-grantor
        </button>
      </div>
    );
  },
}));

jest.mock(
  "@/components/groups/page/create/config/xtdh-grant/GroupCreateXtdhGrantSelection",
  () =>
    function MockSelection(props: {
      readonly matchMode: string;
      readonly lookupGrantId: string | null;
      readonly isFetching: boolean;
      readonly isLookupFresh: boolean;
      readonly showLookupError: boolean;
      readonly showNonGrantedWarning: boolean;
      readonly errorMessage: string | null | undefined;
      readonly setMatchMode: (mode: string) => void;
    }) {
      return (
        <div
          data-testid="grant-selection"
          data-match-mode={props.matchMode}
          data-lookup-grant-id={props.lookupGrantId ?? ""}
          data-is-fetching={String(props.isFetching)}
          data-is-lookup-fresh={String(props.isLookupFresh)}
          data-show-lookup-error={String(props.showLookupError)}
          data-show-non-granted-warning={String(props.showNonGrantedWarning)}
          data-error-message={props.errorMessage ?? ""}
        />
      );
    }
);

jest.mock(
  "@/components/groups/page/create/config/xtdh-grant/subcomponents/GroupCreateXtdhGrantRow",
  () =>
    function MockGrantRow(props: {
      readonly grant: { id: string };
      readonly isSelected: boolean;
      readonly onSelect: (grant: { id: string }) => void;
    }) {
      return (
        <li data-testid={`grant-row-${props.grant.id}`}>
          <button type="button" onClick={() => props.onSelect(props.grant)}>
            {`select-${props.grant.id}`}
          </button>
          <span data-testid={`selected-${props.grant.id}`}>
            {String(props.isSelected)}
          </span>
        </li>
      );
    }
);

const mockedGrantQuery = useXtdhGrantQuery as jest.Mock;
const mockedSearchQuery = useXtdhGrantsSearchQuery as jest.Mock;

const buildGrant = (overrides: Partial<ApiXTdhGrant> = {}): ApiXTdhGrant =>
  ({
    id: "grant-1",
    target_contract: "0xcontract",
    target_token_mode: ApiXTdhGrantTargetTokenMode.All,
    target_tokens_count: 1,
    target_collection_name: "Memes",
    created_at: 0,
    updated_at: 0,
    valid_from: null,
    valid_to: null,
    rate: 1,
    error_details: null,
    status: ApiXTdhGrantStatus.Granted,
    is_irrevocable: false,
    total_granted: 0,
    ...overrides,
  }) as ApiXTdhGrant;

const grantQueryResult = (overrides: Record<string, unknown> = {}) => ({
  grant: undefined,
  isFetching: false,
  isError: false,
  errorMessage: null,
  ...overrides,
});

const searchQueryResult = (overrides: Record<string, unknown> = {}) => ({
  grants: [],
  totalCount: 0,
  hasNextPage: false,
  fetchNextPage: jest.fn(),
  isFetchingNextPage: false,
  isLoading: false,
  isError: false,
  errorMessage: null,
  refetch: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

const renderGrantPicker = (
  overrides: Partial<
    React.ComponentProps<typeof CreateWaveInlineGroupXtdhGrant>
  > = {}
) => {
  const setBeneficiaryGrantId = jest.fn();
  const setBeneficiaryGrantMatchMode = jest.fn();
  const view = render(
    <CreateWaveInlineGroupXtdhGrant
      beneficiaryGrantId={null}
      beneficiaryGrantMatchMode={ApiGroupBeneficiaryGrantMatchMode.AnyToken}
      setBeneficiaryGrantId={setBeneficiaryGrantId}
      setBeneficiaryGrantMatchMode={setBeneficiaryGrantMatchMode}
      {...overrides}
    />
  );
  return { setBeneficiaryGrantId, setBeneficiaryGrantMatchMode, ...view };
};

describe("CreateWaveInlineGroupXtdhGrant", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGrantQuery.mockReturnValue(grantQueryResult());
    mockedSearchQuery.mockReturnValue(searchQueryResult());
  });

  it("renders the grant id field with the finder collapsed", () => {
    renderGrantPicker();

    expect(screen.getByLabelText("Grant ID")).toHaveValue("");
    const toggle = screen.getByRole("button", { name: /Find grant/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByTestId("identity-search")).not.toBeInTheDocument();
  });

  it("does not look up a grant while the field is empty", () => {
    renderGrantPicker();

    expect(mockedGrantQuery).toHaveBeenCalledWith({
      grantId: null,
      enabled: false,
    });
  });

  it("looks up the trimmed grant id supplied by the parent", () => {
    renderGrantPicker({ beneficiaryGrantId: "  grant-7  " });

    expect(screen.getByLabelText("Grant ID")).toHaveValue("grant-7");
    expect(mockedGrantQuery).toHaveBeenLastCalledWith({
      grantId: "grant-7",
      enabled: true,
    });
  });

  it("pushes a typed grant id up to the parent", async () => {
    const { setBeneficiaryGrantId, setBeneficiaryGrantMatchMode } =
      renderGrantPicker();

    await userEvent.type(screen.getByLabelText("Grant ID"), "g");

    expect(setBeneficiaryGrantId).toHaveBeenCalledWith("g");
    expect(setBeneficiaryGrantMatchMode).not.toHaveBeenCalled();
  });

  it("clears the grant id and resets the match mode when the field is emptied", async () => {
    const { setBeneficiaryGrantId, setBeneficiaryGrantMatchMode } =
      renderGrantPicker({ beneficiaryGrantId: "grant-1" });

    await userEvent.clear(screen.getByLabelText("Grant ID"));

    expect(setBeneficiaryGrantId).toHaveBeenCalledWith(null);
    expect(setBeneficiaryGrantMatchMode).toHaveBeenCalledWith(
      ApiGroupBeneficiaryGrantMatchMode.AnyToken
    );
  });

  it("surfaces lookup errors to the selection panel", () => {
    mockedGrantQuery.mockReturnValue(
      grantQueryResult({ isError: true, errorMessage: "Grant not found" })
    );

    renderGrantPicker({ beneficiaryGrantId: "grant-1" });

    const selection = screen.getByTestId("grant-selection");
    expect(selection).toHaveAttribute("data-show-lookup-error", "true");
    expect(selection).toHaveAttribute("data-error-message", "Grant not found");
  });

  it("warns when the resolved grant is not in granted status", () => {
    mockedGrantQuery.mockReturnValue(
      grantQueryResult({
        grant: buildGrant({ status: ApiXTdhGrantStatus.Pending }),
      })
    );

    renderGrantPicker({ beneficiaryGrantId: "grant-1" });

    expect(screen.getByTestId("grant-selection")).toHaveAttribute(
      "data-show-non-granted-warning",
      "true"
    );
  });

  it("does not warn for a granted grant", () => {
    mockedGrantQuery.mockReturnValue(
      grantQueryResult({ grant: buildGrant() })
    );

    renderGrantPicker({ beneficiaryGrantId: "grant-1" });

    expect(screen.getByTestId("grant-selection")).toHaveAttribute(
      "data-show-non-granted-warning",
      "false"
    );
  });

  it("downgrades an all-tokens match mode that the grant cannot support", () => {
    mockedGrantQuery.mockReturnValue(
      grantQueryResult({
        grant: buildGrant({
          target_token_mode: ApiXTdhGrantTargetTokenMode.All,
        }),
      })
    );

    const { setBeneficiaryGrantMatchMode } = renderGrantPicker({
      beneficiaryGrantId: "grant-1",
      beneficiaryGrantMatchMode: ApiGroupBeneficiaryGrantMatchMode.AllTokens,
    });

    expect(setBeneficiaryGrantMatchMode).toHaveBeenCalledWith(
      ApiGroupBeneficiaryGrantMatchMode.AnyToken
    );
  });

  it("keeps an all-tokens match mode when the grant lists explicit tokens", () => {
    mockedGrantQuery.mockReturnValue(
      grantQueryResult({
        grant: buildGrant({
          target_token_mode: ApiXTdhGrantTargetTokenMode.Include,
        }),
      })
    );

    const { setBeneficiaryGrantMatchMode } = renderGrantPicker({
      beneficiaryGrantId: "grant-1",
      beneficiaryGrantMatchMode: ApiGroupBeneficiaryGrantMatchMode.AllTokens,
    });

    expect(setBeneficiaryGrantMatchMode).not.toHaveBeenCalled();
    expect(screen.getByTestId("grant-selection")).toHaveAttribute(
      "data-match-mode",
      ApiGroupBeneficiaryGrantMatchMode.AllTokens
    );
  });

  describe("grant finder", () => {
    const openFinder = async () => {
      await userEvent.click(screen.getByRole("button", { name: /Find grant/ }));
    };

    it("only queries the grant search once the finder is open", async () => {
      renderGrantPicker();

      expect(mockedSearchQuery).toHaveBeenLastCalledWith(
        expect.objectContaining({ enabled: false })
      );

      await openFinder();

      expect(
        screen.getByRole("button", { name: /Hide finder/ })
      ).toHaveAttribute("aria-expanded", "true");
      expect(mockedSearchQuery).toHaveBeenLastCalledWith(
        expect.objectContaining({
          enabled: true,
          grantor: null,
          targetCollectionName: null,
          statuses: [ApiXTdhGrantStatus.Granted],
          pageSize: 20,
        })
      );
    });

    it("collapses again on a second toggle", async () => {
      renderGrantPicker();

      await openFinder();
      await userEvent.click(screen.getByRole("button", { name: /Hide finder/ }));

      expect(screen.queryByTestId("identity-search")).not.toBeInTheDocument();
    });

    it("lower-cases the selected grantor before querying", async () => {
      renderGrantPicker();
      await openFinder();

      await userEvent.click(
        screen.getByRole("button", { name: "pick-grantor" })
      );

      expect(mockedSearchQuery).toHaveBeenLastCalledWith(
        expect.objectContaining({ grantor: "somegrantor" })
      );
    });

    it("clears the grantor filter back to null", async () => {
      renderGrantPicker();
      await openFinder();

      await userEvent.click(
        screen.getByRole("button", { name: "pick-grantor" })
      );
      await userEvent.click(
        screen.getByRole("button", { name: "clear-grantor" })
      );

      expect(mockedSearchQuery).toHaveBeenLastCalledWith(
        expect.objectContaining({ grantor: null })
      );
    });

    it("passes a collection name filter through and normalises blank input to null", async () => {
      renderGrantPicker();
      await openFinder();

      const collectionInput = screen.getByLabelText("Collection name");
      await userEvent.type(collectionInput, "Memes");

      expect(mockedSearchQuery).toHaveBeenLastCalledWith(
        expect.objectContaining({ targetCollectionName: "Memes" })
      );

      await userEvent.clear(collectionInput);

      expect(mockedSearchQuery).toHaveBeenLastCalledWith(
        expect.objectContaining({ targetCollectionName: null })
      );
    });

    it("filters by status and marks the active status button pressed", async () => {
      renderGrantPicker();
      await openFinder();

      const pendingButton = screen.getByRole("button", { name: "Pending" });
      await userEvent.click(pendingButton);

      expect(pendingButton).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByRole("button", { name: "Granted" })).toHaveAttribute(
        "aria-pressed",
        "false"
      );
      expect(mockedSearchQuery).toHaveBeenLastCalledWith(
        expect.objectContaining({ statuses: [ApiXTdhGrantStatus.Pending] })
      );
    });

    it("labels the disabled status as Revoked", async () => {
      renderGrantPicker();
      await openFinder();

      await userEvent.click(screen.getByRole("button", { name: "Revoked" }));

      expect(mockedSearchQuery).toHaveBeenLastCalledWith(
        expect.objectContaining({ statuses: [ApiXTdhGrantStatus.Disabled] })
      );
    });

    it("resets every filter when clear filters is used", async () => {
      renderGrantPicker();
      await openFinder();

      await userEvent.click(
        screen.getByRole("button", { name: "pick-grantor" })
      );
      await userEvent.type(
        screen.getByLabelText("Collection name"),
        "Gradient"
      );
      await userEvent.click(screen.getByRole("button", { name: "Failed" }));

      await userEvent.click(
        screen.getByRole("button", { name: "Clear filters" })
      );

      expect(screen.getByLabelText("Collection name")).toHaveValue("");
      expect(screen.getByRole("button", { name: "Granted" })).toHaveAttribute(
        "aria-pressed",
        "true"
      );
      expect(mockedSearchQuery).toHaveBeenLastCalledWith(
        expect.objectContaining({
          grantor: null,
          targetCollectionName: null,
          statuses: [ApiXTdhGrantStatus.Granted],
        })
      );
    });

    it("shows a loading message before the first page arrives", async () => {
      mockedSearchQuery.mockReturnValue(
        searchQueryResult({ isLoading: true })
      );
      renderGrantPicker();
      await openFinder();

      expect(screen.getByText("Loading grants...")).toBeInTheDocument();
    });

    it("shows the empty state when no grants match", async () => {
      renderGrantPicker();
      await openFinder();

      expect(
        screen.getByText("No grants matched the selected filters.")
      ).toBeInTheDocument();
    });

    it("shows the search error with a retry that refetches", async () => {
      const refetch = jest.fn().mockResolvedValue(undefined);
      mockedSearchQuery.mockReturnValue(
        searchQueryResult({
          isError: true,
          errorMessage: "Search unavailable",
          refetch,
        })
      );
      renderGrantPicker();
      await openFinder();

      expect(screen.getByText("Search unavailable")).toBeInTheDocument();
      await userEvent.click(screen.getByRole("button", { name: "Retry" }));

      expect(refetch).toHaveBeenCalledTimes(1);
    });

    it("swallows a rejected retry instead of surfacing an unhandled rejection", async () => {
      const refetch = jest.fn().mockRejectedValue(new Error("still down"));
      mockedSearchQuery.mockReturnValue(
        searchQueryResult({ isError: true, refetch })
      );
      renderGrantPicker();
      await openFinder();

      expect(screen.getByText("Unable to load grants.")).toBeInTheDocument();
      await userEvent.click(screen.getByRole("button", { name: "Retry" }));

      expect(refetch).toHaveBeenCalledTimes(1);
    });

    it("lists results with the total count and marks the selected row", async () => {
      mockedSearchQuery.mockReturnValue(
        searchQueryResult({
          grants: [buildGrant({ id: "grant-1" }), buildGrant({ id: "grant-2" })],
          totalCount: 2,
        })
      );
      renderGrantPicker({ beneficiaryGrantId: "grant-2" });
      await openFinder();

      expect(screen.getByText("2 total")).toBeInTheDocument();
      expect(screen.getByTestId("selected-grant-1")).toHaveTextContent("false");
      expect(screen.getByTestId("selected-grant-2")).toHaveTextContent("true");
    });

    it("selecting a row writes the grant id and a compatible match mode", async () => {
      mockedSearchQuery.mockReturnValue(
        searchQueryResult({
          grants: [
            buildGrant({
              id: "grant-9",
              target_token_mode: ApiXTdhGrantTargetTokenMode.Include,
            }),
          ],
          totalCount: 1,
        })
      );
      const { setBeneficiaryGrantId, setBeneficiaryGrantMatchMode } =
        renderGrantPicker({
          beneficiaryGrantMatchMode:
            ApiGroupBeneficiaryGrantMatchMode.AllTokens,
        });
      await openFinder();

      await userEvent.click(
        screen.getByRole("button", { name: "select-grant-9" })
      );

      expect(setBeneficiaryGrantId).toHaveBeenCalledWith("grant-9");
      expect(setBeneficiaryGrantMatchMode).toHaveBeenLastCalledWith(
        ApiGroupBeneficiaryGrantMatchMode.AllTokens
      );
    });

    it("selecting an all-tokens grant forces the any-token match mode", async () => {
      mockedSearchQuery.mockReturnValue(
        searchQueryResult({
          grants: [
            buildGrant({
              id: "grant-3",
              target_token_mode: ApiXTdhGrantTargetTokenMode.All,
            }),
          ],
          totalCount: 1,
        })
      );
      const { setBeneficiaryGrantMatchMode } = renderGrantPicker({
        beneficiaryGrantMatchMode: ApiGroupBeneficiaryGrantMatchMode.AllTokens,
      });
      await openFinder();

      await userEvent.click(
        screen.getByRole("button", { name: "select-grant-3" })
      );

      expect(setBeneficiaryGrantMatchMode).toHaveBeenLastCalledWith(
        ApiGroupBeneficiaryGrantMatchMode.AnyToken
      );
    });

    it("hides load-more when there is no next page", async () => {
      mockedSearchQuery.mockReturnValue(
        searchQueryResult({ grants: [buildGrant()], totalCount: 1 })
      );
      renderGrantPicker();
      await openFinder();

      expect(
        screen.queryByRole("button", { name: "Load more" })
      ).not.toBeInTheDocument();
    });

    it("fetches the next page from load-more", async () => {
      const fetchNextPage = jest.fn();
      mockedSearchQuery.mockReturnValue(
        searchQueryResult({
          grants: [buildGrant()],
          totalCount: 40,
          hasNextPage: true,
          fetchNextPage,
        })
      );
      renderGrantPicker();
      await openFinder();

      await userEvent.click(screen.getByRole("button", { name: "Load more" }));

      expect(fetchNextPage).toHaveBeenCalledTimes(1);
    });

    it("disables load-more while the next page is in flight", async () => {
      mockedSearchQuery.mockReturnValue(
        searchQueryResult({
          grants: [buildGrant()],
          totalCount: 40,
          hasNextPage: true,
          isFetchingNextPage: true,
        })
      );
      renderGrantPicker();
      await openFinder();

      expect(screen.getByRole("button", { name: "Loading..." })).toBeDisabled();
    });
  });
});
