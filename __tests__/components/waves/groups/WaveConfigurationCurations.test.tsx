import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAuth } from "@/components/auth/Auth";
import WaveConfigurationCurations from "@/components/waves/groups/WaveConfigurationCurations";
import { canEditWave } from "@/helpers/waves/waves.helpers";
import { useWaveCurationReorderMutation } from "@/hooks/waves/useWaveCurationReorderMutation";
import { useWaveCurations } from "@/hooks/waves/useWaveCurations";
import { useQuery } from "@tanstack/react-query";

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
jest.mock("@/hooks/waves/useWaveCurations", () => ({
  useWaveCurations: jest.fn(),
}));
jest.mock("@/hooks/waves/useWaveCurationReorderMutation", () => ({
  useWaveCurationReorderMutation: jest.fn(),
}));
jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(),
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
const mockUseQuery = useQuery as jest.Mock;
const moveCuration = jest.fn();
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
    mockUseQuery.mockReset();
    mockUseAuth.mockReturnValue({
      activeProfileProxy: null,
      connectedProfile: null,
    } as ReturnType<typeof useAuth>);
    mockCanEditWave.mockReturnValue(true);
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
    mockUseQuery.mockImplementation(({ queryKey }) => ({
      data: { name: queryKey[1] === "group-1" ? "Artists" : "Collectors" },
      isPending: false,
    }));
  });

  it("does not render or query curations without configuration permission", () => {
    mockCanEditWave.mockReturnValue(false);

    render(<WaveConfigurationCurations wave={{ id: "wave-id" } as any} />);

    expect(
      screen.queryByRole("heading", { name: "Curations" })
    ).not.toBeInTheDocument();
    expect(mockUseWaveCurations).not.toHaveBeenCalled();
  });

  it("lists curation names and groups with gear-style management menus", () => {
    render(<WaveConfigurationCurations wave={{ id: "wave-id" } as any} />);

    expect(
      screen.getByRole("heading", { name: "Curations" })
    ).toBeInTheDocument();
    expect(screen.getByText("First curation")).toBeInTheDocument();
    expect(screen.getByText("Artists")).toBeInTheDocument();
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

  it("opens curation creation and exposes ordering actions", async () => {
    const user = userEvent.setup();
    render(<WaveConfigurationCurations wave={{ id: "wave-id" } as any} />);

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

    render(<WaveConfigurationCurations wave={{ id: "wave-id" } as any} />);

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
    render(<WaveConfigurationCurations wave={{ id: "wave-id" } as any} />);

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
