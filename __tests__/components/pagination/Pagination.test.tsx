import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Pagination from "@/components/pagination/Pagination";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { ComponentProps } from "react";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: jest.fn(),
}));
jest.mock("@/i18n/messages", () => {
  const messages = jest.requireActual("@/i18n/messages");
  return { ...messages, t: jest.fn(messages.t) };
});

const useBrowserLocaleMock = jest.mocked(useBrowserLocale);
const translateMock = jest.mocked(t);
const translate =
  jest.requireActual<typeof import("@/i18n/messages")>("@/i18n/messages").t;
type PaginationProps = ComponentProps<typeof Pagination>;

function renderPagination(overrides: Partial<PaginationProps> = {}) {
  const setPage = jest.fn();
  render(
    <Pagination
      page={1}
      pageSize={10}
      totalResults={30}
      setPage={setPage}
      {...overrides}
    />
  );
  return setPage;
}

describe("Pagination", () => {
  beforeEach(() => {
    useBrowserLocaleMock.mockReturnValue("en-US");
    translateMock.mockImplementation(translate);
  });

  it("advances to the next page when activated with the Enter key", async () => {
    const user = userEvent.setup();
    const setPage = renderPagination();

    const nextButton = screen.getByRole("button", { name: /next page/i });
    nextButton.focus();
    expect(nextButton).toHaveFocus();

    await user.keyboard("{Enter}");

    expect(setPage).toHaveBeenCalledTimes(1);
    expect(setPage).toHaveBeenCalledWith(2);
  });

  it("returns to the previous page when activated with the Space key", async () => {
    const user = userEvent.setup();
    const setPage = renderPagination({ page: 2 });

    const previousButton = screen.getByRole("button", {
      name: /previous page/i,
    });
    previousButton.focus();
    expect(previousButton).toHaveFocus();

    await user.keyboard(" ");

    expect(setPage).toHaveBeenCalledTimes(1);
    expect(setPage).toHaveBeenCalledWith(1);
  });

  it("formats both page values while preserving raw numeric editing", async () => {
    const user = userEvent.setup();
    const setPage = renderPagination({
      page: 12345,
      pageSize: 1,
      totalResults: 20598,
    });

    const pageInput = screen.getByRole("textbox", { name: "Page number" });
    expect(pageInput).toHaveValue("12,345");
    expect(
      screen.getByRole("button", { name: "Go to last page" })
    ).toHaveTextContent("20,598");

    await user.click(pageInput);
    expect(pageInput).toHaveValue("12345");
    await user.clear(pageInput);
    await user.type(pageInput, "12346{Enter}");

    expect(setPage).toHaveBeenCalledWith(12346);
  });

  it("uses the active locale for labels and number grouping", () => {
    useBrowserLocaleMock.mockReturnValue("de-DE");
    renderPagination({ page: 12345, pageSize: 1, totalResults: 20598 });

    expect(screen.getByRole("textbox", { name: "Seitenzahl" })).toHaveValue(
      "12.345"
    );
    expect(
      screen.getByRole("button", { name: "Zur letzten Seite" })
    ).toHaveTextContent("20.598");
    expect(
      screen.getByRole("button", { name: "Vorherige Seite" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Nächste Seite" })
    ).toBeInTheDocument();
  });

  it("keeps both page controls when a translation omits a placeholder", () => {
    translateMock.mockImplementation((locale, key, params) =>
      key === "common.pagination.currentOfTotal"
        ? String(params?.current)
        : translate(locale, key, params)
    );

    renderPagination({ page: 12345, pageSize: 1, totalResults: 20598 });

    expect(screen.getByRole("textbox", { name: "Page number" })).toHaveValue(
      "12,345"
    );
    expect(
      screen.getByRole("button", { name: "Go to last page" })
    ).toHaveTextContent("20,598");
  });
});
