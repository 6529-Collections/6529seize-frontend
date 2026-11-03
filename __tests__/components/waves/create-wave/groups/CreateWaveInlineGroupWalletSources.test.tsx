import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { AuthContext } from "@/components/auth/Auth";
import CreateWaveInlineGroupWalletSources from "@/components/waves/create-wave/groups/CreateWaveInlineGroupWalletSources";
import {
  createEmptyInlineGroupWalletSources,
  type CreateWaveInlineGroupWalletSources as WalletSources,
} from "@/components/waves/create-wave/groups/createWaveInlineGroupBuilder";
import { ProfileConnectedStatus } from "@/entities/IProfile";
import { distributionPlanApiFetch } from "@/services/distribution-plan-api";

jest.mock("@/services/distribution-plan-api", () => ({
  distributionPlanApiFetch: jest.fn(),
}));

jest.mock("@/components/utils/input/emma/EmmaListSearch", () => ({
  __esModule: true,
  default: (props: {
    readonly label: string;
    readonly selectedName: string | null;
    readonly onSelect: (item: {
      readonly id: string;
      readonly name: string;
      readonly description: string;
      readonly createdAt: number;
    }) => void;
  }) => (
    <div>
      <span>{props.selectedName}</span>
      <button
        type="button"
        aria-label={props.label}
        onClick={() =>
          props.onSelect({
            id: "allowlist-1",
            name: "Core contributors",
            description: "Core contributors",
            createdAt: 1,
          })
        }
      >
        Select allowlist
      </button>
    </div>
  ),
}));

const distributionPlanApiFetchMock = jest.mocked(distributionPlanApiFetch);
const requestAuth = jest.fn().mockResolvedValue({ success: true });

