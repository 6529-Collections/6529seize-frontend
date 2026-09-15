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
});
