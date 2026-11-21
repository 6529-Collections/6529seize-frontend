import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithQueryClient } from "@/__tests__/utils/reactQuery";
import { useAuth } from "@/components/auth/Auth";
import WaveConfigurationCurations from "@/components/waves/groups/WaveConfigurationCurations";
import type { ApiWave } from "@/generated/models/ApiWave";
import { canEditWave } from "@/helpers/waves/waves.helpers";
import { useWaveCurationReorderMutation } from "@/hooks/waves/useWaveCurationReorderMutation";
import { useWaveCurations } from "@/hooks/waves/useWaveCurations";
import { commonApiFetch } from "@/services/api/common-api";
import { fetchSavedGroupMembersPage } from "@/services/api/group-members-api";
import { PROFILE_SWITCHED_EVENT } from "@/services/auth/auth.utils";
import { getCurrentProfileQueryViewer } from "@/services/auth/profile-query-viewer";

const replace = jest.fn();
let searchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  usePathname: () => "/waves/wave-id",
  useRouter: () => ({ replace }),
  useSearchParams: () => searchParams,
}));
jest.mock("@/components/auth/Auth", () => ({
  useAuth: jest.fn(),
}));
jest.mock("@/helpers/waves/waves.helpers", () => ({
  canEditWave: jest.fn(),
}));
jest.mock("@/services/auth/profile-query-viewer", () => ({
  getCurrentProfileQueryViewer: jest.fn(),
}));
jest.mock("@/hooks/waves/useWaveCurations", () => ({
  useWaveCurations: jest.fn(),
}));
jest.mock("@/hooks/waves/useWaveCurationReorderMutation", () => ({
  useWaveCurationReorderMutation: jest.fn(),
}));
jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));
jest.mock("@/services/api/group-members-api", () => ({
  fetchSavedGroupMembersPage: jest.fn(),
}));
jest.mock(
  "@/components/brain/my-stream/tabs/MyStreamWaveCurationCreateDialog",
  () => ({
    __esModule: true,
    default: ({ isOpen }: { readonly isOpen: boolean }) =>
      isOpen ? <div role="dialog">Curation editor</div> : null,
  })
);
jest.mock(
  "@/components/brain/my-stream/tabs/MyStreamWaveCurationTabMenu",
  () => ({
    __esModule: true,
    default: ({
      isSetAsProfileCurationPending,
      leadingItems,
      onDeleted,
      triggerAriaLabel,
      triggerVariant,
    }: {
      readonly isSetAsProfileCurationPending?: boolean;
      readonly leadingItems: readonly {
        readonly id: string;
        readonly label: string;
        readonly disabled?: boolean;
        readonly onSelect: () => void;
      }[];
      readonly onDeleted?: () => void | Promise<void>;
      readonly triggerAriaLabel: string;
      readonly triggerVariant: string;
    }) => (
      <div
        data-profile-curation-pending={String(
          Boolean(isSetAsProfileCurationPending)
        )}
        data-trigger-variant={triggerVariant}
      >
        <button type="button" aria-label={triggerAriaLabel}>
          Configure
        </button>
        <button
          type="button"
          onClick={() => {
            void onDeleted?.();
          }}
        >
          Run delete callback
        </button>
        {leadingItems.map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={item.disabled}
            onClick={item.onSelect}
          >
            {item.label}
          </button>
        ))}
      </div>
    ),
  })
);

const mockUseWaveCurations = useWaveCurations as jest.MockedFunction<
  typeof useWaveCurations
>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockCanEditWave = canEditWave as jest.MockedFunction<typeof canEditWave>;
const mockUseWaveCurationReorderMutation =
  useWaveCurationReorderMutation as jest.MockedFunction<
    typeof useWaveCurationReorderMutation
  >;
const moveCuration = jest.fn();
const wave = { id: "wave-id" } as ApiWave;
const curations = [
  {
    id: "curation-1",
    name: "First curation",
    group_id: "group-1",
    priority_order: 1,
    created_at: 1,
  },
  {
    id: "curation-2",
    name: "Second curation",
    group_id: "group-2",
    priority_order: 2,
    created_at: 2,
  },
];

