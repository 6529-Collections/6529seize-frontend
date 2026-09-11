import { render } from "@testing-library/react";
import DocumentationRecordValue from "@/components/artwork-documentation/DocumentationRecordValue";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: jest.fn(),
}));

const mockBrowserLocale = jest.mocked(useBrowserLocale);

describe("artwork record formatting", () => {
  beforeEach(() => {
    mockBrowserLocale.mockReturnValue("en-GB");
  });

  it.each([
    ["year", "2026", "2026"],
    ["month", "2026-06", "June 2026"],
    ["day", "2026-06-07", "7 June 2026"],
    ["day", "2026-02-30", "2026-02-30"],
    ["month", "2026-13", "2026-13"],
  ])(
    "preserves %s precision and the recorded date %s",
    (precision, start, expected) => {
      const { container } = render(
        <DocumentationRecordValue value={{ precision, start }} />
      );
      expect(container.textContent).toBe(expected);
    }
  );

  it("formats an approximate range in the reader's locale without adding days", () => {
    mockBrowserLocale.mockReturnValue("fr-FR");
    const { container } = render(
      <DocumentationRecordValue
        value={{
          precision: "range",
          endpoint_precision: "month",
          start: "2026-04",
          end: "2026-05",
          approximate: true,
        }}
      />
    );
    expect(container.textContent).toBe("Approximately avril 2026 – mai 2026");
  });

  it("formats declared pixel dimensions in the reader's locale", () => {
    mockBrowserLocale.mockReturnValue("de-DE");
    const { container } = render(
      <DocumentationRecordValue value={{ width: 1320, height: 880 }} />
    );
    expect(container.textContent).toBe("1.320 × 880 pixels");
  });
});
