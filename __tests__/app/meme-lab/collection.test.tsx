import MemeLabCollectionPage, {
  generateMetadata,
} from "@/app/meme-lab/collection/[collection]/page";
import { fetchUrl } from "@/services/6529api";
import { render, screen } from "@testing-library/react";

jest.mock("@/services/6529api", () => ({
  fetchUrl: jest.fn(),
}));

jest.mock("@/config/env", () => ({
  publicEnv: {
    API_ENDPOINT: "https://api.test.6529.io",
    BASE_ENDPOINT: "https://6529.io",
  },
}));

jest.mock("@/components/memelab/MemeLabCollection", () => ({
  __esModule: true,
  default: (props: { readonly collectionName: string }) => (
    <div data-testid="meme-lab-collection">{props.collectionName}</div>
  ),
}));

const mockFetchUrl = fetchUrl as jest.Mock;
const NOT_FOUND_ERROR = { digest: "NEXT_HTTP_ERROR_FALLBACK;404" };

function renderPage(collection: string) {
  return MemeLabCollectionPage({
    params: Promise.resolve({ collection }),
  });
}

function getMetadata(collection: string) {
  return generateMetadata({ params: Promise.resolve({ collection }) });
}

describe("Meme Lab collection route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("looks the collection up by its decoded name", async () => {
    mockFetchUrl.mockResolvedValue({ data: [{ id: 1 }] });

    render(await renderPage("6529-Internal"));

    expect(mockFetchUrl).toHaveBeenCalledWith(
      "https://api.test.6529.io/api/lab_extended_data?collection=6529%20Internal&page_size=1",
      { cache: "no-store" }
    );
    expect(screen.getByTestId("meme-lab-collection")).toHaveTextContent(
      "6529 Internal"
    );
  });

  it("answers not found when no card belongs to the collection", async () => {
    mockFetchUrl.mockResolvedValue({ data: [] });

    await expect(renderPage("does-not-exist")).rejects.toMatchObject(
      NOT_FOUND_ERROR
    );
    await expect(getMetadata("does-not-exist")).rejects.toMatchObject(
      NOT_FOUND_ERROR
    );
  });

  it("answers not found for an empty collection name without calling the API", async () => {
    await expect(renderPage("---")).rejects.toMatchObject(NOT_FOUND_ERROR);

    expect(mockFetchUrl).not.toHaveBeenCalled();
  });

  it.each([
    ["a null data field", { data: null }],
    ["a missing data field", {}],
    ["a non-array data field", { data: "oops" }],
    ["an empty response body", null],
  ])(
    "keeps rendering for %s instead of treating it as a missing collection",
    async (_label, payload) => {
      mockFetchUrl.mockResolvedValue(payload);

      render(await renderPage("Pepe-Wizard"));

      expect(screen.getByTestId("meme-lab-collection")).toHaveTextContent(
        "Pepe Wizard"
      );
      await expect(getMetadata("Pepe-Wizard")).resolves.toMatchObject({
        title: expect.stringContaining("Pepe Wizard"),
      });
    }
  );

  it("keeps rendering when the API is unavailable so the client can retry", async () => {
    mockFetchUrl.mockRejectedValue(new Error("HTTP error! status: 503"));
    jest.spyOn(console, "warn").mockImplementation(() => undefined);

    render(await renderPage("Pepe-Wizard"));

    expect(screen.getByTestId("meme-lab-collection")).toHaveTextContent(
      "Pepe Wizard"
    );
    await expect(getMetadata("Pepe-Wizard")).resolves.toMatchObject({
      title: expect.stringContaining("Pepe Wizard"),
    });
  });
});