describe("WaveConfigurationCurations", () => {
  beforeEach(() => {
    searchParams = new URLSearchParams();
    replace.mockReset();
    moveCuration.mockReset();
    mockUseWaveCurations.mockReset();
    mockUseWaveCurationReorderMutation.mockReset();
    jest.mocked(commonApiFetch).mockReset();
    jest.mocked(fetchSavedGroupMembersPage).mockClear();
    mockUseAuth.mockReturnValue({
      activeProfileProxy: null,
      connectedProfile: null,
    } as ReturnType<typeof useAuth>);
    mockCanEditWave.mockReturnValue(true);
    jest.mocked(getCurrentProfileQueryViewer).mockReturnValue("first-session");
    mockUseWaveCurations.mockReturnValue({
      data: curations,
      isPending: false,
      isError: false,
    } as any);
    mockUseWaveCurationReorderMutation.mockReturnValue({
      moveCuration,
      isPending: false,
      pendingCurationId: null,
    } as any);
    jest.mocked(commonApiFetch).mockImplementation(async ({ endpoint }) => ({
      id: endpoint.split("/").at(-1),
      name: endpoint === "groups/group-1" ? "Artists" : "Collectors",
      is_private: true,
      group: {
        tdh: { min: null, max: null, inclusion_strategy: "TDH" },
        rep: {
          min: 1,
          max: null,
          category: "6529 Dev Team",
          user_identity: "punk6529",
          direction: "RECEIVED",
        },
        cic: {
          min: null,
          max: null,
          user_identity: null,
          direction: "RECEIVED",
        },
        level: { min: null, max: null },
        owns_nfts: [],
        identity_group_identities_count: 11,
      },
    }));
    jest.mocked(fetchSavedGroupMembersPage).mockResolvedValue({
      count: 17,
      page: 1,
      next: false,
      data: [],
    });
  });

  it("does not render or query curations without configuration permission", () => {
    mockCanEditWave.mockReturnValue(false);

    renderWithQueryClient(<WaveConfigurationCurations wave={wave} />);

    expect(
      screen.queryByRole("heading", { name: "Curations" })
    ).not.toBeInTheDocument();
    expect(mockUseWaveCurations).not.toHaveBeenCalled();
    expect(commonApiFetch).not.toHaveBeenCalled();
  });

  it("shows curation group criteria and a linked member count beside the gear menu", async () => {
    renderWithQueryClient(<WaveConfigurationCurations wave={wave} />);

    expect(
      screen.getByRole("heading", { name: "Curations" })
    ).toBeInTheDocument();
    expect(screen.getByText("First curation")).toBeInTheDocument();
    const memberLink = await screen.findByRole("link", {
      name: "Inspect Artists group criteria and members: 17 users",
    });
    expect(memberLink).toHaveAttribute("href", "/network?page=1&group=group-1");
    expect(memberLink).toHaveAccessibleDescription(
      "REP in 6529 Dev Team from punk6529 at least 1 and 11 explicitly included users"
    );
    expect(
      screen.queryByText("Artists", { exact: true })
    ).not.toBeInTheDocument();
    expect(commonApiFetch).toHaveBeenCalledTimes(curations.length);
    const configurationMenu = screen.getByRole("button", {
      name: "Configure First curation",
    }).parentElement;
    expect(configurationMenu).toHaveAttribute(
      "data-trigger-variant",
      "configuration"
    );
    expect(configurationMenu).toHaveAttribute(
      "data-profile-curation-pending",
      "false"
    );
  });

  it("keeps the gear menu available when the curation group cannot be read", async () => {
    jest.mocked(commonApiFetch).mockRejectedValue(new Error("Unavailable"));
    renderWithQueryClient(<WaveConfigurationCurations wave={wave} />);

    await waitFor(() =>
      expect(screen.getAllByText("Unavailable group")).toHaveLength(
        curations.length
      )
    );
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(fetchSavedGroupMembersPage).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Configure First curation" })
    ).toBeInTheDocument();
  });

  it("discards private group criteria when the active session changes", async () => {
    renderWithQueryClient(<WaveConfigurationCurations wave={wave} />);
    await screen.findByRole("link", {
      name: "Inspect Artists group criteria and members: 17 users",
    });

    jest.mocked(getCurrentProfileQueryViewer).mockReturnValue("second-session");
    jest.mocked(commonApiFetch).mockRejectedValue(new Error("Unavailable"));
    act(() => {
      window.dispatchEvent(new Event(PROFILE_SWITCHED_EVENT));
    });

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getAllByText("Unavailable group")).toHaveLength(
        curations.length
      )
    );
  });

  it("opens curation creation and exposes ordering actions", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<WaveConfigurationCurations wave={wave} />);

    await user.click(screen.getByRole("button", { name: "Create curation" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("Curation editor");

    const moveDownButton = screen
      .getAllByRole("button", { name: "Move down" })
      .at(0);
    if (!moveDownButton) {
      throw new Error("Expected the first curation to expose Move down");
    }
    await user.click(moveDownButton);
    expect(moveCuration).toHaveBeenCalledWith({
      curation: curations[0],
      direction: "next",
      curations,
    });
  });

  it("disables every reorder action while a reorder is pending", () => {
    mockUseWaveCurationReorderMutation.mockReturnValue({
      moveCuration,
      isPending: true,
      pendingCurationId: "curation-1",
    } as any);

    renderWithQueryClient(<WaveConfigurationCurations wave={wave} />);

    screen.getAllByRole("button", { name: "Move up" }).forEach((button) => {
      expect(button).toBeDisabled();
    });
    screen.getAllByRole("button", { name: "Move down" }).forEach((button) => {
      expect(button).toBeDisabled();
    });
  });

  it("clears a deleted selected curation while preserving other query parameters", async () => {
    searchParams = new URLSearchParams(
      "curation=curation-1&view=compact&filter=active"
    );
    const user = userEvent.setup();
    renderWithQueryClient(<WaveConfigurationCurations wave={wave} />);

    const deleteCallbackButton = screen
      .getAllByRole("button", { name: "Run delete callback" })
      .at(0);
    if (!deleteCallbackButton) {
      throw new Error(
        "Expected the first curation to expose its delete callback"
      );
    }
    await user.click(deleteCallbackButton);

    expect(replace).toHaveBeenCalledWith(
      "/waves/wave-id?view=compact&filter=active",
      { scroll: false }
    );
  });
});
