import MappingToolInstructions from "@/components/mapping-tools/MappingToolInstructions";
import { render, screen, waitFor } from "@testing-library/react";

const URL_UNDER_TEST =
  "https://6529bucket.s3.eu-west-1.amazonaws.com/seize_html/delegation-mapping-tool/how-to-use.html";

function mockFetch(implementation: jest.Mock) {
  globalThis.fetch = implementation as unknown as typeof fetch;
}

function htmlResponse(html: string, status = 200) {
  return { status, text: () => Promise.resolve(html) };
}

describe("MappingToolInstructions", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("renders the fetched instructions in the how-to-use section", async () => {
    mockFetch(
      jest
        .fn()
        .mockResolvedValue(
          htmlResponse(
            "<h4>How to use the tool?</h4><br /><ol><li>Prepare your list</li></ol>"
          )
        )
    );

    const { container } = render(
      <MappingToolInstructions url={URL_UNDER_TEST} />
    );

    expect(
      await screen.findByRole("heading", { name: "How to use the tool?" })
    ).toBeInTheDocument();
    expect(
      container.querySelector("#how-to-use .htmlContainer")
    ).not.toBeNull();
    expect(screen.getByText("Prepare your list")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("keeps the links of the instructions and sanitizes the markup", async () => {
    mockFetch(
      jest
        .fn()
        .mockResolvedValue(
          htmlResponse(
            '<ol onclick="alert(1)"><li>Refer to this <a href="https://example.com/sample.csv" target="_blank" rel="noreferrer">sample upload file</a>' +
              '<a href="javascript:alert(1)">Bad link</a></li></ol>' +
              '<script>window.hacked = 1</script><img src="x" onerror="alert(2)">'
          )
        )
    );

    const { container } = render(
      <MappingToolInstructions url={URL_UNDER_TEST} />
    );

    const link = await screen.findByRole("link", {
      name: "sample upload file",
    });
    expect(link).toHaveAttribute("href", "https://example.com/sample.csv");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByText("Bad link")).not.toHaveAttribute("href");
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("[onclick]")).toBeNull();
    expect(container.querySelector("[onerror]")).toBeNull();
  });

  it("requests the instructions once and can abort the request", async () => {
    const fetchMock = jest.fn().mockResolvedValue(htmlResponse("<p>Hello</p>"));
    mockFetch(fetchMock);

    const { unmount } = render(
      <MappingToolInstructions url={URL_UNDER_TEST} />
    );
    await screen.findByText("Hello");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [requestedUrl, init] = fetchMock.mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(requestedUrl).toBe(URL_UNDER_TEST);
    expect(init.signal?.aborted).toBe(false);

    unmount();
    expect(init.signal?.aborted).toBe(true);
  });

  it.each([
    [
      "a non-200 response",
      () => Promise.resolve(htmlResponse("<p>Not found</p>", 404)),
    ],
    ["a network failure", () => Promise.reject(new Error("offline"))],
    [
      "an unreadable body",
      () =>
        Promise.resolve({
          status: 200,
          text: () => Promise.reject(new Error("broken body")),
        }),
    ],
  ])("shows an accessible message after %s", async (_label, respond) => {
    mockFetch(jest.fn(respond));

    const { container } = render(
      <MappingToolInstructions url={URL_UNDER_TEST} />
    );

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      "The instructions could not be loaded. Please try again later."
    );
    expect(screen.queryByText("Not found")).not.toBeInTheDocument();
    expect(container.querySelector("#how-to-use")).not.toBeNull();
  });

  it("does not report an error when the request is aborted by unmounting", async () => {
    let rejectFetch: (reason: Error) => void = () => undefined;
    mockFetch(
      jest.fn(
        () =>
          new Promise((_resolve, reject) => {
            rejectFetch = reject;
          })
      )
    );
    const errorSpy = jest.spyOn(console, "error").mockImplementation();

    const { unmount } = render(
      <MappingToolInstructions url={URL_UNDER_TEST} />
    );
    unmount();
    rejectFetch(new DOMException("Aborted", "AbortError"));
    await waitFor(() => expect(errorSpy).not.toHaveBeenCalled());

    errorSpy.mockRestore();
  });
});
