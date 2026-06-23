import {
  UserPageStatsTableHead,
  UserPageStatsTableHr,
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
    expect(headers).toHaveLength(5);
    expect(headers[0]).toHaveTextContent(
      t(DEFAULT_LOCALE, "user.collected.stats.details.tables.column.total")
    );
    expect(headers[0]).toHaveAttribute("scope", "col");
    expect(headers[4]).toHaveTextContent(
      t(DEFAULT_LOCALE, "user.collected.stats.details.tables.column.memeLab")
    );
  });

  it("renders hr row spanning specified columns", () => {
    const { container } = render(
      <table>
        <tbody>
          <UserPageStatsTableHr span={4} />
        </tbody>
      </table>
    );
    const separatorRow = container.querySelector('tr[aria-hidden="true"]');
    const cell = separatorRow?.querySelector("td") ?? null;

    expect(separatorRow).toBeInTheDocument();
    expect(cell).not.toBeNull();
    expect(cell!).toHaveAttribute("colspan", "4");
  });
});
