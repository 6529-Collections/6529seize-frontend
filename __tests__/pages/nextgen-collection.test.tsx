import { render } from "@testing-library/react";
import { useRouter } from "next/router";
jest.mock("next/router", () => ({ useRouter: jest.fn() }));
import { getServerSideProps, useShallowRedirect } from "../../pages/nextgen/collection/[collection]/[[...view]]";
import { formatNameForUrl } from "../../components/nextGen/nextgen_helpers";

describe("nextgen collection page helpers", () => {

  describe("getServerSideProps", () => {
    const commonApiFetch = jest.fn();
    const getCommonHeaders = jest.fn(() => ({ foo: "bar" }));

    beforeEach(() => {
      jest.resetModules();
      jest.doMock("../../services/api/common-api", () => ({
        commonApiFetch,
      }));
      jest.doMock("../../helpers/server.helpers", () => ({ getCommonHeaders }));
    });

    afterEach(() => {
      jest.dontMock("../../services/api/common-api");
      jest.dontMock("../../helpers/server.helpers");
    });

    it("returns notFound when collection empty", async () => {
      commonApiFetch.mockResolvedValue({});
      const result = await (await import("../../pages/nextgen/collection/[collection]/[[...view]]")).getServerSideProps({
        query: { collection: "cool" },
        req: { cookies: {} },
      } as any, null as any, null as any);
      expect(result).toEqual({ notFound: true, props: {} });
    });

    it("returns props when collection found", async () => {
      commonApiFetch.mockResolvedValue({ name: "Cool" });
      const props = await (await import("../../pages/nextgen/collection/[collection]/[[...view]]")).getServerSideProps({
        query: { collection: "cool", view: ["about"] },
        req: { cookies: {} },
      } as any, null as any, null as any);
      expect(props.props.collection).toEqual({ name: "Cool" });
      expect(props.props.metadata!.title).toContain("Cool");
    });
  });

  describe("useShallowRedirect", () => {
    it("replaces numeric id with formatted name", () => {
      const replace = jest.fn();
      (useRouter as jest.Mock).mockReturnValue({ asPath: "/nextgen/collection/123", replace });
      function Test() {
        useShallowRedirect("Cool Name");
        return null;
      }
      render(<Test />);
      expect(replace).toHaveBeenCalledWith({ pathname: "/nextgen/collection/" + formatNameForUrl("Cool Name") }, undefined, { shallow: true });
    });
  });
});
