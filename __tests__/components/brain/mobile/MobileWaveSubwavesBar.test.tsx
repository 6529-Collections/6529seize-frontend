import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MobileWaveSubwavesBar from "@/components/brain/mobile/MobileWaveSubwavesBar";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { useWaveSubwavesMap } from "@/hooks/useWaveSubwaves";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveOverview } from "@/generated/models/ApiWaveOverview";
import type { SidebarWave } from "@/types/waves.types";

const mockRegisterRef = jest.fn();
const mockSetActiveWave = jest.fn();
let mockActiveWaveId: string | null = "root-wave";
let mockAddress: string | null = "0xABC";
let mockActiveProfileProxy: { id: string } | null = { id: "proxy-1" };
let mockSubwavesByParentId = new Map<
  string,
  { subwaves: readonly SidebarWave[]; isFetching: boolean }
>();

jest.mock("@/components/brain/my-stream/layout/LayoutContext", () => ({
  useLayout: () => ({ registerRef: mockRegisterRef }),
}));

jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStream: () => ({
    activeWave: {
      id: mockActiveWaveId,
      set: mockSetActiveWave,
    },
  }),
}));

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({ address: mockAddress }),
}));

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ activeProfileProxy: mockActiveProfileProxy }),
}));

jest.mock("@/hooks/useWaveSubwaves", () => ({
  useWaveSubwavesMap: jest.fn(() => ({
    subwavesByParentId: mockSubwavesByParentId,
  })),
}));

jest.mock("@/components/waves/WavePicture", () => ({
  __esModule: true,
  default: ({ name }: { readonly name: string }) => (
    <span data-testid={`picture-${name}`} />
  ),
}));

const useWaveSubwavesMapMock = useWaveSubwavesMap as jest.Mock;

const createParentOverview = (
  overrides: Partial<ApiWaveOverview> = {}
): ApiWaveOverview =>
  ({
    id: "root-wave",
    name: "Root Wave",
    pfp: null,
    last_drop_time: 0,
    created_at: 1,
    subscribers_count: 0,
    has_competition: false,
    is_dm_wave: false,
    links_disabled: false,
    description_drop: { contents: null, media: [] },
    total_drops_count: 0,
    is_private: false,
    contributors: [],
    context_profile_context: {
      subscribed: false,
      pinned: false,
      can_chat: true,
      unread_drops: 0,
      muted: false,
    },
    has_subwaves: true,
    ...overrides,
  }) as ApiWaveOverview;

const createApiWave = ({
  id = "root-wave",
  name = "Root Wave",
  parentWave,
  hasSubwaves = false,
  isDirectMessage = false,
  type = ApiWaveType.Chat,
  unreadDropsCount = 0,
}: {
  readonly id?: string;
  readonly name?: string;
  readonly parentWave?: ApiWaveOverview | undefined;
  readonly hasSubwaves?: boolean | undefined;
  readonly isDirectMessage?: boolean | undefined;
  readonly type?: ApiWaveType | undefined;
  readonly unreadDropsCount?: number | undefined;
} = {}): ApiWave =>
  ({
    id,
    name,
    picture: null,
    created_at: 1,
    contributors_overview: [],
    chat: {
      scope: {
        group: isDirectMessage ? { is_direct_message: true } : null,
      },
    },
    wave: { type },
    metrics: {
      your_unread_drops_count: unreadDropsCount,
      muted: false,
    },
    parent_wave: parentWave,
    has_subwaves: hasSubwaves,
  }) as ApiWave;

const createSubwave = (
  id: string,
  overrides: Partial<SidebarWave> = {}
): SidebarWave => ({
  id,
  name: `Subwave ${id}`,
  type: ApiWaveType.Chat,
  createdAt: 1,
  picture: null,
  contributors: [],
  isDirectMessage: false,
  hasCompetition: false,
  parentWaveId: "root-wave",
  hasSubwaves: false,
  descriptionDrop: { contents: null, media: [] },
  totalDropsCount: 0,
  isPrivate: false,
  latestDropTimestamp: null,
  firstUnreadDropSerialNo: null,
  unreadDropsCount: 0,
  latestReadTimestamp: 0,
  pinned: false,
  muted: false,
  subscribed: false,
  ...overrides,
});

