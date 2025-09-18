jest.mock("../../../app/api/open-graph/utils", () => ({
  ensureUrlIsPublic: jest.fn().mockResolvedValue(undefined),
}));

import { buildOffice365Preview } from "../../../app/api/open-graph/office365";

const { ensureUrlIsPublic } = require("../../../app/api/open-graph/utils") as {
  ensureUrlIsPublic: jest.Mock;
};

const originalFetch = global.fetch;

const createResponse = (
  status: number,
  headers: Record<string, string | null> = {}
) => {
  const headerMap = new Map<string, string | null>();
  for (const [key, value] of Object.entries(headers)) {
    headerMap.set(key.toLowerCase(), value);
  }
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: {
      get: (name: string) => headerMap.get(name.toLowerCase()) ?? null,
    },
  } as Response;
};

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = originalFetch;
});

afterEach(() => {
  global.fetch = originalFetch;
});

describe("buildOffice365Preview", () => {
  it("creates a Word preview with viewer link", async () => {
    const openUrl = new URL(
      "https://tenant.sharepoint.com/:w:/r/documents/report.docx"
    );
    const html = "<html><head><title>Report</title></head></html>";
    const baseResponse = {
      title: "Q1 Report",
      url: openUrl.toString(),
      requestUrl: openUrl.toString(),
      image: { secureUrl: "https://cdn.example.com/preview.png" },
    };

    const headResponse = createResponse(200, {
      "content-type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    global.fetch = jest.fn().mockResolvedValue(headResponse) as jest.MockedFunction<
      typeof fetch
    >;

    const result = await buildOffice365Preview({
      originalUrl: openUrl,
      finalUrl: openUrl,
      html,
      contentType: "text/html",
      baseResponse,
    });

    expect(result).toEqual({
      type: "office.word",
      title: "Q1 Report",
      canonicalUrl: openUrl.toString(),
      thumbnail: "https://cdn.example.com/preview.png",
      links: {
        open: openUrl.toString(),
        preview:
          "https://view.officeapps.live.com/op/embed.aspx?src=https%3A%2F%2Ftenant.sharepoint.com%2F%3Aw%3A%2Fr%2Fdocuments%2Freport.docx%3Fdownload%3D1",
        officeViewer:
          "https://view.officeapps.live.com/op/embed.aspx?src=https%3A%2F%2Ftenant.sharepoint.com%2F%3Aw%3A%2Fr%2Fdocuments%2Freport.docx%3Fdownload%3D1",
        exportPdf: null,
      },
      availability: "public",
    });
    expect(ensureUrlIsPublic).toHaveBeenCalled();
  });

  it("builds an interactive Excel preview", async () => {
    const openUrl = new URL(
      "https://tenant.sharepoint.com/:x:/r/workbooks/sheet.xlsx"
    );
    const html = "<html><head><title>Workbook</title></head></html>";
    const baseResponse = {
      title: "Budget",
      url: openUrl.toString(),
      requestUrl: openUrl.toString(),
      image: null,
    };

    const failureResponse = createResponse(403);
    global.fetch = jest.fn().mockResolvedValue(failureResponse) as jest.MockedFunction<
      typeof fetch
    >;

    const result = await buildOffice365Preview({
      originalUrl: openUrl,
      finalUrl: openUrl,
      html,
      contentType: "text/html",
      baseResponse,
    });

    expect(result).toEqual({
      type: "office.excel",
      title: "Budget",
      canonicalUrl: openUrl.toString(),
      thumbnail: null,
      links: {
        open: openUrl.toString(),
        preview: "https://tenant.sharepoint.com/:x:/r/workbooks/sheet.xlsx?action=embedview",
        officeViewer: null,
        exportPdf: null,
      },
      availability: "public",
      excel: { allowInteractivity: true },
    });
  });

  it("marks links as unavailable when redirected to login", async () => {
    const openUrl = new URL(
      "https://tenant.sharepoint.com/:p:/r/presentations/update.pptx"
    );
    const loginUrl = new URL("https://login.microsoftonline.com/common/login");
    const html = "<html><head><title>Sign in to your account</title></head></html>";
    const baseResponse = {
      title: "Deck",
      url: openUrl.toString(),
      requestUrl: openUrl.toString(),
      image: null,
    };

    const result = await buildOffice365Preview({
      originalUrl: openUrl,
      finalUrl: loginUrl,
      html,
      contentType: "text/html",
      baseResponse,
    });

    expect(result).toEqual({
      type: "office.powerpoint",
      title: "Deck",
      canonicalUrl: openUrl.toString(),
      thumbnail: null,
      links: {
        open: openUrl.toString(),
        preview: null,
        officeViewer: null,
        exportPdf: null,
      },
      availability: "unavailable",
    });
    expect(global.fetch).toBe(originalFetch);
  });
});
