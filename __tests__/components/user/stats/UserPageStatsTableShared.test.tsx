import {
  UserPageStatsDisclosure,
  UserPageStatsTableHead,
  UserPageStatsTableScroll,
} from "@/components/user/stats/UserPageStatsTableShared";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { render, screen } from "@testing-library/react";
import React from "react";

describe("UserPageStatsTableShared", () => {
  it("renders table head with all columns", () => {
    const caption = t(
      DEFAULT_LOCALE,
      "user.collected.stats.details.tables.overviewCaption"
    );

    render(
      <table>
        <UserPageStatsTableHead caption={caption} />
      </table>
    );

    expect(screen.getByRole("table", { name: caption })).toBeInTheDocument();
    const headers = screen.getAllByRole("columnheader");
    expect(headers).toHaveLength(6);
    expect(headers[0]).toHaveTextContent(
      t(DEFAULT_LOCALE, "user.collected.stats.details.tables.column.metric")
    );
    expect(headers[0]).toHaveAttribute("scope", "col");
    expect(headers[1]).toHaveTextContent(
      t(DEFAULT_LOCALE, "user.collected.stats.details.tables.column.total")
    );
    expect(headers[5]).toHaveTextContent(
      t(DEFAULT_LOCALE, "user.collected.stats.details.tables.column.memeLab")
    );
  });

  it("renders an open disclosure and labelled scroll region", () => {
    const label = "Season activity";
    const { container } = render(
      <UserPageStatsDisclosure title="Overview">
        <UserPageStatsTableScroll label={label}>
          <table />
        </UserPageStatsTableScroll>
      </UserPageStatsDisclosure>
    );

    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(container.querySelector("details")).toHaveAttribute("open");
    expect(screen.getByRole("region", { name: label })).toHaveAttribute(
      "tabindex",
      "0"
    );
  });
});
