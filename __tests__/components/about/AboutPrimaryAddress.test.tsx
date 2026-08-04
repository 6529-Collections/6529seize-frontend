import AboutPrimaryAddress from "@/components/about/AboutPrimaryAddress";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";

jest.mock("csv-parser", () => {
  return () => {
    const handlers: Record<string, Array<(value?: unknown) => void>> = {};
    const parser = {
      on(event: string, cb: (value?: unknown) => void) {
        handlers[event] = handlers[event] || [];
        handlers[event].push(cb);
        return parser;
      },
      write(data: string) {
        const lines = data.split(/\r?\n/).filter(Boolean);
        for (const line of lines) {
          const values = line.split(",");
          const row: Record<string, string> = {};
          values.forEach((v, i) => {
            row[String(i)] = v;
          });
          handlers["data"]?.forEach((fn) => fn(row));
        }
        return parser;
      },
      end() {
        handlers["end"]?.forEach((fn) => fn());
        return parser;
      },
    };
    return parser;
  };
});

describe("AboutPrimaryAddress", () => {
  const csv = "2,beta,bcur,bnew\n1,alpha,acur,anew";
  const originalFetch = globalThis.fetch;
  let queryClient: QueryClient;

  const renderWithQueryClient = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <AboutPrimaryAddress />
      </QueryClientProvider>
    );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    mockFetchWithCsv(csv);
  });

  function mockFetchWithCsv(csvContent: string) {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(csvContent),
    }) as jest.MockedFunction<typeof fetch>;
  }

  afterEach(() => {
    queryClient.clear();
    jest.clearAllMocks();
    globalThis.fetch = originalFetch;
  });

  it("renders the existing page copy and a sorted accessible table", async () => {
    renderWithQueryClient();

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "alpha" })).toBeInTheDocument();
    });

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "On-Chain Primary Address",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Overview",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "Single Address" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Primary address is the wallet address (no other addresses involved)"
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'If any of the addresses in the consolidation has registered a delegation for "Primary Address" use case (997) to an address in the same consolidation, then this delegated address becomes the Primary address of the consolidation'
      )
    ).toBeInTheDocument();

    const table = screen.getByRole("table", {
      name: /the following table shows the profiles/i,
    });
    const rows = screen.getAllByRole("row");
    const headers = screen.getAllByRole("columnheader");

    expect(table).toBeInTheDocument();
    expect(rows).toHaveLength(3);
    expect(rows[1]).toHaveTextContent("alpha");
    expect(rows[2]).toHaveTextContent("beta");
    expect(headers).toHaveLength(3);
    headers.forEach((header) => expect(header).toHaveAttribute("scope", "col"));
    expect(headers[0]).toHaveTextContent("Profile Handle");
    expect(headers[1]).toHaveTextContent("Current Selected Primary Address");
    expect(headers[2]).toHaveTextContent("Primary Address Changed to");
    expect(screen.getByRole("link", { name: "alpha" })).toHaveAttribute(
      "href",
      "/acur"
    );
  });

  it("uses a labeled, keyboard-focusable vertical scroll region without search", async () => {
    renderWithQueryClient();

    await screen.findByRole("link", { name: "alpha" });
    expect(
      screen.getByRole("region", {
        name: /the following table shows the profiles/i,
      })
    ).toHaveAttribute("tabindex", "0");
    expect(screen.queryByRole("searchbox")).toBeNull();
  });

  it("renders a single record without changing its profile target", async () => {
    mockFetchWithCsv("1,solo,0xcurrent,0xchanged");
    renderWithQueryClient();

    const link = await screen.findByRole("link", { name: "solo" });
    expect(link).toHaveAttribute("href", "/0xcurrent");
    expect(screen.getAllByRole("row")).toHaveLength(2);
  });

  it("keeps the table structure when the data set is empty", async () => {
    mockFetchWithCsv("");
    renderWithQueryClient();

    const table = await screen.findByRole("table", {
      name: /the following table shows the profiles/i,
    });
    expect(table).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(1);
  });

  it("keeps the existing error copy when loading fails", async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new Error("offline"));
    renderWithQueryClient();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Error: offline"
    );
    expect(screen.queryByRole("button")).toBeNull();
  });
});
