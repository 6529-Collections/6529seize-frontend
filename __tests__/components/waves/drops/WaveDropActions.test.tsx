import { render, screen } from "@testing-library/react";
import WaveDropActions from "@/components/waves/drops/WaveDropActions";
import { AuthContext } from "@/components/auth/Auth";
import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";
import { ApiDropType } from "@/generated/models/ApiDropType";

jest.mock("@/components/waves/drops/WaveDropActionsRate", () => () => (
  <div data-testid="rate" />
));
jest.mock("@/components/waves/drops/WaveDropActionsReply", () => () => (
  <div data-testid="reply" />
));
jest.mock("@/components/waves/drops/WaveDropActionsAddReaction", () => () => (
  <div data-testid="add-reaction" />
));
jest.mock("@/components/waves/drops/WaveDropActionsQuickReact", () => () => (
  <div data-testid="quick-react" />
));
jest.mock("@/components/waves/drops/WaveDropActionsBoost", () => () => (
  <div data-testid="boost" />
));
jest.mock("@/components/waves/drops/WaveDropActionsEdit", () => () => (
  <div data-testid="edit" />
));
jest.mock("@/components/waves/drops/WaveDropActionsMore", () => () => (
  <div data-testid="more" />
));

jest.mock("@/contexts/SeizeSettingsContext", () => ({
  useSeizeSettings: jest.fn(),
}));
jest.mock("@/contexts/CompactModeContext", () => ({
  useCompactMode: () => false,
}));
jest.mock("@/contexts/EmojiContext", () => ({
  useEmoji: () => ({
    emojiMap: [],
    loading: false,
    categories: [],
    categoryIcons: {},
    findNativeEmoji: jest.fn(),
    findCustomEmoji: jest.fn(),
  }),
}));

const settingsMock = useSeizeSettings as jest.Mock;

const auth = { connectedProfile: { handle: "alice" } } as any;
const wrapper = ({ children }: any) => (
  <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
);

const baseDrop: any = {
  id: "drop1",
  author: { handle: "bob" },
  wave: { id: "w1" },
  drop_type: ApiDropType.Chat,
};

beforeEach(() => {
  settingsMock.mockReturnValue({ isMemesWave: () => false });
});

describe("WaveDropActions", () => {
  it("renders quick react, add reaction, reply, boost, and more buttons", () => {
    render(
      <WaveDropActions
        drop={baseDrop}
        activePartIndex={0}
        onReply={() => {}}
      />,
      { wrapper }
    );
    expect(screen.getByTestId("quick-react")).toBeInTheDocument();
    expect(screen.getByTestId("add-reaction")).toBeInTheDocument();
    expect(screen.getByTestId("reply")).toBeInTheDocument();
    expect(screen.getByTestId("boost")).toBeInTheDocument();
    expect(screen.getByTestId("more")).toBeInTheDocument();
  });

  it("shows rate when showVoting is true", () => {
    render(
      <WaveDropActions
        drop={baseDrop}
        activePartIndex={0}
        onReply={() => {}}
        showVoting={true}
      />,
      { wrapper }
    );
    expect(screen.getByTestId("rate")).toBeInTheDocument();
  });

  it("hides voting when showVoting is false", () => {
    render(
      <WaveDropActions
        drop={baseDrop}
        activePartIndex={0}
        onReply={() => {}}
        showVoting={false}
      />,
      { wrapper }
    );
    expect(screen.queryByTestId("rate")).toBeNull();
  });

  it("hides voting when participation drop in memes wave", () => {
    settingsMock.mockReturnValue({ isMemesWave: () => true });
    const drop = { ...baseDrop, drop_type: ApiDropType.Participatory };
    render(
      <WaveDropActions drop={drop} activePartIndex={0} onReply={() => {}} />,
      { wrapper }
    );
    expect(screen.queryByTestId("rate")).toBeNull();
  });

  it("shows edit when onEdit is provided and drop is not Participatory", () => {
    render(
      <WaveDropActions
        drop={baseDrop}
        activePartIndex={0}
        onReply={() => {}}
        onEdit={() => {}}
      />,
      { wrapper }
    );
    expect(screen.getByTestId("edit")).toBeInTheDocument();
  });

  it("does not show edit when drop is Participatory even with onEdit", () => {
    const drop = { ...baseDrop, drop_type: ApiDropType.Participatory };
    render(
      <WaveDropActions
        drop={drop}
        activePartIndex={0}
        onReply={() => {}}
        onEdit={() => {}}
      />,
      { wrapper }
    );
    expect(screen.queryByTestId("edit")).toBeNull();
  });
});
