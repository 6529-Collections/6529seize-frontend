import AboutPrimaryAddress from "@/components/about/AboutPrimaryAddress";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";

describe("AboutPrimaryAddress", () => {
  const currentAlpha = "0x1111111111111111111111111111111111111111";
  const changedAlpha = "0x2222222222222222222222222222222222222222";
  const currentBeta = "0x3333333333333333333333333333333333333333";
  const changedBeta = "0x4444444444444444444444444444444444444444";
  const csv = [
    `2,beta,${currentBeta},${changedBeta}`,
    `1,alpha,${currentAlpha},${changedAlpha}`,
  ].join("\n");
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
      `/${currentAlpha}`
    );
  });

  it("uses a labeled, keyboard-focusable vertical scroll region without search", async () => {
    renderWithQueryClient();

    await screen.findByRole("link", { name: "alpha" });
    expect(
      screen.getByRole("region", {
        name: "Primary address records",
      })
    ).toHaveAttribute("tabindex", "0");
    expect(screen.queryByRole("searchbox")).toBeNull();
  });

  it("renders a single record without changing its profile target", async () => {
    mockFetchWithCsv(`1,solo,${currentAlpha},${changedAlpha}`);
    renderWithQueryClient();

    const link = await screen.findByRole("link", { name: "solo" });
    expect(link).toHaveAttribute("href", `/${currentAlpha}`);
    expect(screen.getAllByRole("row")).toHaveLength(2);
  });

  it("preserves lexical ordering for handles that start with numbers", async () => {
    mockFetchWithCsv(
      [
        `3,4lteredBeast,${currentAlpha},${changedAlpha}`,
        `2,2601,${currentAlpha},${changedAlpha}`,
        `1,100series,${currentAlpha},${changedAlpha}`,
      ].join("\n")
    );
    renderWithQueryClient();

    await screen.findByRole("link", { name: "100series" });
    const rows = screen.getAllByRole("row");
    expect(rows[1]).toHaveTextContent("100series");
    expect(rows[2]).toHaveTextContent("2601");
    expect(rows[3]).toHaveTextContent("4lteredBeast");
  });

  it("ignores header, invalid, incomplete, and duplicate profile records", async () => {
    mockFetchWithCsv(
      [
        "profile_id,handle,current_primary,new_primary",
        `,missing-id,${currentAlpha},${changedAlpha}`,
        `1,"valid, quoted",${currentAlpha},${changedAlpha}`,
        `1,duplicate,${currentBeta},${changedBeta}`,
        `2,second,${currentBeta},${changedBeta}`,
        `3,missing-new,${currentAlpha},`,
        `4,invalid-address,not-an-address,${changedAlpha}`,
        `5,extra-column,${currentAlpha},${changedAlpha},unexpected`,
      ].join("\n")
    );
    renderWithQueryClient();

    await screen.findByRole("link", { name: "valid, quoted" });
    expect(screen.getAllByRole("row")).toHaveLength(3);
    expect(screen.getByRole("link", { name: "second" })).toHaveAttribute(
      "href",
      `/${currentBeta}`
    );
    expect(screen.queryByRole("link", { name: "handle" })).toBeNull();
    expect(screen.queryByRole("link", { name: "duplicate" })).toBeNull();
    expect(screen.queryByRole("link", { name: "missing-id" })).toBeNull();
    expect(screen.queryByRole("link", { name: "missing-new" })).toBeNull();
    expect(screen.queryByRole("link", { name: "invalid-address" })).toBeNull();
    expect(screen.queryByRole("link", { name: "extra-column" })).toBeNull();
  });

  it("keeps the table structure when the data set is empty", async () => {
    mockFetchWithCsv("");
    renderWithQueryClient();

    const table = await screen.findByRole("table", {
      name: /the following table shows the profiles/i,
    });
    expect(table).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(1);
    expect(
      screen.getByRole("region", { name: "Primary address records" })
    ).not.toHaveAttribute("tabindex");
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
