import {
  fetchCollection,
  getCollectionView,
  getContentViewKeyByValue,
} from "@/app/nextgen/collection/[collection]/page-utils";
import { useShallowRedirect } from "@/app/nextgen/collection/[collection]/useShallowRedirect";
import { NextgenCollectionView } from "@/types/enums";
import { render } from "@testing-library/react";

jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));
jest.mock("@/helpers/Helpers", () => ({ isEmptyObject: jest.fn(() => false) }));
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

const { commonApiFetch } = require("@/services/api/common-api");
const { isEmptyObject } = require("@/helpers/Helpers");
const { useRouter, usePathname } = require("next/navigation");

describe("collection utils", () => {
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

  it("maps views correctly", () => {
    expect(getCollectionView("rarity")).toBe(NextgenCollectionView.RARITY);
    expect(getContentViewKeyByValue(NextgenCollectionView.PROVENANCE)).toBe(
      "PROVENANCE"
    );
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
