import { useShallowRedirect } from "@/app/nextgen/collection/[collection]/useShallowRedirect";
import { render } from "@testing-library/react";
import { usePathname, useRouter } from "next/navigation";
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

describe("nextgen collection page helpers", () => {

  describe("useShallowRedirect", () => {
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

    it("does not redirect when pathname already has formatted name", () => {
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

    it("handles empty pathname gracefully", () => {
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

    it("handles paths with view parameter correctly", () => {
      const replace = jest.fn();
      (useRouter as jest.Mock).mockReturnValue({
        replace,
      });
      (usePathname as jest.Mock).mockReturnValue("/nextgen/collection/123/about");
      function Test() {
        useShallowRedirect("Cool Name");
        return null;
      }
      render(<Test />);
      expect(replace).toHaveBeenCalledWith("/nextgen/collection/cool-name/about", {
        scroll: false,
      });
    });
  });
});
