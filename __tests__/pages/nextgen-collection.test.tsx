import { useShallowRedirect } from "@/app/nextgen/collection/[collection]/useShallowRedirect";
import { fetchCollection, getCollectionView, getContentViewKeyByValue } from "@/app/nextgen/collection/[collection]/page-utils";
import { ContentView } from "@/components/nextGen/collections/collectionParts/NextGenCollection";
import { render } from "@testing-library/react";
import { usePathname, useRouter } from "next/navigation";
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

jest.mock("@/helpers/Helpers", () => ({
  isEmptyObject: jest.fn(),
}));

jest.mock("@/components/nextGen/nextgen_helpers", () => ({
  formatNameForUrl: jest.fn(),
}));

describe("nextgen collection app router", () => {
  describe("fetchCollection", () => {
    const mockCommonApiFetch = require("@/services/api/common-api").commonApiFetch;
    const mockIsEmptyObject = require("@/helpers/Helpers").isEmptyObject;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("returns null when collection is empty", async () => {
      const mockCollection = {};
      mockCommonApiFetch.mockResolvedValue(mockCollection);
      mockIsEmptyObject.mockReturnValue(true);

      const result = await fetchCollection("test-collection", { "x-test": "header" });

      expect(result).toBeNull();
      expect(mockCommonApiFetch).toHaveBeenCalledWith({
        endpoint: "nextgen/collections/test%20collection",
        headers: { "x-test": "header" },
      });
    });

    it("returns collection when found", async () => {
      const mockCollection = { id: "123", name: "Test Collection" };
      mockCommonApiFetch.mockResolvedValue(mockCollection);
      mockIsEmptyObject.mockReturnValue(false);

      const result = await fetchCollection("test-collection", { "x-test": "header" });

      expect(result).toEqual(mockCollection);
    });

    it("handles collection names with dashes replaced by spaces and URL encoded", async () => {
      const mockCollection = { id: "123", name: "The Memes Collection!" };
      mockCommonApiFetch.mockResolvedValue(mockCollection);
      mockIsEmptyObject.mockReturnValue(false);

      await fetchCollection("the-memes-collection!", { "x-test": "header" });

      expect(mockCommonApiFetch).toHaveBeenCalledWith({
        endpoint: "nextgen/collections/the%20memes%20collection!",
        headers: { "x-test": "header" },
      });
    });

    it("returns null when API throws error", async () => {
      mockCommonApiFetch.mockRejectedValue(new Error("API Error"));

      const result = await fetchCollection("test-collection", { "x-test": "header" });

      expect(result).toBeNull();
    });
  });

  describe("getCollectionView", () => {
    it("returns OVERVIEW for empty string", () => {
      expect(getCollectionView("")).toBe(ContentView.OVERVIEW);
    });

    it("returns correct view for valid view string", () => {
      expect(getCollectionView("about")).toBe(ContentView.ABOUT);
      expect(getCollectionView("ABOUT")).toBe(ContentView.ABOUT);
    });

    it("returns TOP_TRAIT_SETS for special case", () => {
      expect(getCollectionView("top-trait-sets")).toBe(ContentView.TOP_TRAIT_SETS);
    });

    it("returns OVERVIEW for invalid view string", () => {
      expect(getCollectionView("invalid-view")).toBe(ContentView.OVERVIEW);
    });
  });

  describe("getContentViewKeyByValue", () => {
    it("returns correct key for valid content view value", () => {
      const result = getContentViewKeyByValue(ContentView.ABOUT);
      expect(result).toBe("ABOUT");
    });

    it("returns TOP_TRAIT_SETS for trait-sets value", () => {
      const result = getContentViewKeyByValue("trait-sets");
      expect(result).toBe(ContentView.TOP_TRAIT_SETS);
    });

    it("returns OVERVIEW for invalid value", () => {
      const result = getContentViewKeyByValue("invalid-value");
      expect(result).toBe(ContentView.OVERVIEW);
    });
  });

  describe("useShallowRedirect", () => {
    const mockFormatNameForUrl = require("@/components/nextGen/nextgen_helpers").formatNameForUrl;

    beforeEach(() => {
      jest.clearAllMocks();
      mockFormatNameForUrl.mockImplementation((name: string) => {
        return name.replace(/ /g, "-").toLowerCase().replace(/[^a-z0-9-]/g, "");
      });
    });

    it("replaces numeric id with formatted name", () => {
      const replace = jest.fn();
      (useRouter as jest.Mock).mockReturnValue({
        replace,
      });
      (usePathname as jest.Mock).mockReturnValue("/nextgen/collection/123");
      function Test() {
        useShallowRedirect("Cool Name");
        return null;
      }
      render(<Test />);
      expect(replace).toHaveBeenCalledWith("/nextgen/collection/cool-name", {
        scroll: false,
      });
    });

    it("does not redirect when slug is already formatted", () => {
      const replace = jest.fn();
      (useRouter as jest.Mock).mockReturnValue({
        replace,
      });
      (usePathname as jest.Mock).mockReturnValue("/nextgen/collection/cool-name");
      function Test() {
        useShallowRedirect("Cool Name");
        return null;
      }
      render(<Test />);
      expect(replace).not.toHaveBeenCalled();
    });

    it("handles complex collection names with special characters", () => {
      const replace = jest.fn();
      (useRouter as jest.Mock).mockReturnValue({
        replace,
      });
      (usePathname as jest.Mock).mockReturnValue("/nextgen/collection/123/about");
      function Test() {
        useShallowRedirect("The Memês 2023!");
        return null;
      }
      render(<Test />);
      expect(replace).toHaveBeenCalledWith("/nextgen/collection/the-mems-2023/about", {
        scroll: false,
      });
    });

    it("does not redirect when pathname is null or undefined", () => {
      const replace = jest.fn();
      (useRouter as jest.Mock).mockReturnValue({
        replace,
      });
      (usePathname as jest.Mock).mockReturnValue(null);
      function Test() {
        useShallowRedirect("Cool Name");
        return null;
      }
      render(<Test />);
      expect(replace).not.toHaveBeenCalled();
    });
  });
});
