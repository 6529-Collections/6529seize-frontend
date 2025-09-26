import { AuthContext } from "@/components/auth/Auth";
import WaveDropMobileMenu from "@/components/waves/drops/WaveDropMobileMenu";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
jest.mock(
  "../../../../components/waves/drops/WaveDropMobileMenuDelete",
  () => () => (
    <div data-testid="delete" />
  )
);
jest.mock(
  "../../../../components/waves/drops/WaveDropMobileMenuFollow",
  () => () => (
    <div data-testid="follow" />
  )
);
jest.mock(
  "../../../../components/waves/drops/WaveDropMobileMenuOpen",
  () => () => (
    <div data-testid="open" />
  )
);
jest.mock(
  "../../../../components/waves/drops/WaveDropActionsRate",
  () => () => (
    <div data-testid="clap" />
  )
);
jest.mock(
  "../../../../components/waves/drops/WaveDropActionsAddReaction",
  () => () => (
    <div data-testid="add-reaction" />
  )
);
jest.mock(
  "../../../../components/utils/select/dropdown/CommonDropdownItemsMobileWrapper",
  () => (props: any) =>
    props.isOpen ? <div data-testid="wrapper">{props.children}</div> : null
);

jest.mock("@/contexts/SeizeSettingsContext", () => ({
  useSeizeSettings: () => ({ isMemesWave: jest.fn().mockReturnValue(true) }),
}));
jest.mock("@/contexts/EmojiContext", () => ({
  useEmoji: () => ({
    emojiMap: [],
    loading: false,
    categories: [],
    categoryIcons: {},
    findNativeEmoji: jest.fn(),
  }),
  EmojiProvider: ({ children }: any) => children,
}));

jest.doMock("@/config/env", () => ({
  publicEnv: { BASE_ENDPOINT: "https://base" },
}));

beforeAll(() => {
  Object.assign(navigator, {
    clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
  });
});

test("copies link and shows feedback", async () => {
  const drop = {
    id: "1",
    serial_no: 1,
    wave: { id: "w" },
    drop_type: ApiDropType.Chat,
    author: { handle: "alice" },
  } as any;
  render(
    <AuthContext.Provider
      value={
        {
          connectedProfile: { handle: "alice" },
          activeProfileProxy: null,
        } as any
      }>
      <WaveDropMobileMenu
        drop={drop}
        isOpen
        showReplyAndQuote
        longPressTriggered={false}
        setOpen={jest.fn()}
        onReply={jest.fn()}
        onQuote={jest.fn()}
        onAddReaction={jest.fn()}
      />
    </AuthContext.Provider>
  );
  await userEvent.click(screen.getByText("Copy link"));
  expect(navigator.clipboard.writeText).toHaveBeenCalled();
});

test("hides follow and clap when author and memes wave", () => {
  const drop = {
    id: "1",
    serial_no: 1,
    wave: { id: "w" },
    drop_type: ApiDropType.Participatory,
    author: { handle: "alice" },
  } as any;
  render(
    <AuthContext.Provider
      value={
        {
          connectedProfile: { handle: "alice" },
          activeProfileProxy: null,
        } as any
      }>
      <WaveDropMobileMenu
        drop={drop}
        isOpen
        showReplyAndQuote
        longPressTriggered={false}
        setOpen={jest.fn()}
        onReply={jest.fn()}
        onQuote={jest.fn()}
        onAddReaction={jest.fn()}
      />
    </AuthContext.Provider>
  );
  expect(screen.queryByTestId("follow")).toBeNull();
  expect(screen.queryByTestId("clap")).toBeNull();
  expect(screen.getByTestId("delete")).toBeInTheDocument();
});
