import { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import {
  ShellSearchParamsProvider,
  useShellSearchParams,
} from "@/contexts/ShellSearchParamsContext";

// The jsdom build selects the browser variant. renderToString runs it with the
// server snapshot, which gives the same HTML as the server variant (covered in
// ShellSearchParamsContext.server.test.tsx), so this hydrates real server output.
const mockLocation = { pathname: "/", search: "" };
const mockParamsCache = new Map<string, URLSearchParams>();

jest.mock("next/navigation", () => ({
  usePathname: () => mockLocation.pathname,
  useSearchParams: () => {
    const key = mockLocation.search;
    let params = mockParamsCache.get(key);
    if (!params) {
      params = new URLSearchParams(key);
      mockParamsCache.set(key, params);
    }
    return params;
  },
}));

const renders: Array<string | null> = [];

function ReaderValue() {
  const params = useShellSearchParams(mockLocation.pathname);
  const value = params === null ? null : params.toString();
  renders.push(value);
  return <output>{value ?? "none"}</output>;
}

function Reader() {
  return (
    <ShellSearchParamsProvider>
      <ReaderValue />
    </ShellSearchParamsProvider>
  );
}

async function hydrateAt(pathname: string, search: string) {
  mockLocation.pathname = pathname;
  mockLocation.search = search;
  const container = document.createElement("div");
  container.innerHTML = renderToString(<Reader />);
  document.body.appendChild(container);
  const serverText = container.textContent;
  renders.length = 0;
  const onRecoverableError = jest.fn();
  let root: ReturnType<typeof hydrateRoot> | undefined;
  await act(async () => {
    root = hydrateRoot(container, <Reader />, { onRecoverableError });
  });
  return { container, serverText, onRecoverableError, root: root! };
}

afterEach(() => {
  document.body.innerHTML = "";
  mockParamsCache.clear();
});

it.each([
  ["/", "wave=wave&serialNo=42"],
  ["/the-memes/1", "drop=drop"],
  ["/network", ""],
])(
  "hides the query on public route %s?%s until hydration ends",
  async (pathname, search) => {
    const { container, serverText, onRecoverableError, root } = await hydrateAt(
      pathname,
      search
    );
    expect(serverText).toBe("none");
    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(renders).toEqual([null, search]);
    expect(container.textContent).toBe(search);
    act(() => root.unmount());
  }
);

it.each([
  ["/waves/wave", "serialNo=42"],
  ["/messages/dm", "drop=drop"],
  ["/waves", "wave=wave"],
  ["/notifications", "drop=drop"],
  ["/my-stream", "wave=wave"],
])(
  "reads the query on wave/chat route %s?%s in the server and hydration render",
  async (pathname, search) => {
    const { container, serverText, onRecoverableError, root } = await hydrateAt(
      pathname,
      search
    );
    expect(serverText).toBe(search);
    expect(onRecoverableError).not.toHaveBeenCalled();
    // No second render: the hydration render already had the query.
    expect(renders).toEqual([search]);
    expect(container.textContent).toBe(search);
    act(() => root.unmount());
  }
);

it("reads the live query on public routes after hydration", async () => {
  const { container, root } = await hydrateAt("/", "");
  renders.length = 0;
  mockLocation.pathname = "/the-memes/2";
  mockLocation.search = "wave=other&serialNo=7";
  await act(async () => root.render(<Reader />));
  expect(renders).toEqual(["wave=other&serialNo=7"]);
  expect(container.textContent).toBe("wave=other&serialNo=7");
  act(() => root.unmount());
});