function renderSources(
  direction: "included" | "excluded" = "included",
  initialSources: WalletSources = createEmptyInlineGroupWalletSources(),
  connectedProfile: { readonly handle: string } | null = { handle: "tester" },
  mobilePresentation = false
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  function Harness() {
    const [sources, setSources] = useState<WalletSources>(() => initialSources);
    return (
      <CreateWaveInlineGroupWalletSources
        direction={direction}
        mobilePresentation={mobilePresentation}
        sources={sources}
        onChange={(update) =>
          setSources((current) => ({ ...current, ...update }))
        }
      />
    );
  }

  render(
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider
        value={
          {
            connectedProfile,
            fetchingProfile: false,
            connectionStatus: ProfileConnectedStatus.HAVE_PROFILE,
            receivedProfileProxies: [],
            activeProfileProxy: null,
            showWaves: false,
            requestAuth,
            setToast: jest.fn(),
            setActiveProfileProxy: jest.fn().mockResolvedValue(undefined),
          } as any
        }
      >
        <Harness />
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}

describe("CreateWaveInlineGroupWalletSources", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads and deduplicates wallets from a selected EMMA allowlist", async () => {
    distributionPlanApiFetchMock.mockResolvedValue({
      success: true,
      data: [
        { wallet: "0x1111111111111111111111111111111111111111" },
        { wallet: "0x1111111111111111111111111111111111111111" },
        { wallet: "0x2222222222222222222222222222222222222222" },
      ],
    } as any);
    const user = userEvent.setup();
    renderSources();

    await user.click(screen.getByRole("button", { name: "Search allowlists" }));

    await waitFor(() => {
      expect(distributionPlanApiFetchMock).toHaveBeenCalledWith(
        "/allowlists/allowlist-1/results"
      );
    });
    expect(await screen.findByText("2 identities added")).toBeInTheDocument();
    expect(screen.getAllByText("Core contributors")).toHaveLength(2);

    await user.click(
      screen.getByRole("button", { name: "Remove EMMA allowlist" })
    );
    expect(screen.getByText("No allowlist added.")).toBeInTheDocument();
  });

  it("offers an authentication retry for a restored allowlist while signed out", async () => {
    renderSources(
      "included",
      {
        ...createEmptyInlineGroupWalletSources(),
        selectedAllowlist: {
          id: "allowlist-1",
          name: "Core contributors",
          description: "Core contributors",
          createdAt: 1,
        },
      },
      null
    );
    const user = userEvent.setup();

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Connect your wallet to load this allowlist."
    );
    await user.click(screen.getByRole("button", { name: "Try again" }));

    await waitFor(() => expect(requestAuth).toHaveBeenCalledTimes(1));
  });

  it("offers to load a restored allowlist while signed in", async () => {
    distributionPlanApiFetchMock.mockResolvedValue({
      success: true,
      data: [{ wallet: "0x1111111111111111111111111111111111111111" }],
    } as any);
    const user = userEvent.setup();

    renderSources("included", {
      ...createEmptyInlineGroupWalletSources(),
      selectedAllowlist: {
        id: "allowlist-1",
        name: "Core contributors",
        description: "Core contributors",
        createdAt: 1,
      },
    });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Load allowlist" }));
    expect(await screen.findByText("1 identity added")).toBeInTheDocument();
    expect(requestAuth).toHaveBeenCalledTimes(1);
  });

  it("imports wallets from the file picker and keeps the file name", async () => {
    const user = userEvent.setup();
    renderSources();
    const file = new File(
      [
        "wallet\n0x1111111111111111111111111111111111111111,0x2222222222222222222222222222222222222222,0x1111111111111111111111111111111111111111",
      ],
      "included.csv",
      { type: "text/csv" }
    );

    await user.upload(
      screen.getByLabelText("Choose a CSV file of identities to include"),
      file
    );

    expect(await screen.findByText("2 identities added")).toBeInTheDocument();
    expect(screen.getByText("included.csv")).toBeInTheDocument();
  });

  it("supports dropping an exclusion CSV and reports invalid files", async () => {
    renderSources("excluded");
    const input = screen.getByLabelText(
      "Choose a CSV file of identities to exclude"
    );
    const dropTarget = input.closest("label");
    expect(dropTarget).not.toBeNull();

    fireEvent.drop(dropTarget!, {
      dataTransfer: {
        files: [
          new File(
            ["0x3333333333333333333333333333333333333333"],
            "excluded.csv",
            { type: "text/csv" }
          ),
        ],
      },
    });

    expect(await screen.findByText("1 identity added")).toBeInTheDocument();

    fireEvent.drop(dropTarget!, {
      dataTransfer: {
        files: [new File(["wallet"], "wallets.txt", { type: "text/plain" })],
      },
    });
    expect(screen.getByRole("alert")).toHaveTextContent("Choose a CSV file.");
  });
  it("keeps mobile sections visible with CSV results, errors, and removal", async () => {
    const user = userEvent.setup();
    renderSources(
      "excluded",
      createEmptyInlineGroupWalletSources(),
      { handle: "tester" },
      true
    );
    expect(screen.getByRole("heading", { name: "EMMA" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "CSV file" })).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "EMMA" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "CSV file" })
    ).not.toBeInTheDocument();
    const upload = screen.getByLabelText(
      "Choose a CSV file of identities to exclude"
    );
    expect(upload).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Search allowlists" })
    ).toBeVisible();
    await user.upload(
      upload,
      new File(["0x1111111111111111111111111111111111111111"], "excluded.csv", {
        type: "text/csv",
      })
    );
    expect(await screen.findByText("1 identity added")).toBeVisible();
    expect(screen.getByText("excluded.csv")).toBeVisible();
    expect(screen.getByText("1 identity added")).toBeVisible();
    await user.upload(
      upload,
      new File(["invalid"], "empty.csv", { type: "text/csv" })
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No valid Ethereum wallet addresses were found."
    );
    expect(screen.getByRole("alert")).toBeVisible();
    expect(screen.getByText("empty.csv")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Remove CSV file" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByText("empty.csv")).not.toBeInTheDocument();
  });

  it("loads an EMMA source in its mobile section and keeps removal available", async () => {
    let resolveLoad!: (
      result: Awaited<ReturnType<typeof distributionPlanApiFetch>>
    ) => void;
    distributionPlanApiFetchMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveLoad = resolve;
        })
    );
    const user = userEvent.setup();
    renderSources(
      "included",
      createEmptyInlineGroupWalletSources(),
      { handle: "tester" },
      true
    );
    await user.click(screen.getByRole("button", { name: "Search allowlists" }));
    await waitFor(() =>
      expect(distributionPlanApiFetchMock).toHaveBeenCalledTimes(1)
    );
    expect(screen.getByRole("status")).toBeVisible();
    expect(screen.getByText("Core contributors")).toBeVisible();
    resolveLoad({
      success: true,
      data: [{ wallet: "0x1111111111111111111111111111111111111111" }],
    });
    expect(await screen.findByText("1 identity added")).toBeVisible();
    expect(distributionPlanApiFetchMock).toHaveBeenCalledTimes(1);
    await user.click(
      screen.getByRole("button", { name: "Remove EMMA allowlist" })
    );
    expect(screen.queryByText("1 identity added")).not.toBeInTheDocument();
  });

  it("keeps EMMA authentication errors and retry available in its mobile section", async () => {
    renderSources(
      "included",
      {
        ...createEmptyInlineGroupWalletSources(),
        selectedAllowlist: {
          id: "allowlist-1",
          name: "Core contributors",
          description: "",
          createdAt: 1,
        },
      },
      null,
      true
    );
    expect(screen.getByRole("heading", { name: "EMMA" })).toBeVisible();
    expect(screen.getByRole("alert")).toBeVisible();
    expect(screen.getByRole("button", { name: "Try again" })).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Remove EMMA allowlist" })
    ).toBeVisible();
  });
});
