import {
  fetchCollection,
  getCollectionView,
  getCollectionViewFromPathname,
  getContentViewKeyByValue,
} from "@/app/nextgen/collection/[collection]/page-utils";
import { useShallowRedirect } from "@/app/nextgen/collection/[collection]/useShallowRedirect";
import { NextgenCollectionView } from "@/types/enums";
import { render } from "@testing-library/react";

jest.mock("@/services/api/common-api", () => ({
  ...jest.requireActual("@/services/api/common-api"),
  commonApiFetch: jest.fn(),
}));
jest.mock("@/helpers/Helpers", () => ({ isEmptyObject: jest.fn(() => false) }));
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

const { commonApiFetch } = require("@/services/api/common-api");
const { isEmptyObject } = require("@/helpers/Helpers");
const { useRouter, usePathname } = require("next/navigation");

const apiError = (status: number) =>
  Object.assign(new Error(`HTTP ${status}`), { status });

describe("collection utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (isEmptyObject as jest.Mock).mockReturnValue(false);
  });

  it("fetchCollection returns collection", async () => {
    (commonApiFetch as jest.Mock).mockResolvedValue({ id: 1 });
    const res = await fetchCollection("Cool", {});
    expect(commonApiFetch).toHaveBeenCalled();
    expect(res).toEqual({ id: 1 });
  });

  it("fetchCollection returns null when empty", async () => {
    (isEmptyObject as jest.Mock).mockReturnValue(true);
    (commonApiFetch as jest.Mock).mockResolvedValue({});
    const res = await fetchCollection("c", {});
    expect(res).toBeNull();
  });

  it("requests the collection with structured errors so the status is readable", async () => {
    (commonApiFetch as jest.Mock).mockResolvedValue({ id: 1 });
    await fetchCollection("Cool-Name", { "x-test": "1" });
    expect(commonApiFetch).toHaveBeenCalledWith({
      endpoint: "nextgen/collections/Cool%20Name",
      headers: { "x-test": "1" },
      errorMode: "structured",
    });
  });

  it("fetchCollection returns null only for a real 404", async () => {
    (commonApiFetch as jest.Mock).mockRejectedValue(apiError(404));
    await expect(fetchCollection("missing", {})).resolves.toBeNull();
  });

  it.each([500, 502, 503, 429, 401])(
    "fetchCollection rethrows a %s instead of reporting not found",
    async (status) => {
      const error = apiError(status);
      (commonApiFetch as jest.Mock).mockRejectedValue(error);
      await expect(fetchCollection("broken", {})).rejects.toBe(error);
    }
  );

  it("fetchCollection rethrows network and timeout failures", async () => {
    const networkError = new TypeError("Failed to fetch");
    (commonApiFetch as jest.Mock).mockRejectedValue(networkError);
    await expect(fetchCollection("offline", {})).rejects.toBe(networkError);

    const timeoutError = new DOMException("timed out", "AbortError");
    (commonApiFetch as jest.Mock).mockRejectedValue(timeoutError);
    await expect(fetchCollection("slow", {})).rejects.toBe(timeoutError);
  });

  it("maps views correctly", () => {
    expect(getCollectionView("rarity")).toBe(NextgenCollectionView.RARITY);
    expect(getCollectionView("listings_and_offers")).toBe(
      NextgenCollectionView.OVERVIEW
    );
    expect(getContentViewKeyByValue(NextgenCollectionView.PROVENANCE)).toBe(
      "PROVENANCE"
    );
  });

  it("treats a view-named collection slug as the overview", () => {
    expect(
      getCollectionViewFromPathname("/nextgen/collection/provenance")
    ).toBe(NextgenCollectionView.OVERVIEW);
  });

  it("reads only the segment after a view-named collection slug", () => {
    expect(
      getCollectionViewFromPathname("/nextgen/collection/provenance/provenance")
    ).toBe(NextgenCollectionView.PROVENANCE);
  });

  it("useShallowRedirect replaces url", () => {
    const replace = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ replace });
    (usePathname as jest.Mock).mockReturnValue("/nextgen/collection/1");
    function Comp() {
      useShallowRedirect("Cool");
      return null;
    }
    render(<Comp />);
    expect(replace).toHaveBeenCalledWith("/nextgen/collection/cool", {
      scroll: false,
    });
  });
});
