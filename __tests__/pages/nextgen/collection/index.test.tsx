import { render } from "@testing-library/react";
import {
  getServerSideProps,
  useShallowRedirect,
} from "@/pages/nextgen/collection/[collection]/[[...view]]/index";
import { ContentView } from "@/components/nextGen/collections/collectionParts/NextGenCollection";

jest.mock("@/helpers/server.helpers", () => ({
  getCommonHeaders: jest.fn(() => ({ h: "1" })),
}));
jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));
jest.mock("@/helpers/Helpers", () => ({ isEmptyObject: jest.fn(() => false) }));
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));

const { commonApiFetch } = require("@/services/api/common-api");
const { isEmptyObject } = require("@/helpers/Helpers");
const { useRouter, usePathname } = require("next/navigation");

describe("nextgen collection page", () => {
  it("fetches collection and returns props", async () => {
    (commonApiFetch as jest.Mock).mockResolvedValue({
      name: "Cool",
      banner: "b",
    });
    const req = { query: { collection: "Cool" }, req: { cookies: {} } } as any;
    const res = await getServerSideProps(req, {} as any, "/");
    expect(commonApiFetch).toHaveBeenCalled();
    expect(res).toHaveProperty("props.metadata.title", "Cool");
    expect(res.props.view).toBe(ContentView.OVERVIEW);
  });

  it("returns notFound when empty object", async () => {
    (isEmptyObject as jest.Mock).mockReturnValue(true);
    const req = { query: { collection: "c" }, req: { cookies: {} } } as any;
    const res = await getServerSideProps(req, {} as any, "/");
    expect(res).toEqual({ notFound: true, props: {} });
  });

  it("useShallowRedirect replaces url", () => {
    const replaceFn = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      replace: replaceFn,
    });
    (usePathname as jest.Mock).mockReturnValue("/nextgen/collection/1");
    function Comp() {
      useShallowRedirect("Cool");
      return null;
    }
    render(<Comp />);
    expect(replaceFn).toHaveBeenCalledWith("/nextgen/collection/cool");
  });
});