describe("MobileWaveSubwavesBar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockActiveWaveId = "root-wave";
    mockAddress = "0xABC";
    mockActiveProfileProxy = { id: "proxy-1" };
    mockSubwavesByParentId = new Map();
  });

  it("hides root waves with no subwaves", () => {
    const { container } = render(
      <MobileWaveSubwavesBar wave={createApiWave({ hasSubwaves: false })} />
    );

    expect(container.firstChild).toBeNull();
    expect(mockRegisterRef).toHaveBeenCalledWith("pinned", null);
    expect(useWaveSubwavesMapMock).toHaveBeenCalledWith({
      parentWaveIds: [],
      viewerIdentityKey: "0xabc:proxy:proxy-1",
    });
  });

  it("renders Main and each subwave for a root wave with subwaves", () => {
    mockSubwavesByParentId = new Map([
      [
        "root-wave",
        {
          subwaves: [
            createSubwave("child-1", { name: "Alpha" }),
            createSubwave("child-2", { name: "Beta", unreadDropsCount: 4 }),
          ],
          isFetching: false,
        },
      ],
    ]);

    render(
      <MobileWaveSubwavesBar wave={createApiWave({ hasSubwaves: true })} />
    );

    expect(screen.getByRole("button", { name: "Open Main" })).toHaveAttribute(
      "aria-current",
      "true"
    );
    expect(
      screen.getByRole("button", { name: "Open Alpha" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Open Beta" })
    ).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /remove/i })).toBeNull();
    expect(useWaveSubwavesMapMock).toHaveBeenCalledWith({
      parentWaveIds: ["root-wave"],
      viewerIdentityKey: "0xabc:proxy:proxy-1",
    });
  });

  it("shows a stable loading row instead of an incomplete Main tab", () => {
    render(
      <MobileWaveSubwavesBar wave={createApiWave({ hasSubwaves: true })} />
    );

    expect(screen.getByRole("status")).toHaveTextContent("Loading subwaves");
    expect(
      screen.queryByRole("button", { name: "Open Main" })
    ).not.toBeInTheDocument();
  });

  it("keeps cached subwaves visible during a background refresh", () => {
    mockSubwavesByParentId = new Map([
      [
        "root-wave",
        {
          subwaves: [createSubwave("child-1", { name: "Cached Child" })],
          isFetching: true,
        },
      ],
    ]);

    render(
      <MobileWaveSubwavesBar wave={createApiWave({ hasSubwaves: true })} />
    );

    expect(
      screen.getByRole("button", { name: "Open Main" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Open Cached Child" })
    ).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("renders a subwave fallback when the active subwave is missing from loaded siblings", () => {
    mockActiveWaveId = "child-2";
    mockSubwavesByParentId = new Map([
      [
        "root-wave",
        {
          subwaves: [createSubwave("child-1", { name: "Sibling" })],
          isFetching: false,
        },
      ],
    ]);

    render(
      <MobileWaveSubwavesBar
        wave={createApiWave({
          id: "child-2",
          name: "Active Child",
          parentWave: createParentOverview(),
        })}
      />
    );

    expect(
      screen.getByRole("button", { name: "Open Main" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Open Sibling" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Open Active Child" })
    ).toHaveAttribute("aria-current", "true");
  });

  it("clicks only inactive pills", async () => {
    const user = userEvent.setup();
    mockActiveWaveId = "child-2";
    mockSubwavesByParentId = new Map([
      [
        "root-wave",
        {
          subwaves: [
            createSubwave("child-1", { name: "Sibling" }),
            createSubwave("child-2", { name: "Active Child" }),
          ],
          isFetching: false,
        },
      ],
    ]);

    render(
      <MobileWaveSubwavesBar
        wave={createApiWave({
          id: "child-2",
          name: "Active Child",
          parentWave: createParentOverview(),
        })}
      />
    );

    await user.click(screen.getByRole("button", { name: "Open Active Child" }));
    expect(mockSetActiveWave).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Open Main" }));
    expect(mockSetActiveWave).toHaveBeenCalledWith("root-wave", {
      isDirectMessage: false,
    });

    await user.click(screen.getByRole("button", { name: "Open Sibling" }));
    expect(mockSetActiveWave).toHaveBeenCalledWith("child-1", {
      isDirectMessage: false,
    });
  });

  it("hides direct messages", () => {
    const { container } = render(
      <MobileWaveSubwavesBar
        wave={createApiWave({
          hasSubwaves: true,
          isDirectMessage: true,
        })}
      />
    );

    expect(container.firstChild).toBeNull();
    expect(useWaveSubwavesMapMock).toHaveBeenCalledWith({
      parentWaveIds: [],
      viewerIdentityKey: "0xabc:proxy:proxy-1",
    });
  });

  it("does not write the old local shortcut storage key", () => {
    const setItem = jest.spyOn(Storage.prototype, "setItem");
    mockSubwavesByParentId = new Map([
      [
        "root-wave",
        {
          subwaves: [createSubwave("child-1")],
          isFetching: false,
        },
      ],
    ]);

    render(
      <MobileWaveSubwavesBar wave={createApiWave({ hasSubwaves: true })} />
    );

    expect(setItem).not.toHaveBeenCalledWith("pinnedWave", expect.any(String));
    setItem.mockRestore();
  });
});
