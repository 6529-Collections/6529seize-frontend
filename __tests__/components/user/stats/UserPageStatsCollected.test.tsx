import { render, screen } from "@testing-library/react";
import UserPageStatsCollected from "@/components/user/stats/UserPageStatsCollected";
import { formatInteger, formatPercent } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

const ownerBalance = {
  total_balance: 5,
  memes_balance: 2,
  nextgen_balance: 1,
  gradients_balance: 2,
  memelab_balance: 0,
  total_balance_rank: 1,
  memes_balance_rank: 2,
  nextgen_balance_rank: 3,
  gradients_balance_rank: 4,
  memelab_balance_rank: 5,
  boosted_tdh: 10,
  boosted_memes_tdh: 5,
  boosted_nextgen_tdh: 1,
  boosted_gradients_tdh: 2,
  boosted_tdh_rank: 1,
  boosted_memes_tdh_rank: 2,
  boosted_nextgen_tdh_rank: 3,
  boosted_gradients_tdh_rank: 4,
} as any;

const balanceMemes = [
  {
    season: 1,
    consolidation_key: "1",
    balance: 1,
    unique: 1,
    sets: 1,
    rank: 2,
    boosted_tdh: 1,
    tdh_rank: 1,
  },
];

const seasons = [
  {
    id: 1,
    count: 2,
    start_index: 1,
    end_index: 2,
    name: "S1",
    display: "Season 1",
  },
];

test("renders collected stats", () => {
  render(
    <UserPageStatsCollected
      ownerBalance={ownerBalance}
      balanceMemes={balanceMemes}
      seasons={seasons}
    />
  );
  expect(
    screen.getByRole("heading", {
      name: t(DEFAULT_LOCALE, "user.collected.stats.details.collected.title"),
    })
  ).toBeInTheDocument();
  expect(
    screen.getByText(t(DEFAULT_LOCALE, "user.collected.stats.details.overview"))
  ).toBeInTheDocument();
  expect(
    screen.getByText(
      t(DEFAULT_LOCALE, "user.collected.stats.details.memesBySeason")
    )
  ).toBeInTheDocument();
  expect(
    screen.getByRole("table", {
      name: t(
        DEFAULT_LOCALE,
        "user.collected.stats.details.tables.overviewCaption"
      ),
    })
  ).toBeInTheDocument();
  expect(
    screen.getByRole("table", {
      name: t(
        DEFAULT_LOCALE,
        "user.collected.stats.details.tables.memesBySeasonCaption"
      ),
    })
  ).toBeInTheDocument();
  expect(
    screen.getByRole("rowheader", {
      name: t(DEFAULT_LOCALE, "user.collected.stats.details.rows.cards"),
    })
  ).toBeInTheDocument();
  expect(
    screen.getAllByRole("rowheader", {
      name: t(DEFAULT_LOCALE, "user.collected.stats.details.rows.rank"),
    }).length
  ).toBeGreaterThan(0);
  expect(
    screen.getByRole("rowheader", {
      name: t(DEFAULT_LOCALE, "user.collected.stats.details.seasonLabel", {
        seasonNumber: 1,
      }),
    })
  ).toBeInTheDocument();
  expect(
    screen.getByText(
      (_, node) =>
        node?.textContent?.replace(/\s+/g, " ").trim() === "1 / 2 (50%)"
    )
  ).toBeInTheDocument();
  // check rank formatting
  expect(screen.getAllByText("#1").length).toBeGreaterThan(0);
});

test("renders placeholders for sparse collected stats without NaN", () => {
  const sparseOwnerBalance = {
    total_balance: 1,
    total_balance_rank: 1,
  } as any;
  const sparseBalanceMemes = [
    {
      season: 1,
      consolidation_key: "1",
      balance: 1,
      unique: 0,
      sets: undefined,
      rank: undefined,
      boosted_tdh: undefined,
      tdh_rank: undefined,
    },
  ] as any;

  const { container } = render(
    <UserPageStatsCollected
      ownerBalance={sparseOwnerBalance}
      balanceMemes={sparseBalanceMemes}
      seasons={seasons}
    />
  );

  expect(container).not.toHaveTextContent("NaN");
  expect(screen.getAllByText("-").length).toBeGreaterThan(0);
  expect(
    screen.getByText(
      (_, node) =>
        node?.textContent?.replace(/\s+/g, " ").trim() === "0 / 2 (0%)"
    )
  ).toBeInTheDocument();
});

test("formats collected stats with the active locale", () => {
  const locale = "de-DE";
  const localizedOwnerBalance = {
    ...ownerBalance,
    total_balance: 1234,
    total_balance_rank: 1234,
  };
  const localizedBalanceMemes = [
    {
      ...balanceMemes[0],
      balance: 1234,
      unique: 1,
      sets: 1234,
      rank: 1234,
    },
  ];
  const expectedUniqueProgress = `${formatInteger(
    locale,
    1
  )} / ${formatInteger(locale, 2)} (${formatPercent(locale, 0.5, 0).replace(
    /\s+/g,
    " "
  )})`;

  render(
    <UserPageStatsCollected
      ownerBalance={localizedOwnerBalance}
      balanceMemes={localizedBalanceMemes}
      seasons={seasons}
      locale={locale}
    />
  );

  expect(
    screen.getAllByText(formatInteger(locale, 1234)).length
  ).toBeGreaterThan(0);
  expect(
    screen.getAllByText(`#${formatInteger(locale, 1234)}`).length
  ).toBeGreaterThan(0);
  expect(
    screen.getByText(
      (_, node) =>
        node?.textContent?.replace(/\s+/g, " ").trim() ===
        expectedUniqueProgress
    )
  ).toBeInTheDocument();
});
