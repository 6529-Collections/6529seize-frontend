import ProfileAvatar from "@/components/common/profile/ProfileAvatar";
import ComingUpAvatar from "@/components/home/next-mint-leading/ComingUpAvatar";
import { act, fireEvent, render, waitFor } from "@testing-library/react";

jest.mock("@/components/ipfs/IPFSContext", () => ({
  resolveIpfsUrlSync: (src: string) => src,
}));

const ipfs = "https://media.6529usercontent.com/ipfs/avatar-cid";
const cdn = "https://d3lqz0a4bldqgf.cloudfront.net/pfp/user/avatar.png";
const jpeg = [0xff, 0xd8, 0xff];
const fetchMock = jest.spyOn(globalThis, "fetch");

function signatureResponse(bytes = jpeg, status = 206) {
  return {
    status,
    arrayBuffer: async () => Uint8Array.from(bytes).buffer,
    body: { cancel: jest.fn() },
  } as unknown as Response;
}

beforeEach(() => {
  fetchMock.mockReset().mockResolvedValue(signatureResponse());
});

afterAll(() => fetchMock.mockRestore());

it("offers density-aware sizes for the extensionless static source", async () => {
  const { container } = render(<ComingUpAvatar pfpUrl={ipfs} />);
  await waitFor(() => expect(container.querySelector("img")).not.toBeNull());
  const image = container.querySelector("img")!;
  expect(fetchMock).toHaveBeenCalledWith(
    ipfs,
    expect.objectContaining({
      headers: { Range: "bytes=0-63" },
    })
  );
  expect(image).toHaveAttribute("sizes", "28px");
  expect(image.getAttribute("srcset")).toEqual(
    expect.stringContaining("w=32&q=75 32w")
  );
  for (const width of [64, 96, 128]) {
    expect(image.getAttribute("srcset")).toContain(`w=${width}&q=75 ${width}w`);
  }
  expect(image.getAttribute("src")).toContain(encodeURIComponent(ipfs));
  expect(image).toHaveAttribute("alt", "");
  expect(image).toHaveClass("tw-object-cover");
  expect(container.firstElementChild).toHaveClass(
    "tw-h-7",
    "tw-w-7",
    "tw-rounded-lg"
  );
});

it("resizes the original CDN source and keeps its existing failure fallback", async () => {
  const { container } = render(<ComingUpAvatar pfpUrl={cdn} />);
  await waitFor(() =>
    expect(container.querySelector("img")).toHaveAttribute("sizes", "28px")
  );
  const image = container.querySelector("img")!;
  expect(decodeURIComponent(image.getAttribute("src")!)).toContain(cdn);
  expect(image.getAttribute("src")).not.toContain("AUTOx50");
  fireEvent.error(image);
  expect(image).toHaveAttribute(
    "src",
    cdn.replace("/avatar.png", "/AUTOx50/avatar.png")
  );
  expect(image).not.toHaveAttribute("srcset");
  fireEvent.error(image);
  expect(container.querySelector("img")).toBe(image);
});

it("retains arbitrary remote sources without probing or optimization", () => {
  const src = "https://i.seadn.io/avatar.png";
  const { container } = render(<ComingUpAvatar pfpUrl={src} />);
  expect(container.querySelector("img")).toHaveAttribute("src", src);
  expect(container.querySelector("img")).not.toHaveAttribute("srcset");
  expect(fetchMock).not.toHaveBeenCalled();
});

it.each([
  ["GIF", [71, 73, 70, 56, 57, 97]],
  [
    "animated AVIF",
    [
      0, 0, 0, 24, 102, 116, 121, 112, 97, 118, 105, 115, 0, 0, 0, 0, 97, 118,
      105, 115, 109, 105, 102, 49,
    ],
  ],
  ["unknown", [1, 2, 3]],
])("keeps the working source for %s", async (_format, bytes) => {
  fetchMock.mockResolvedValue(signatureResponse(bytes));
  const { container } = render(<ComingUpAvatar pfpUrl={ipfs} />);
  await waitFor(() =>
    expect(container.querySelector("img")).toHaveAttribute("src", ipfs)
  );
  expect(container.querySelector("img")).not.toHaveAttribute("srcset");
});

it("cancels an ignored range response and uses the existing source", async () => {
  const response = signatureResponse(jpeg, 200);
  fetchMock.mockResolvedValue(response);
  const { container } = render(<ComingUpAvatar pfpUrl={ipfs} />);
  await waitFor(() =>
    expect(container.querySelector("img")).toHaveAttribute("src", ipfs)
  );
  expect(response.body!.cancel).toHaveBeenCalled();
});

it("preserves a usable source when the format request fails", async () => {
  fetchMock.mockRejectedValue(new Error("network unavailable"));
  const { container } = render(<ComingUpAvatar pfpUrl={ipfs} />);
  await waitFor(() =>
    expect(container.querySelector("img")).toHaveAttribute("src", ipfs)
  );
});

it("falls back after a stalled format request", async () => {
  jest.useFakeTimers();
  try {
    fetchMock.mockReturnValue(new Promise(() => {}));
    const { container } = render(<ComingUpAvatar pfpUrl={ipfs} />);
    act(() => jest.advanceTimersByTime(5_000));
    expect(container.querySelector("img")).toHaveAttribute("src", ipfs);
  } finally {
    jest.useRealTimers();
  }
});

it("accounts for the effective width of a landscape cover crop", async () => {
  const { container } = render(<ComingUpAvatar pfpUrl={ipfs} />);
  await waitFor(() => expect(container.querySelector("img")).not.toBeNull());
  const image = container.querySelector("img")!;
  Object.defineProperties(image, {
    naturalWidth: { configurable: true, value: 128 },
    naturalHeight: { configurable: true, value: 64 },
  });
  fireEvent.load(image);
  await waitFor(() => expect(image).toHaveAttribute("sizes", "56px"));
});

it("keeps a missing avatar empty and does not fetch", () => {
  const { container } = render(<ComingUpAvatar pfpUrl={null} />);
  expect(container.querySelector("img")).toBeNull();
  expect(container.firstElementChild).toHaveClass("tw-h-7", "tw-w-7");
  expect(fetchMock).not.toHaveBeenCalled();
});

it("leaves the shared avatar default source and fallback unchanged", () => {
  const { container, rerender } = render(
    <ProfileAvatar pfpUrl={cdn} alt="Artist" />
  );
  expect(container.querySelector("img")).toHaveAttribute(
    "src",
    cdn.replace("/avatar.png", "/AUTOx50/avatar.png")
  );
  expect(container.querySelector("img")).toHaveAttribute("alt", "Artist");
  expect(container.querySelector("img")).not.toHaveAttribute("srcset");
  rerender(<ProfileAvatar pfpUrl={null} fallbackContent="Initials" />);
  expect(container).toHaveTextContent("Initials");
  expect(fetchMock).not.toHaveBeenCalled();
});
