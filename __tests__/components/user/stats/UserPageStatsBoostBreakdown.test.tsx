import { render, screen, within } from "@testing-library/react";
import UserPageStatsBoostBreakdown from "@/components/user/stats/UserPageStatsBoostBreakdown";
import type { ConsolidatedTDH } from "@/entities/ITDH";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

jest.mock("@/i18n/messages", () => {
  const actual =
    jest.requireActual<typeof import("@/i18n/messages")>("@/i18n/messages");
  return {
    ...actual,
    t: jest.fn(actual.t),
  };
});

jest.mock("@fortawesome/react-fontawesome", () => ({
  FontAwesomeIcon: () => <svg data-testid="icon" />,
}));

const boostText = (
  key: Parameters<typeof t>[1],
  params?: Parameters<typeof t>[2]
) => t(DEFAULT_LOCALE, key, params);

const translateMock = t as jest.MockedFunction<typeof t>;

describe("UserPageStatsBoostBreakdown", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders nothing when boost breakdown missing", () => {
    const { container } = render(
      <UserPageStatsBoostBreakdown tdh={undefined} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows the accessible boost table when data provided", () => {
    const tdh: ConsolidatedTDH = {
      boost: 2,
      boost_breakdown: {
        memes_card_sets: {
          available: 1,
          acquired: 1,
          available_info: ["Card set boost detail"],
          acquired_info: [],
        },
        gradients: {
          available: 1,
          acquired: 1,
          available_info: [],
          acquired_info: [],
        },
      },
    } as any;
    render(<UserPageStatsBoostBreakdown tdh={tdh} />);
    expect(
      screen.getByText(boostText("user.collected.stats.boostBreakdown.title"))
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: boostText("user.collected.stats.boostBreakdown.versionLink", {
          version: "1.4",
        }),
      })
    ).toBeInTheDocument();

    const table = screen.getByRole("table", {
      name: boostText("user.collected.stats.boostBreakdown.tableCaption"),
    });
    expect(
      within(table).getByRole("columnheader", {
        name: boostText("user.collected.stats.boostBreakdown.columns.type"),
      })
    ).toBeInTheDocument();
    expect(
      within(table).getByRole("columnheader", {
        name: boostText(
          "user.collected.stats.boostBreakdown.columns.potential"
        ),
      })
    ).toBeInTheDocument();
    expect(
      within(table).getByRole("rowheader", {
        name: boostText("user.collected.stats.boostBreakdown.rows.total"),
      })
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", {
        name: boostText("user.collected.stats.boostBreakdown.info.ariaLabel"),
      }).length
    ).toBeGreaterThan(0);
  });

  it("uses the provided locale for boost labels", () => {
    const tdh: ConsolidatedTDH = {
      boost: 2,
      boost_breakdown: {
        memes_card_sets: {
          available: 1,
          acquired: 1,
          available_info: ["Card set boost detail"],
          acquired_info: [],
        },
        gradients: {
          available: 1,
          acquired: 1,
          available_info: [],
          acquired_info: [],
        },
      },
    } as any;

    render(<UserPageStatsBoostBreakdown tdh={tdh} locale="fr-FR" />);

    expect(translateMock).toHaveBeenCalledWith(
      "fr-FR",
      "user.collected.stats.boostBreakdown.title",
      {}
    );
    expect(translateMock).toHaveBeenCalledWith(
      "fr-FR",
      "user.collected.stats.boostBreakdown.versionLink",
      { version: "1.4" }
    );
    expect(translateMock).toHaveBeenCalledWith(
      "fr-FR",
      "user.collected.stats.boostBreakdown.columns.potential",
      {}
    );
    expect(translateMock).toHaveBeenCalledWith(
      "fr-FR",
      "user.collected.stats.boostBreakdown.info.ariaLabel",
      {}
    );
  });

  it("shows season rows when card sets acquired is zero", () => {
    const tdh: ConsolidatedTDH = {
      boost: 2,
      boost_breakdown: {
        memes_card_sets: {
          available: 1,
          acquired: 0,
          available_info: [],
          acquired_info: [],
        },
        memes_szn1: {
          available: 1,
          acquired: 1,
          available_info: [],
          acquired_info: [],
        },
        gradients: {
          available: 0,
          acquired: 0,
          available_info: [],
          acquired_info: [],
        },
      },
    } as any;
    render(<UserPageStatsBoostBreakdown tdh={tdh} />);
    expect(
      screen.getByRole("rowheader", {
        name: boostText("user.collected.stats.boostBreakdown.seasonLabel", {
          seasonNumber: 1,
        }),
      })
    ).toBeInTheDocument();
  });

  it("renders zero boost values and total row numbers with the active locale", () => {
    const tdh: ConsolidatedTDH = {
      boost: 1.25,
      boost_breakdown: {
        memes_card_sets: {
          available: 0,
          acquired: 0,
          available_info: [],
          acquired_info: [],
        },
        gradients: {
          available: 1.5,
          acquired: 0,
          available_info: [],
          acquired_info: [],
        },
      },
    } as any;

    render(<UserPageStatsBoostBreakdown tdh={tdh} locale="de-DE" />);

    const table = screen.getByRole("table", {
      name: boostText("user.collected.stats.boostBreakdown.tableCaption"),
    });
    expect(within(table).getAllByText("0,00").length).toBeGreaterThanOrEqual(3);
    expect(within(table).getAllByText("1,50").length).toBeGreaterThanOrEqual(2);
    expect(within(table).getByText("0,25")).toBeInTheDocument();
  });

  it("does not throw when optional boost breakdown sections are absent", () => {
    const tdh: ConsolidatedTDH = {
      boost: 1,
      boost_breakdown: {
        memes_card_sets: {
          available: 0,
          acquired: 0,
          available_info: [],
          acquired_info: [],
        },
      },
    } as any;

    render(<UserPageStatsBoostBreakdown tdh={tdh} />);

    const table = screen.getByRole("table", {
      name: boostText("user.collected.stats.boostBreakdown.tableCaption"),
    });
    expect(
      within(table).getByRole("rowheader", {
        name: boostText("user.collected.stats.boostBreakdown.rows.total"),
      })
    ).toBeInTheDocument();
    expect(within(table).getAllByText("0.00").length).toBeGreaterThan(0);
  });
});
