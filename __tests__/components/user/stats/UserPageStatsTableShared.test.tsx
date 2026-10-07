import {
  UserPageStatsDisclosure,
  UserPageStatsTableHead,
  UserPageStatsTableScroll,
} from "@/components/user/stats/UserPageStatsTableShared";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

jest.mock("@/hooks/useMediaQuery", () => ({
  useMediaQuery: jest.fn(() => true),
}));

describe("UserPageStatsTableShared", () => {
  beforeEach(() => {
    jest.mocked(useMediaQuery).mockReturnValue(true);
  });

  it("starts mobile disclosures closed while keeping their titles available", () => {
    jest.mocked(useMediaQuery).mockReturnValue(false);
    const { container } = render(
      <UserPageStatsDisclosure title="Overview">
        <UserPageStatsTableScroll label="Holdings overview">
          <table aria-label="Holdings" />
        </UserPageStatsTableScroll>
      </UserPageStatsDisclosure>
    );

    expect(screen.getByText("Overview")).toBeVisible();
    expect(container.querySelector("details")).not.toHaveAttribute("open");
    expect(screen.getByRole("table", { name: "Holdings" })).not.toBeVisible();
  });

  it("scrolls from the keyboard without intercepting child controls or shortcuts", () => {
    render(
      <UserPageStatsTableScroll label="Holdings overview">
        <button type="button">Boost info</button>
      </UserPageStatsTableScroll>
    );
    const region = screen.getByRole("region", { name: "Holdings overview" });
    const scrollBy = jest.fn();
    region.scrollBy = scrollBy;

    expect(fireEvent.keyDown(region, { key: "ArrowRight" })).toBe(false);
    expect(scrollBy).toHaveBeenLastCalledWith({ left: 40 });
    expect(fireEvent.keyDown(region, { key: "ArrowLeft" })).toBe(false);
    expect(scrollBy).toHaveBeenLastCalledWith({ left: -40 });
    expect(fireEvent.keyDown(region, { key: "ArrowLeft", altKey: true })).toBe(
      true
    );
    expect(
      fireEvent.keyDown(screen.getByRole("button"), { key: "ArrowRight" })
    ).toBe(true);
    expect(scrollBy).toHaveBeenCalledTimes(2);
  });

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

  it("keeps desktop disclosures open with a labelled scroll region", () => {
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
