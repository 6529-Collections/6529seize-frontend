import QueryClientSetup from "@/components/providers/QueryClientSetup";
import {
  environmentManager,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { renderToString } from "react-dom/server";

describe("QueryClientSetup", () => {
  afterEach(() => jest.restoreAllMocks());

  it("isolates query data between server renders", () => {
    jest.spyOn(environmentManager, "isServer").mockReturnValue(true);
    const clients: QueryClient[] = [];
    function CaptureClient() {
      const client = useQueryClient();
      clients.push(client);
      return (
        <span>{client.getQueryData<string>(["private-data"]) ?? "empty"}</span>
      );
    }

    renderToString(
      <QueryClientSetup>
        <CaptureClient />
      </QueryClientSetup>
    );
    clients[0]!.setQueryData(["private-data"], "previous request");
    const secondHtml = renderToString(
      <QueryClientSetup>
        <CaptureClient />
      </QueryClientSetup>
    );

    expect(clients[0]).not.toBe(clients[1]);
    expect(clients[0]!.getDefaultOptions().queries?.gcTime).toBe(Infinity);
    expect(secondHtml).toContain("empty");
    expect(secondHtml).not.toContain("previous request");
    clients.forEach((client) => client.clear());
  });

  it("preserves the cache across client rerenders", () => {
    const clients: QueryClient[] = [];
    function CaptureClient() {
      clients.push(useQueryClient());
      return null;
    }
    const view = render(
      <QueryClientSetup>
        <CaptureClient />
      </QueryClientSetup>
    );
    clients[0]!.setQueryData(["public-data"], "cached");
    view.rerender(
      <QueryClientSetup>
        <CaptureClient />
      </QueryClientSetup>
    );

    expect(clients[0]).toBe(clients[1]);
    expect(clients[1]!.getQueryData(["public-data"])).toBe("cached");
    clients[0]!.clear();
  });

  describe("default retry policy", () => {
    const mountClient = () => {
      let client: QueryClient | undefined;
      function CaptureClient() {
        client = useQueryClient();
        return null;
      }
      render(
        <QueryClientSetup>
          <CaptureClient />
        </QueryClientSetup>
      );
      return client!;
    };
    const apiError = (status: number) =>
      Object.assign(new Error(`HTTP ${status}`), { name: "ApiError", status });
    const run = async (
      client: QueryClient,
      error: unknown,
      options: { readonly retry?: number | false } = {}
    ) => {
      const queryFn = jest.fn().mockRejectedValue(error);
      await client
        .fetchQuery({
          queryKey: ["retry-policy"],
          queryFn,
          retryDelay: 0,
          ...options,
        })
        .catch(() => undefined);
      client.clear();
      return queryFn.mock.calls.length;
    };

    it.each([400, 401, 403, 404, 429])(
      "does not retry a structured %i response",
      async (status) => {
        expect(await run(mountClient(), apiError(status))).toBe(1);
      }
    );

    it.each([
      ["a structured 500 response", apiError(500)],
      ["a network failure", new TypeError("Failed to fetch")],
      ["a legacy string rejection", "Too Many Requests"],
    ])("retries %s up to three times", async (_label, error) => {
      expect(await run(mountClient(), error)).toBe(4);
    });

    it("lets a per-query retry setting override the default", async () => {
      const client = mountClient();

      expect(await run(client, apiError(500), { retry: false })).toBe(1);
      expect(await run(client, apiError(429), { retry: 2 })).toBe(3);
    });

    it("keeps the server default of no retries", () => {
      jest.spyOn(environmentManager, "isServer").mockReturnValue(true);
      const clients: QueryClient[] = [];
      function CaptureClient() {
        clients.push(useQueryClient());
        return null;
      }
      renderToString(
        <QueryClientSetup>
          <CaptureClient />
        </QueryClientSetup>
      );

      expect(clients[0]!.getDefaultOptions().queries?.retry).toBe(0);
      clients[0]!.clear();
    });
  });
});
