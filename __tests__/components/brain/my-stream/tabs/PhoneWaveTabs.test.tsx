import { fireEvent, render, screen, within } from "@testing-library/react";
import PhoneWaveTabs, {
  type PhoneWaveTab,
} from "@/components/brain/my-stream/tabs/PhoneWaveTabs";

const PRIMARY_KEYS = ["chat", "leaderboard", "winners", "votes", "polls"];
const EXAMPLE_TABS: PhoneWaveTab[] = [
  { key: "chat", label: "Chat", onSelect: jest.fn() },
  { key: "leaderboard", label: "Leaderboard", onSelect: jest.fn() },
  { key: "winners", label: "Winners", onSelect: jest.fn() },
  { key: "votes", label: "Votes", onSelect: jest.fn() },
  { key: "polls", label: "Polls", onSelect: jest.fn() },
  { key: "faq", label: "FAQ", onSelect: jest.fn() },
  {
    key: "decisions",
    label: "Decisions",
    badgeCount: 4,
    onSelect: jest.fn(),
  },
];

describe("PhoneWaveTabs", () => {
  beforeEach(() => jest.clearAllMocks());

  it.each([4, 5])(
    "shows all %i sections with Chat first and no More",
    (count) => {
      const tabs: PhoneWaveTab[] = [
        { key: "faq", label: "FAQ", onSelect: jest.fn() },
        { key: "settings", label: "Settings", onSelect: jest.fn() },
        EXAMPLE_TABS[0]!,
        EXAMPLE_TABS.at(-1)!,
        { key: "curation:art", label: "Art", onSelect: jest.fn() },
      ].slice(0, count);
      const settingsRef = jest.fn();
      render(
        <PhoneWaveTabs
          tabs={tabs}
          primaryKeys={PRIMARY_KEYS}
          activeKey="settings"
          settingsKey="settings"
          settingsRef={settingsRef}
        />
      );

      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(count);
      expect(buttons[0]).toHaveTextContent("Chat");
      expect(screen.queryByRole("button", { name: "More" })).toBeNull();
      const settings = screen.getByRole("button", { name: "Settings" });
      expect(settings).toHaveAttribute("aria-current", "true");
      expect(settingsRef).toHaveBeenLastCalledWith(settings);
    }
  );

  it("keeps curations visible ahead of reference tabs regardless of their position", () => {
    const manage = jest.fn();
    const select = jest.fn();
    const tabs: PhoneWaveTab[] = [
      { key: "faq", label: "FAQ", onSelect: jest.fn() },
      { key: "settings", label: "Settings", onSelect: jest.fn() },
      {
        key: "curation:art",
        label: "Art",
        onSelect: select,
        action: <button onClick={manage}>Manage Art</button>,
      },
      EXAMPLE_TABS[0]!,
      { key: "curation:photos", label: "Photos", onSelect: jest.fn() },
      EXAMPLE_TABS.at(-1)!,
    ];
    render(
      <PhoneWaveTabs tabs={tabs} primaryKeys={PRIMARY_KEYS} activeKey="chat" />
    );

    const art = screen.getByRole("button", { name: "Art" });
    fireEvent.click(art);
    expect(select).toHaveBeenCalledTimes(1);
    const action = screen.getByRole("button", { name: "Manage Art" });
    expect(art.contains(action)).toBe(false);
    fireEvent.click(action);
    expect(manage).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Photos" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "FAQ" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Settings" })).toBeNull();
  });

  it("keeps the only section compact and selected", () => {
    render(
      <PhoneWaveTabs
        tabs={EXAMPLE_TABS.slice(0, 1)}
        primaryKeys={PRIMARY_KEYS}
        activeKey="chat"
      />
    );

    const chat = screen.getByRole("button", { name: "Chat" });
    expect(chat).toHaveClass("tw-flex-none");
    expect(chat).not.toHaveClass("tw-flex-auto");
    expect(chat).toHaveAttribute("aria-current", "true");
    expect(
      screen.queryByRole("button", { name: "More" })
    ).not.toBeInTheDocument();
  });

  it("keeps four primary sections and offers every other section in the sheet", async () => {
    render(
      <PhoneWaveTabs
        tabs={EXAMPLE_TABS}
        primaryKeys={PRIMARY_KEYS}
        activeKey="chat"
      />
    );

    expect(screen.getAllByRole("button").map((tab) => tab.textContent)).toEqual(
      ["Chat", "Leaderboard", "Winners", "Votes", "More"]
    );
    fireEvent.click(screen.getByRole("button", { name: "More" }));
    const sheet = await screen.findByRole("dialog", { name: "Wave sections" });
    expect(
      within(sheet)
        .getAllByRole("button")
        .filter((button) => button.textContent)
        .map((button) => button.textContent)
    ).toEqual(["Polls", "FAQ", "Decisions4"]);
    fireEvent.click(within(sheet).getByRole("button", { name: "Decisions 4" }));
    expect(EXAMPLE_TABS.at(-1)?.onSelect).toHaveBeenCalledTimes(1);
  });

  it("lists overflowing curations before reference and setup sections", async () => {
    const tabs: PhoneWaveTab[] = [
      EXAMPLE_TABS[5]!,
      ...EXAMPLE_TABS.filter((tab) => tab.key !== "faq"),
      { key: "curation:art", label: "Art", onSelect: jest.fn() },
    ];
    render(
      <PhoneWaveTabs
        tabs={tabs}
        primaryKeys={PRIMARY_KEYS}
        activeKey="curation:art"
      />
    );
    const more = screen.getByRole("button", { name: "Art" });
    expect(more).toHaveAttribute("aria-current", "true");
    fireEvent.click(more);
    const sheet = await screen.findByRole("dialog", { name: "Wave sections" });
    expect(
      within(sheet)
        .getAllByRole("button")
        .filter((button) => button.textContent)
        .map((button) => button.textContent)
    ).toEqual(["Polls", "Art", "FAQ", "Decisions4"]);
  });

  it("shows the active overflow label and decision count on the trigger", () => {
    render(
      <PhoneWaveTabs
        tabs={EXAMPLE_TABS}
        primaryKeys={PRIMARY_KEYS}
        activeKey="decisions"
      />
    );

    expect(screen.getByRole("button", { name: "Decisions 4" })).toHaveAttribute(
      "aria-current",
      "true"
    );
    expect(
      screen.getByRole("button", { name: "Decisions 4" })
    ).toHaveAccessibleDescription("Wave sections");
  });

  it("keeps overflow closed after it disappears and returns", async () => {
    const props = { primaryKeys: PRIMARY_KEYS, activeKey: "chat" };
    const { rerender } = render(
      <PhoneWaveTabs {...props} tabs={EXAMPLE_TABS} />
    );
    fireEvent.click(screen.getByRole("button", { name: "More" }));
    await screen.findByRole("dialog", { name: "Wave sections" });
    rerender(<PhoneWaveTabs {...props} tabs={EXAMPLE_TABS.slice(0, 5)} />);
    expect(screen.queryByRole("dialog", { name: "Wave sections" })).toBeNull();
    rerender(<PhoneWaveTabs {...props} tabs={EXAMPLE_TABS} />);
    expect(screen.getByRole("button", { name: "More" })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
    expect(screen.queryByRole("dialog", { name: "Wave sections" })).toBeNull();
  });

  it("reveals the active section when another section is inserted before it", () => {
    const reveal = jest.spyOn(Element.prototype, "scrollIntoView");
    try {
      const tabs = [EXAMPLE_TABS[0]!, EXAMPLE_TABS[5]!, EXAMPLE_TABS[6]!];
      const props = { primaryKeys: PRIMARY_KEYS, activeKey: "decisions" };
      const { rerender } = render(<PhoneWaveTabs {...props} tabs={tabs} />);
      reveal.mockClear();
      rerender(
        <PhoneWaveTabs
          {...props}
          tabs={[
            ...tabs.slice(0, 2),
            { key: "curation:art", label: "Art", onSelect: jest.fn() },
            tabs[2]!,
          ]}
        />
      );
      expect(reveal).toHaveBeenCalled();
    } finally {
      reveal.mockRestore();
    }
  });
});
